import { MapFn, identity, invertRange, minMax, prettyBreaks } from "utils";
import { Emitter, subscribable, untrack } from "../mixins/Emitter";
import { RangeWidget, newRangeWidget } from "../widgets/RangeWidget";
import { Expanse } from "./Expanse";

/* -------------------------------- Interface ------------------------------- */

export interface ExpanseContinuous extends Expanse<number>, Emitter<"changed"> {
  min: number;
  max: number;
  scale: number;
  defaultMin: number;
  defaultMax: number;
  trans: MapFn<number, number>;
  inv: MapFn<number, number>;

  clone(): ExpanseContinuous;
  range(): number;
  normalize(value: number): number;
  unnormalize(value: number): number;

  setMin(value: number): this;
  setMax(value: number): this;
  setMinMax(min: number, max: number): this;
  setScale(value: number): this;
  setDefaultMin(value: number): this;
  setDefaultMax(value: number): this;
  setTransform(trans: MapFn<number, number>, inv: MapFn<number, number>): this;
  expand(value: number): this;

  defaultize(): this;
  retrain(array: number[]): this;

  widget(norm: ExpanseContinuous): RangeWidget;
}

/* ------------------------------- Constructor ------------------------------ */

export function newExpanseContinuous(min = 0, max = 1): ExpanseContinuous {
  const [defaultMin, defaultMax, scale] = [min, max, 1];
  const [trans, inv] = [identity, identity];

  const props = {
    min,
    max,
    scale,
    defaultMin,
    defaultMax,
    trans,
    inv,
  };

  const methods = {
    clone,
    range,
    normalize,
    unnormalize,
    setMin,
    setMax,
    setMinMax,
    setDefaultMin,
    setDefaultMax,
    setScale,
    setTransform,
    expand,
    defaultize,
    retrain,
    breaks,
    widget,
  };
  const self = { ...props, ...methods };

  return subscribable(self);
}

/* --------------------------------- Methods -------------------------------- */

function range(this: ExpanseContinuous) {
  return this.trans(this.max - this.min);
}

function normalize(this: ExpanseContinuous, value: number) {
  return (this.trans(value) - this.trans(this.min)) / this.range() / this.scale;
}

function unnormalize(this: ExpanseContinuous, value: number) {
  return this.inv(this.min) + this.inv(value * this.range()) * this.scale;
}

function setMin(this: ExpanseContinuous, value: number) {
  this.min = value;
  this.emit("changed");
  return this;
}

function setMax(this: ExpanseContinuous, value: number) {
  this.max = value;
  this.emit("changed");
  return this;
}

function setMinMax(this: ExpanseContinuous, min: number, max: number) {
  untrack(this, () => this.setMin(min).setMax(max));
  this.emit(`changed`);
  return this;
}

function setDefaultMin(this: ExpanseContinuous, value: number) {
  this.defaultMin = value;
  this.setMin(value);
  return this;
}

function setDefaultMax(this: ExpanseContinuous, value: number) {
  this.defaultMax = value;
  this.setMax(value);
  return this;
}

function setScale(this: ExpanseContinuous, value: number) {
  this.scale = value;
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

function expand(this: ExpanseContinuous, value: number) {
  const { min, max } = this;
  const range = this.range();
  const inc = ((value - 1) * range) / 2;
  this.setDefaultMin(min - inc).setDefaultMax(max + inc);
  return this;
}

function defaultize(this: ExpanseContinuous) {
  this.min = this.defaultMin;
  this.max = this.defaultMax;
  this.emit(`changed`);
  return this;
}

function retrain(this: ExpanseContinuous, array: number[]) {
  const [min, max] = minMax(array);
  this.setDefaultMin(min).setDefaultMax(max);
  return this;
}

function clone(this: ExpanseContinuous) {
  const result = newExpanseContinuous();
  result.setDefaultMin(this.defaultMin).setDefaultMax(this.defaultMax);
  result.setTransform(this.trans, this.inv);
  return result;
}

function breaks(this: ExpanseContinuous, norm: ExpanseContinuous) {
  let [min, max] = [norm.normalize(0), norm.normalize(1)];
  min = this.unnormalize(min);
  max = this.unnormalize(max);
  return prettyBreaks(min, max);
}

function widget(this: ExpanseContinuous, norm: ExpanseContinuous) {
  let [min, max] = [norm.normalize(0), norm.normalize(1)];
  min = this.unnormalize(min);
  max = this.unnormalize(max);

  const source = subscribable({ min, max });

  const widget = newRangeWidget(source);
  widget.listen(`changed`, () => {
    let [min, max] = [widget.min(), widget.max()];
    source.min = min;
    source.max = max;

    min = this.normalize(min);
    max = this.normalize(max);
    [min, max] = invertRange(min, max);

    norm.setMin(min).setMax(max);
  });

  return widget;
}
