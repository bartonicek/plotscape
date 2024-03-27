export interface Proxyable<T = unknown> {
  n(): number;
  valueAt(index: number, offset?: number): T;

  source?: Proxyable<T>;
  indexfn?: () => number[];
  proxy(indexfn: () => number[]): this;
}

export function proxyable<
  T extends { n(): number; valueAt(index: number, offset?: number): any }
>(base: T): T & Proxyable<ReturnType<T["valueAt"]>> {
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
