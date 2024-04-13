import {
  MapFn,
  diff,
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
import { Expanse } from "./Expanse";

/* -------------------------------- Interface ------------------------------- */

/** Can normalize values from `[min, max]` to `[0, 1]` and vice versa. */
export interface ExpanseContinuous extends Expanse<number>, Observable {
  min: number;
  max: number;
  scale: number;
  direction: Direction;
  defaultMin: number;
  defaultMax: number;
  defaultScale: number;

  trans: MapFn<number, number>;
  inv: MapFn<number, number>;

  clone(): ExpanseContinuous;
  range(): number;
  transRange(): number;
  normalize(value: number): number;
  unnormalize(value: number): number;

  setMin(value: number, options?: { default?: boolean }): this;
  setMax(value: number, options?: { default?: boolean }): this;
  setMinMax(min: number, max: number, options?: { default?: boolean }): this;
  setScale(value: number, options?: { default?: boolean }): this;
  setTransform(trans: MapFn<number, number>, inv: MapFn<number, number>): this;

  freezeMin(): this;
  freezeMax(): this;
  freezeScale(): this;
  freeze(): this;
  flip(): this;
  expand(value: number): this;
  expand2(zero: number, one: number, options?: { default: boolean }): this;

  defaultize(): this;
  retrain(array: number[]): this;

  widget(norm: ExpanseContinuous): RangeWidget;
}

/* ------------------------------- Constructor ------------------------------ */

export function newExpanseContinuous(min = 0, max = 1): ExpanseContinuous {
  const tag = `ExpanseContinuous`;
  const [defaultMin, defaultMax, scale, defaultScale] = [min, max, 1, 1];
  const direction = Direction.Forward;
  const [trans, inv] = [identity, identity];
  const props = {
    [Symbol.toStringTag]: tag,
    min,
    max,
    scale,
    defaultMin,
    defaultMax,
    defaultScale,
    direction,
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
    setTransform,
    freezeMin,
    freezeMax,
    freezeScale,
    freeze,
    flip,
    expand,
    expand2,
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
  const { min, scale, direction: dir, trans } = this;
  const normalized = (trans(value) - trans(min)) / this.transRange() / scale;
  return dir + (-2 * dir + 1) * normalized;
}

function unnormalize(this: ExpanseContinuous, value: number) {
  const { min, max, scale, direction: dir, trans, inv } = this;
  const unnormalized = inv(trans(min) + value * this.transRange()) * scale;
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
  value: number,
  options?: { default?: boolean }
) {
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

function freeze(this: ExpanseContinuous) {
  return this.freezeMin().freezeMax().freezeScale();
}

function flip(this: ExpanseContinuous) {
  this.direction = flipEnum(this.direction);
  return this;
}

function expand(this: ExpanseContinuous, value: number) {
  const { min, max } = this;
  const range = this.range();
  const inc = ((value - 1) * range) / 2;
  this.setMinMax(min - inc, max + inc, { default: true });
  return this;
}

function expand2(
  this: ExpanseContinuous,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  const { min, max } = this;
  const range = this.range();

  this.setMinMax(min + zero * range, max - (1 - one) * range, options);
  return this;
}

function defaultize(this: ExpanseContinuous) {
  this.min = this.defaultMin;
  this.max = this.defaultMax;
  this.scale = this.defaultScale;
  this.emit();
  return this;
}

function retrain(this: ExpanseContinuous, array: number[]) {
  const [min, max] = minMax(array);
  const def = { default: true };
  untrack(this, () => this.setMin(min, def).setMax(max, def));
  this.emit();
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

function breaks(this: ExpanseContinuous, norm: ExpanseContinuous) {
  let [min, max] = [norm.normalize(0), norm.normalize(1)];
  [min, max] = [min, max].map((x) => this.unnormalize(x)).sort(diff);
  return prettyBreaks(min, max);
}

function widget(this: ExpanseContinuous, norm: ExpanseContinuous) {
  const [min, max] = [0, 1].map((x) => this.unnormalize(norm.normalize(x)));

  const source = observable({ min, max });
  const widget = newRangeWidget(source);

  const update = () => {
    const [min, max] = [0, 1].map((x) => this.unnormalize(norm.normalize(x)));
    source.min = min;
    source.max = max;
    source.emit();
  };

  this.listen(update);
  norm.listen(update);

  widget.listen(() => {
    let { min, max, direction } = widget;

    // TODO
    if (direction != norm.direction) {
      norm.flip();
      this.emit();
      return;
    }

    source.min = min;
    source.max = max;

    [min, max] = [min, max].sort(diff).map(this.normalize.bind(this));
    [min, max] = invertRange(min, max);

    norm.setMinMax(min, max);
  });

  return widget;
}
