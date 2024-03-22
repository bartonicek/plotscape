import { Variable } from "../variables/Variable";
import { ReducerHandler } from "./ReducerHandler";

export interface Reduced {
  reducer?: ReducerHandler;
  setReducer(reducer: ReducerHandler): this;

  stack(): this;
  normalizeByParent(): this;
  parent(): this;
  shiftLeft(): this;

  source?: any;
  indexfn?(): number[];
}

export function reduced<T extends Variable>(variable: T): T & Reduced {
  return {
    ...variable,
    setReducer,
    stack,
    normalizeByParent,
    shiftLeft,
    parent,
  };
}

function setReducer(this: Reduced, reducer: ReducerHandler) {
  this.reducer = reducer;
  return this;
}

function stack<T extends Variable>(this: T & Reduced) {
  if (!this.reducer) return this;
  const reducer = this.reducer.stack();
  let result = reducer.result;
  if (this.indexfn) result = result.proxy(this.indexfn);

  return result;
}

function normalizeByParent(this: Reduced) {
  if (!this.reducer) return this;
  const reducer = this.reducer.normalizeByParent();
  let result = reducer.result;
  if (this.indexfn) result = result.proxy(this.indexfn);

  return reducer.result;
}

function shiftLeft(this: Reduced) {
  if (!this.reducer) return this;
  const original = this as any;
  const copy = { ...this } as any;

  copy.valueAt = function (index: number) {
    if (index === 0) return copy.reducer?.reducer.initialfn();
    return original.valueAt(index, -1);
  };

  return copy;
}

function parent(this: Reduced) {
  const { reducer } = this;

  if (!reducer) return this;
  const { parent, factor } = reducer;

  if (!parent || !factor || !factor.parent) return this;

  const parentReducerCopy = parent.clone();
  const copy = parentReducerCopy.result.proxy(() => factor.parent!.levels);

  return reduced(copy);
}
