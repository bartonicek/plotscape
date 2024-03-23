import { MapFn, identity, minMax, prettyBreaks } from "utils";
import { Expanse } from "./Expanse";
import { Emitter, subscribable } from "./mixins/Emitter";

/* -------------------------------- Interface ------------------------------- */

export interface ExpanseContinuous
  extends Expanse<number>,
    Emitter<"limitschanged"> {
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
  setScale(value: number): this;
  setDefaultMin(value: number): this;
  setDefaultMax(value: number): this;
  setTransform(trans: MapFn<number, number>, inv: MapFn<number, number>): this;
  expand(value: number): this;

  defaultize(): this;
  retrain(array: number[]): this;
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
    setDefaultMin,
    setDefaultMax,
    setScale,
    setTransform,
    expand,
    defaultize,
    retrain,
    breaks,
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
  this.emit("limitschanged");
  return this;
}

function setMax(this: ExpanseContinuous, value: number) {
  this.max = value;
  this.emit("limitschanged");
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
  this.emit(`limitschanged`);
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
