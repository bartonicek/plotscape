import { Variable } from "../variables/Variable";

export interface Proxyable<T> extends Variable<T> {
  source?: Variable<T>;
  proxyIndices?: number[];
  proxy(indices: number[]): this;
}

export function proxyable<T extends Variable>(variable: T) {
  return { ...variable, proxy } as T & Proxyable<ReturnType<T["valueAt"]>>;
}

function proxy<T>(this: Proxyable<T>, indices: number[]) {
  const source = this;
  const copy = { ...this, proxyIndices: indices };

  copy.n = function () {
    return this.proxyIndices.length;
  };

  copy.valueAt = function (index: number) {
    return this.source!.valueAt(this.proxyIndices[index]);
  };

  return proxyable({ ...copy, source });
}
