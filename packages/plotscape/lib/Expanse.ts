export interface Expanse<T = unknown> {
  normalize(value: T): number;
  unnormalize(value: number): T;
  retrain(array: T[]): void;
  clone(): Expanse<T>;
  setMin?(value: number): this;
  setMax?(value: number): this;
}
