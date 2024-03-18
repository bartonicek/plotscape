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

function stack(this: Reduced) {
  if (this.reducer) {
    this.reducer = this.reducer.stack();
    // @ts-ignore
    this.array = this.reducer.result.array;
  }
  return this;
}

function normalizeByParent(this: Reduced) {
  if (this.reducer) {
    this.reducer = this.reducer.normalizeByParent();
    // @ts-ignore
    this.array = this.reducer.result.array;
  }
  return this;
}
