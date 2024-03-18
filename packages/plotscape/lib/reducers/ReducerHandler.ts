import { Factor } from "../factors/Factor";
import { InferVariable } from "../types";
import { newContinuous } from "../variables/Continuous";
import { newDiscrete } from "../variables/Discrete";
import { newReference } from "../variables/Reference";
import { Reduced, reduced } from "./Reduced";
import { Reducer } from "./Reducer";

export interface ReducerHandler<T = any, U = any> {
  factor?: Factor;
  parent?: ReducerHandler<T, U>;
  reducer: Reducer<T, U>;
  source: InferVariable<T>;
  result: InferVariable<U> & Reduced;

  clone(): ReducerHandler<T, U>;
  setParent(parent: ReducerHandler<T, U>): this;
  setFactor(factor: Factor): this;

  stacked: boolean;
  normalized: boolean;
  recompute(): this;
  stack(): this;
  normalizeByParent(): this;
}

export function newReducerHandler<T, U>(
  source: InferVariable<T>,
  reducer: Reducer<T, U>
): ReducerHandler<T, U> {
  const constructor = parseVariable(reducer.initialfn());
  const result = reduced(constructor([])) as unknown as InferVariable<U> &
    Reduced;

  const reducerHandler = {
    reducer,
    source,
    result,
    clone,
    setParent,
    setFactor,
    stacked: false,
    normalized: false,
    recompute,
    stack,
    normalizeByParent,
  };

  reducerHandler.result.setReducer(reducerHandler);
  return reducerHandler;
}

function setFactor<T, U>(this: ReducerHandler<T, U>, factor: Factor) {
  this.factor = factor;
  return this;
}

function setParent<T, U>(
  this: ReducerHandler<T, U>,
  parent: ReducerHandler<T, U>
) {
  this.parent = parent;
  return this;
}

function clone<T, U>(this: ReducerHandler<T, U>): ReducerHandler<T, U> {
  const { source, reducer, factor, parent } = this;

  const copy = newReducerHandler(source, reducer);
  copy.result.array = [...this.result.array];

  if (factor) copy.setFactor(factor);
  if (parent) copy.setParent(parent);

  return copy;
}

function recompute<T, U>(this: ReducerHandler<T, U>) {
  const { factor, source, result, reducer, parent } = this;
  if (factor === undefined) throw new Error(`Factor has not been registered`);

  const { cardinality } = factor;
  const array = result.array as U[];
  array.length = cardinality;

  for (let i = 0; i < cardinality; i++) array[i] = reducer.initialfn();

  const n = source.n();

  for (let i = 0; i < n; i++) {
    const level = factor.levelAt(i);
    array[level] = reducer.reducefn(
      array[level] as any,
      source.valueAt(i) as any
    );
  }

  return this;
}

function stack<T, U>(this: ReducerHandler<T, U>) {
  const { parent, factor, reducer } = this;
  if (!parent || !factor) return this;

  const copy = this.clone();
  const parentFactor = factor.parent;

  if (!parentFactor) return this;

  const stacked = Array(parentFactor.cardinality) as U[];
  for (let i = 0; i < parentFactor.cardinality; i++) {
    stacked[i] = reducer.initialfn();
  }

  const array = copy.result.array;

  for (let i = 0; i < array.length; i++) {
    const level = parentFactor.levelAt(i);
    // @ts-ignore
    stacked[level] = reducer.reducefn(stacked[level], array[i]);
    array[i] = stacked[level];
  }

  return copy;
}

function normalizeByParent<T, U>(this: ReducerHandler<T, U>) {
  const { parent, factor } = this;

  if (!parent || !factor) return this;

  const copy = this.clone();

  const parentFactor = factor.parent;
  if (!parentFactor || !parent) return this;

  const array = copy.result.array;
  const parentArray = parent.result.array;

  for (let i = 0; i < parentFactor.levels.length; i++) {
    const value = array[i] as number;
    const parentValue = parentArray[parentFactor.levelAt(i)] as number;
    array[i] = (value / parentValue) as U;
  }

  return copy;
}

function parseVariable(value: unknown) {
  const type = typeof value;
  if (type === "number") return newContinuous;
  if (type === "string") return newDiscrete;
  return newReference;
}
