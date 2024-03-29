import { MapFn } from "utils";
import { Observable } from "../mixins/Observable";
import { Widget } from "../widgets/Widget";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpanseDiscreteWeighted } from "./ExpanseDiscreteWeighted";

export interface Expanse<T = unknown> extends Observable {
  order?: number[];

  clone(): Expanse<T>;
  normalize(value: T): number;
  unnormalize(value: number): T;
  retrain(array: T[]): void;
  breaks(norm: ExpanseContinuous): T[];
  range?(): number;

  setMin?(value: number): this;
  setMax?(value: number): this;
  setDefaultMin?(value: number): this;
  setDefaultMax?(value: number): this;
  setTransform?(trans: MapFn<number, number>, inv: MapFn<number, number>): this;
  expand?(value: number): this;

  setWeights?(weights: number[]): this;
  setOrder?(indices: number[]): this;
  setDefaultWeights?(): this;
  setDefaultOrder?(): this;

  widget(norm: ExpanseContinuous): Widget | undefined;
}

export function isExpanseContinuous(
  expanse: Expanse
): expanse is ExpanseContinuous {
  return !!expanse.setMin;
}

export function isExpanseDiscreteWeighted(
  expanse: Expanse
): expanse is ExpanseDiscreteWeighted {
  return !!expanse.setWeights;
}
