import { Variable } from "../variables/Variable";

export interface Proxyable<T> extends Variable<T> {
  proxyIndices?: number[];

  indicesPointer?: { proxyIndices: number[] };
  proxy(indices: number[]): this;
}

export function proxyable<T extends Variable>(variable: T) {
  return { ...variable, proxy } as T & Proxyable<ReturnType<T["valueAt"]>>;
}

function proxy<T>(this: Proxyable<T>, indices: number[]) {
  const original = this;
  const copy = { ...this, proxyIndices: indices };

  copy.n = function () {
    return this.proxyIndices.length;
  };

  copy.valueAt = function (index: number) {
    return original.valueAt(this.proxyIndices[index]);
  };

  return proxyable({ ...copy });
}
