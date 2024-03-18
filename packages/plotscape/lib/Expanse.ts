export interface Expanse<T> {
  normalize(value: T): number;
  unnormalize(value: number): T;
}
