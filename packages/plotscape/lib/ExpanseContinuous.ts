import { minMax } from "utils";
import { Expanse } from "./Expanse";
import { Emitter, subscribable } from "./mixins/Emitter";

export interface ExpanseContinuous
  extends Expanse<number>,
    Emitter<"limitschanged"> {
  min: number;
  max: number;
  defaultMin: number;
  defaultMax: number;
  source?: number[];
  range(): number;
  normalize(value: number): number;
  unnormalize(value: number): number;
  setMin(value: number): this;
  setMax(value: number): this;
  setDefaultMin(value: number): this;
  setDefaultMax(value: number): this;
  defaultize(): this;
  retrain(array: number[]): this;
  clone(): ExpanseContinuous;
}

export function newExpanseContinuous(min = 0, max = 1): ExpanseContinuous {
  const self = {
    min,
    max,
    defaultMin: min,
    defaultMax: max,
    range,
    normalize,
    unnormalize,
    setMin,
    setMax,
    setDefaultMin,
    setDefaultMax,
    defaultize,
    retrain,
    clone,
  };

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
  this.emit("limitschanged");
  return this;
}

function setDefaultMax(this: ExpanseContinuous, value: number) {
  this.defaultMax = value;
  this.emit("limitschanged");
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
