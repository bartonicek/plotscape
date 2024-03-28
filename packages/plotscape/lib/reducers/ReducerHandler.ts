import { Factor } from "../factors/Factor";
import { Observable, observable } from "../mixins/Observable";
import { Reduced, reduced } from "../mixins/Reduced";
import { InferVariable } from "../types";
import { newContinuous } from "../variables/Continuous";
import { newDiscrete } from "../variables/Discrete";
import { newReference } from "../variables/Reference";
import { Variable } from "../variables/Variable";
import { Reducer } from "./Reducer";

export interface ReducerHandler<T = any, U = any> extends Observable {
  name: string;
  factor?: Factor;
  parent?: ReducerHandler<T, U>;
  reducer: Reducer<T, U>;

  source: Variable<T>;
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
  source: Variable<T>,
  reducer: Reducer<T, U>
): ReducerHandler<T, U> {
  const constructor = parseVariable(reducer.initialfn());

  let name: string | undefined = undefined;
  if (source.hasName?.()) name = `${reducer.name} of ${source.name()}`;
  else name = `count`;

  type Result = InferVariable<U> & Reduced;
  const result = reduced(constructor([])) as unknown as Result;
  result.setName(name);

  const [stacked, normalized] = [false, false];
  const props = { name, reducer, source, result, stacked, normalized };
  const methods = {
    clone,
    setParent,
    setFactor,
    recompute,
    stack,
    normalizeByParent,
  };

  const self = observable({ ...props, ...methods });
  self.result.setReducer(self as any);
  return self;
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
  copy.stacked = this.stacked;
  copy.normalized = this.normalized;

  if (parent) copy.setParent(parent);
  if (factor) copy.setFactor(factor);

  this.listen(() => copy.recompute());
  return copy;
}

function recompute<T, U>(this: ReducerHandler<T, U>) {
  const { factor, source, result, reducer, stacked, normalized } = this;
  if (factor === undefined) throw new Error(`Factor has not been registered`);

  const { cardinality } = factor;
  const array = result.array as U[];
  array.length = cardinality;

  for (let i = 0; i < cardinality; i++) array[i] = reducer.initialfn();
  for (let i = 0; i < factor.levels.length; i++) {
    const level = factor.levelAt(i);
    array[level] = reducer.reducefn(array[level], source.valueAt(i) as any);
  }

  if (stacked) stackInternal(this);
  if (normalized) normalizeInternal(this);

  result.domain.retrain(array as any);
  this.emit();
  return this;
}

function stack<T, U>(this: ReducerHandler<T, U>) {
  const { factor } = this;
  if (!factor || !factor.parent) return this;
  const copy = this.clone();
  copy.stacked = true;
  copy.recompute();
  return copy;
}

function normalizeByParent<T, U>(this: ReducerHandler<T, U>) {
  const { parent, factor } = this;
  if (!parent || !factor || !factor.parent) return this;
  const copy = this.clone();
  copy.normalized = true;
  copy.recompute();
  return copy;
}

function stackInternal<T, U>(self: ReducerHandler<T, U>) {
  const { factor, reducer } = self;
  if (!factor || !factor.parent) return self;

  const parentFactor = factor.parent;
  const stacked = Array(parentFactor.cardinality) as U[];
  for (let i = 0; i < parentFactor.cardinality; i++) {
    stacked[i] = reducer.initialfn();
  }

  const array = self.result.array as any[];

  for (let i = 0; i < array.length; i++) {
    const level = parentFactor.levelAt(i);
    stacked[level] = reducer.reducefn(stacked[level], array[i]);
    array[i] = stacked[level];
  }
}

function normalizeInternal<T, U>(self: ReducerHandler<T, U>) {
  const { parent, factor } = self;

  if (!parent || !factor || !factor.parent) return self;

  const parentFactor = factor.parent;
  const array = self.result.array;
  const parentArray = parent.result.array;

  for (let i = 0; i < parentFactor.levels.length; i++) {
    const value = array[i] as number;
    const parentValue = parentArray[parentFactor.levelAt(i)] as number;
    array[i] = (value / parentValue) as U;
  }
}

function parseVariable(value: unknown) {
  const type = typeof value;
  if (type === "number") return newContinuous;
  if (type === "string") return newDiscrete;
  return newReference;
}
