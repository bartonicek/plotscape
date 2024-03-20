import { ExpanseContinuous } from "./ExpanseContinuous";

export interface Expanse<T = unknown> {
  clone(): Expanse<T>;
  normalize(value: T): number;
  unnormalize(value: number): T;
  retrain(array: T[]): void;
  breaks(norm: ExpanseContinuous): T[];
  setMin?(value: number): this;
  setMax?(value: number): this;
}
