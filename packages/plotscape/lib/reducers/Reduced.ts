import { Variable } from "../variables/Variable";
import { ReducerHandler } from "./ReducerHandler";

export interface Reduced {
  reducer?: ReducerHandler;
  setReducer(reducer: ReducerHandler): this;
  stack(): this;
  normalizeByParent(): this;
}

export function reduced<T extends Variable>(variable: T): T & Reduced {
  return { ...variable, setReducer, stack, normalizeByParent };
}

function setReducer(this: Reduced, reducer: ReducerHandler) {
  this.reducer = reducer;
  return this;
}

function stack<T extends Variable>(this: T & Reduced) {
  if (this.reducer) {
    const reducer = this.reducer.stack();
    return reducer.result;
  }
  return this;
}

function normalizeByParent(this: Reduced) {
  if (this.reducer) {
    const reducer = this.reducer.normalizeByParent();
    return reducer.result;
  }
  return this;
}
