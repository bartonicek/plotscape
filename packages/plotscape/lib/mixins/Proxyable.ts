/** Can intercept indexed access to values.
 * Specifically, if an object has a `valueAt(index: number): T` method,
 * `.proxy(indexfn: () => number[])` makes it so that the accessed
 * indices are rerouted through the indices returned by `indexfn`.
 *
 * (`indexfn` is a callback so that it can be used as a pointer
 * to a mutable object).
 * */
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
  return { ...base, proxy } satisfies T & Proxyable<ReturnType<T["valueAt"]>>;
}

function proxy<T>(this: Proxyable<T>, indexfn: () => number[]) {
  const source = this;
  const copy = { ...this, source, indexfn, n, valueAt, proxy };
  return copy;
}

function n<T>(this: Proxyable<T>) {
  return this.indexfn!().length;
}

function valueAt<T>(this: Proxyable<T>, index: number, offset = 0) {
  return this.source!.valueAt(this.indexfn!()[index], offset);
}
