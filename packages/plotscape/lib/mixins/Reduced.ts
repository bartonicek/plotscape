import { ReducerHandler } from "../reducers/ReducerHandler";

/** A set of summaries on some partitioned data obtained by applying
 * a reduce operation. Can have a reference to a parent reducer,
 * in which case it can be stacked, normalized, or return a copy
 * of the values of the parent reducer.
 */
export interface Reduced<T = unknown> {
  valueAt(index: number, offset?: number): T;

  reducer?: ReducerHandler;
  setReducer(reducer: ReducerHandler): this;

  stack(): this;
  normalizeByParent(): this;
  parent(): this;
  shiftLeft(): this;

  indexfn?(): number[];
}

export function reduced<
  T extends {
    reducer?: ReducerHandler;
    valueAt(index: number, offset?: number): any;
  }
>(variable: T): T & Reduced<ReturnType<T["valueAt"]>> {
  const methods = { setReducer, stack, normalizeByParent, shiftLeft, parent };
  return { ...variable, ...methods } as T & Reduced<ReturnType<T["valueAt"]>>;
}

function setReducer<T>(this: Reduced<T>, reducer: ReducerHandler) {
  this.reducer = reducer;
  return this;
}

function stack<T>(this: Reduced<T>) {
  if (!this.reducer) return this;

  const reducer = this.reducer.stack();
  let result = reducer.result;
  if (this.indexfn) result = result.proxy(this.indexfn);

  return result;
}

function normalizeByParent<T>(this: Reduced<T>) {
  if (!this.reducer) return this;

  const reducer = this.reducer.normalizeByParent();
  let result = reducer.result;
  if (this.indexfn) result = result.proxy(this.indexfn);

  return reducer.result;
}

function shiftLeft<T>(this: Reduced<T>) {
  if (!this.reducer) return this;

  const original = this;
  const copy = { ...this };

  copy.valueAt = function (index: number) {
    if (index === 0) return copy.reducer?.reducer.initialfn();
    return original.valueAt(index, -1);
  };

  return copy;
}

function parent<T>(this: Reduced<T>) {
  const { reducer } = this;

  if (!reducer) return this;
  const { parent, factor } = reducer;

  if (!parent || !factor || !factor.parent) return this;

  const parentReducerCopy = parent.clone();
  const copy = parentReducerCopy.result.proxy(() => factor.parent!.levels);

  return reduced(copy);
}
