export interface Indexable<T> {
  array: T[];
  n(): number;
  valueAt(index: number, secondaryIndex?: number): T;
  values(): T[];
}

export function indexable<T extends { array: unknown[] }>(
  object: T
): T & Indexable<T["array"][number]> {
  return { ...object, n, valueAt, values };
}

function n(this: Indexable<any>) {
  return this.array.length;
}

function valueAt<T>(this: Indexable<T>, index: number) {
  return this.array[index];
}

function values<T>(this: Indexable<T>) {
  const n = this.n();
  const result = [] as T[];
  for (let i = 0; i < n; i++) result.push(this.valueAt(i));
  return result;
}
