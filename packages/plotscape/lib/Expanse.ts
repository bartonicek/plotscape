import { MapFn } from "utils";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface Expanse<T = unknown> {
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
}

export function isExpanseContinuous(
  expanse: Expanse
): expanse is ExpanseContinuous {
  return expanse.setMin != undefined;
}
