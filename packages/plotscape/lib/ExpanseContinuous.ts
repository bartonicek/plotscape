import { minMax, prettyBreaks } from "utils";
import { Expanse } from "./Expanse";
import { Emitter, subscribable } from "./mixins/Emitter";

export interface ExpanseContinuous
  extends Expanse<number>,
    Emitter<"limitschanged"> {
  min: number;
  max: number;
  defaultMin: number;
  defaultMax: number;
  limitMin: number;
  limitMax: number;
  clone(): ExpanseContinuous;
  range(): number;
  normalize(value: number): number;
  unnormalize(value: number): number;
  setMin(value: number): this;
  setMax(value: number): this;
  setDefaultMin(value: number): this;
  setDefaultMax(value: number): this;
  setLimitMin(value: number): this;
  setLimitMax(value: number): this;
  defaultize(): this;
  retrain(array: number[]): this;
}

export function newExpanseContinuous(min = 0, max = 1): ExpanseContinuous {
  const [defaultMin, defaultMax] = [min, max];
  const [limitMin, limitMax] = [-Infinity, Infinity];

  const props = { min, max, defaultMin, defaultMax, limitMin, limitMax };
  const methods = {
    clone,
    range,
    normalize,
    unnormalize,
    setMin,
    setMax,
    setDefaultMin,
    setDefaultMax,
    setLimitMin,
    setLimitMax,
    defaultize,
    retrain,
    breaks,
  };
  const self = { ...props, ...methods };

  return subscribable(self);
}

function range(this: ExpanseContinuous) {
  return this.max - this.min;
}

function normalize(this: ExpanseContinuous, value: number) {
  return (value - this.min) / this.range();
}

function unnormalize(this: ExpanseContinuous, value: number) {
  return this.min + value * this.range();
}

function setMin(this: ExpanseContinuous, value: number) {
  this.min = Math.max(this.limitMin, value);
  this.emit("limitschanged");
  return this;
}

function setMax(this: ExpanseContinuous, value: number) {
  this.max = Math.min(this.limitMax, value);
  this.emit("limitschanged");
  return this;
}

function setDefaultMin(this: ExpanseContinuous, value: number) {
  this.defaultMin = value;
  return this;
}

function setDefaultMax(this: ExpanseContinuous, value: number) {
  this.defaultMax = value;
  return this;
}

function setLimitMin(this: ExpanseContinuous, value: number) {
  this.limitMin = value;
  return this;
}

function setLimitMax(this: ExpanseContinuous, value: number) {
  this.limitMax = value;
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
  this.setMin(min).setMax(max);
  return this;
}

function clone(this: ExpanseContinuous) {
  return newExpanseContinuous(this.min, this.max);
}

function breaks(this: ExpanseContinuous, norm: ExpanseContinuous) {
  let [min, max] = [norm.normalize(0), norm.normalize(1)];
  min = this.unnormalize(min);
  max = this.unnormalize(max);
  return prettyBreaks(min, max);
}
