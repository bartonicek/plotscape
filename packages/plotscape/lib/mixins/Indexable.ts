import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";

export interface Indexable<T> {
  domain: Expanse<T>;
  array: T[];
  n(): number;
  values(): T[];
  valueAt(index: number, offset?: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
  retrain(array: T[]): void;
}

export function indexable<T extends { array: unknown[]; domain: Expanse }>(
  object: T
) {
  return { ...object, n, values, valueAt, scaledAt, retrain } as T &
    Indexable<T["array"][number]>;
}

function n<T>(this: Indexable<T>) {
  return this.array.length;
}

function values<T>(this: Indexable<T>) {
  const n = this.n();
  const result = [] as T[];
  for (let i = 0; i < n; i++) result.push(this.valueAt(i));
  return result;
}

function valueAt<T>(this: Indexable<T>, index: number, offset = 0) {
  // Offset is necessary if we want to drill through a proxy
  // i.e. proxied.valueAt(index - 1) doesn't work
  return this.array[index + offset];
}

function scaledAt<T>(this: Indexable<T>, index: number, scale: Scale<T>) {
  return scale.pushforward(this.valueAt(index));
}

function retrain<T>(this: Indexable<T>, array: T[]) {
  this.domain.retrain(array);
}
