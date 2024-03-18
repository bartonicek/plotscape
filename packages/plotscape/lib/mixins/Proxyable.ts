import { Indexable } from "./Indexable";

export interface Proxyable<T> extends Indexable<T> {
  proxy(indices: number[]): this;
}

export function proxyable<T extends Indexable<unknown>>(
  indexable: T
): T & Proxyable<T["array"][number]> {
  return { ...indexable, proxy };
}

function proxy<T extends Proxyable<any>>(this: T, indices: number[]) {
  const original = this;
  const copy = { ...this };

  copy.n = function () {
    return indices.length;
  };

  copy.valueAt = function (index: number) {
    return original.valueAt(indices[index]);
  };

  return proxyable(copy);
}
