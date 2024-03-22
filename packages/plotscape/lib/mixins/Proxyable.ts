type Base<T = unknown> = {
  n?(): number;
  valueAt(index: number): T;
};

export interface Proxyable<T> extends Base<T> {
  source?: Base<T>;
  proxyIndices?: number[];
  proxy(indices: number[]): this;
}

export function proxyable<T extends Base>(
  base: T
): T & Proxyable<ReturnType<Base["valueAt"]>> {
  return { ...base, proxy };
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

  return { ...proxyable(copy), source };
}
