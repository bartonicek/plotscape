import {
  MapFn,
  capitalize,
  diff,
  entries,
  flipEnum,
  identity,
  invertRange,
  minMax,
  noopThis,
  prettyBreaks,
} from "utils";
import { Observable, observable, untrack } from "../mixins/Observable";
import { Direction } from "../types";
import { RangeWidget, newRangeWidget } from "../widgets/RangeWidget";
import {
  Expanse,
  ExpanseType,
  expand,
  freeze,
  freezeOne,
  freezeZero,
  link,
  move,
  setOne,
  setZero,
  setZeroOne,
} from "./Expanse";

/* -------------------------------- Interface ------------------------------- */

/** Can normalize values from `[min, max]` to `[0, 1]` and vice versa. */
export interface ExpanseContinuous extends Expanse<number>, Observable {
  min: number;
  max: number;
  zero: number;
  one: number;
  scale: number;
  direction: Direction;
  defaultMin: number;
  defaultMax: number;
  defaultZero: number;
  defaultOne: number;
  defaultScale: number;
  frozen: { min: boolean; max: boolean; scale: boolean };

  trans: MapFn<number, number>;
  inv: MapFn<number, number>;

  clone(): ExpanseContinuous;
  range(): number;
  transRange(): number;
  normalize(value: number): number;
  unnormalize(value: number): number;
  defaultize(options?: { min?: boolean; max?: boolean; scale?: boolean }): this;

  setMin(value: number, options?: { default?: boolean }): this;
  setMax(value: number, options?: { default?: boolean }): this;
  setMinMax(min: number, max: number, options?: { default?: boolean }): this;
  setScale(value: number, options?: { default?: boolean }): this;
  setScale(
    value: (prev: number) => number,
    options?: { default?: boolean }
  ): this;
  setTransform(trans: MapFn<number, number>, inv: MapFn<number, number>): this;

  freezeMin(): this;
  freezeMax(): this;
  freezeScale(): this;
  link(other: ExpanseContinuous): this;
  flip(): this;

  retrain(array: number[]): this;
  widget(): RangeWidget;
  [Symbol.toStringTag]: string;
}

/* ------------------------------- Constructor ------------------------------ */

export function newExpanseContinuous(min = 0, max = 1): ExpanseContinuous {
  const [defaultMin, defaultMax, scale, defaultScale] = [min, max, 1, 1];
  const [zero, one, defaultZero, defaultOne] = [0, 1, 0, 1];
  const direction = Direction.Forward;
  const frozen = { min: false, max: false, scale: false };
  const [trans, inv] = [identity, identity];
  const props = {
    min,
    max,
    zero,
    one,
    scale,
    defaultMin,
    defaultMax,
    defaultZero,
    defaultOne,
    defaultScale,
    direction,
    frozen,
    [Symbol.toStringTag]: ExpanseType.Continuous,
  };

  const methods = {
    clone,
    range,
    transRange,
    normalize,
    unnormalize,
    defaultize,
    trans,
    inv,
    setMin,
    setMax,
    setScale,
    setMinMax,
    setZero,
    setOne,
    setZeroOne,
    setTransform,
    link,
    freezeZero,
    freezeOne,
    freeze,
    freezeMin,
    freezeMax,
    freezeScale,
    flip,
    expand,
    move,
    retrain,
    breaks,
    widget,
  };
  const self = { ...props, ...methods };

  return observable(self);
}

/* --------------------------------- Methods -------------------------------- */

function range(this: ExpanseContinuous) {
  return this.max - this.min;
}

function transRange(this: ExpanseContinuous) {
  return this.trans(this.max) - this.trans(this.min);
}

function normalize(this: ExpanseContinuous, value: number) {
  const { min, zero, one, scale, direction: dir, trans } = this;
  const range = this.transRange();
  let normalized = (trans(value) - trans(min)) / range / scale;
  normalized = zero + normalized * (one - zero);
  return dir + (-2 * dir + 1) * normalized;
}

function unnormalize(this: ExpanseContinuous, value: number) {
  const { min, max, one, zero, scale, direction: dir, trans, inv } = this;
  const pct = (value - zero) / (one - zero);
  let unnormalized = inv(trans(min) + pct * this.transRange()) * scale;
  return max * dir + (-2 * dir + 1) * unnormalized + dir * min;
}

function setMin(
  this: ExpanseContinuous,
  value: number,
  options?: { default?: boolean }
) {
  this.min = value;
  if (options?.default) this.defaultMin = value;
  this.emit();
  return this;
}

function setMax(
  this: ExpanseContinuous,
  value: number,
  options?: { default?: boolean }
) {
  this.max = value;
  if (options?.default) this.defaultMax = value;
  this.emit();
  return this;
}

function setMinMax(
  this: ExpanseContinuous,
  min: number,
  max: number,
  options?: { default: boolean }
) {
  untrack(this, () => this.setMin(min, options).setMax(max, options));
  this.emit();
  return this;
}

function setScale(
  this: ExpanseContinuous,
  value: number | ((prev: number) => number),
  options?: { default?: boolean }
) {
  value = typeof value === "number" ? value : value(this.scale);
  this.scale = value;
  if (options?.default) this.defaultScale = value;
  this.emit();
  return this;
}

function setTransform(
  this: ExpanseContinuous,
  trans: MapFn<number, number>,
  inv: MapFn<number, number>
) {
  this.trans = trans;
  this.inv = inv;
  return this;
}

function freezeMin(this: ExpanseContinuous) {
  this.setMin = noopThis;
  return this;
}

function freezeMax(this: ExpanseContinuous) {
  this.setMax = noopThis;
  return this;
}

function freezeScale(this: ExpanseContinuous) {
  this.setScale = noopThis;
  return this;
}

function flip(this: ExpanseContinuous) {
  this.direction = flipEnum(this.direction);
  return this;
}

const defaultOptions = {
  min: true,
  max: true,
  scale: true,
  zero: true,
  one: true,
};

function defaultize(
  this: ExpanseContinuous,
  options: {
    min?: boolean;
    max?: boolean;
    scale?: boolean;
    zero?: boolean;
    one?: boolean;
  }
) {
  const opts = Object.assign(defaultOptions, options);

  for (const [k, v] of entries(opts)) {
    if (v) this[k] = this[`default${capitalize(k)}`];
  }

  this.emit();
  return this;
}

function retrain(this: ExpanseContinuous, array: number[]) {
  const [min, max] = minMax(array);
  const def = { default: true };
  this.setMinMax(min, max, def);
  return this;
}

function clone(this: ExpanseContinuous) {
  const { defaultMin, defaultMax, trans, inv } = this;
  const result = newExpanseContinuous();
  const def = { default: true };
  result.setMin(defaultMin, def).setMax(defaultMax, def);
  result.setTransform(trans, inv);
  return result;
}

function breaks(this: ExpanseContinuous) {
  const [min, max] = [0, 1].map((x) => this.unnormalize(x)).sort(diff);
  return prettyBreaks(min, max);
}

function widget(this: ExpanseContinuous) {
  const [min, max] = [0, 1].map((x) => this.unnormalize(x));

  const source = observable({ min, max });
  const widget = newRangeWidget(source);

  const update = () => {
    const [min, max] = [0, 1].map((x) => this.unnormalize(x));
    source.min = min;
    source.max = max;
    source.emit();
  };

  this.listen(update);

  widget.listen(() => {
    let { min, max, direction } = widget;

    if (direction != this.direction) {
      this.flip();
      this.emit();
      return;
    }

    source.min = min;
    source.max = max;

    [min, max] = [min, max].sort(diff).map(this.normalize.bind(this));
    [min, max] = invertRange(min, max);

    this.setZeroOne(min, max);
  });

  return widget;
}
