type Base<T = unknown> = {
  valueAt(index: number, offset?: number): T;
};

export interface Proxyable<T = unknown> extends Base<T> {
  source?: Base<T>;
  indexfn?: () => number[];
  proxy(indexfn: () => number[]): this;
}

export function proxyable<T extends Base>(
  base: T
): T & Proxyable<ReturnType<Base["valueAt"]>> {
  return { ...base, proxy };
}

function proxy<T>(this: Proxyable<T>, indexfn: () => number[]) {
  const source = this;
  const copy = { ...this, indexfn };

  // @ts-ignore
  copy.n = function () {
    return this.indexfn().length;
  };

  copy.valueAt = function (index: number, offset: number) {
    return this.source!.valueAt(this.indexfn()[index], offset);
  };

  return { ...proxyable(copy), source };
}
