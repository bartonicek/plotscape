import { DisjointUnion, Normalize, entries } from "utils";
import { Dataframe, newDataframe } from "../dataframe/Dataframe";
import { Factor } from "../factors/Factor";
import { factorProduct } from "../factors/factorProduct";
import { Emitter, subscribable } from "../mixins/Emitter";
import { Variables } from "../types";
import { ReducerHandler } from "./ReducerHandler";

export type Reducers = Record<string, ReducerHandler>;
export type Results<T extends Reducers> = {
  [key in keyof T]: T[key]["result"];
};

export interface ReducedDataframe<T extends Variables, U extends Reducers>
  extends Dataframe<Normalize<T & Results<U>>>,
    Emitter<`changed`> {
  factor: Factor<T>;
  reducers: U;
  refine<V extends Variables>(
    factor: Factor<V>
  ): ReducedDataframe<DisjointUnion<T, V>, U>;
  recompute(): void;
}

export function newReducedDataframe<T extends Variables, U extends Reducers>(
  factor: Factor<T>,
  reducers: U
): ReducedDataframe<T, U> {
  const data = newDataframe({} as Normalize<T & Results<U>>);
  const self = subscribable({ factor, refine, recompute, ...data, reducers });
  (self as any).recompute();

  factor.listen(`changed`, self.recompute.bind(self as any));
  return self as unknown as ReducedDataframe<T, U>;
}

function refine<T extends Variables, U extends Reducers, V extends Variables>(
  this: ReducedDataframe<T, U>,
  factor: Factor<V>
) {
  const newFactor = factorProduct(this.factor, factor);
  const reducers = {} as U;
  for (const [k, v] of entries(this.reducers)) {
    reducers[k] = v.clone() as any;
    reducers[k].setParent(v);
  }

  return newReducedDataframe(newFactor, reducers);
}

function recompute<T extends Variables, U extends Reducers>(
  this: ReducedDataframe<T, U>
) {
  const { factor, reducers } = this;
  const columns = this.columns as any;

  for (const [k, v] of entries(factor.data.cols())) columns[k] = v;

  for (const [k, v] of entries(reducers)) {
    const reducer = v as ReducerHandler<any, any>;
    reducer.setFactor(factor).recompute();
    columns[k] = reducer.result;
  }

  this.cachedN = undefined;
  this.emit(`changed`);
}
