import { Indexable } from "./Indexable";

export interface Proxyable<T> extends Indexable<T> {
  proxyIndices?: number[];
  proxy(indices: number[]): this;
}

export function proxyable<T extends Indexable<unknown>>(
  indexable: T
): T & Proxyable<T["array"][number]> {
  return { ...indexable, proxy };
}

function proxy<T extends Proxyable<any>>(this: T, indices: number[]) {
  const original = this;
  const copy = { ...this, proxyIndices: indices };

  copy.n = function () {
    return this.proxyIndices.length;
  };

  copy.valueAt = function (index: number) {
    return original.valueAt(this.proxyIndices[index]);
  };

  return proxyable(copy);
}
