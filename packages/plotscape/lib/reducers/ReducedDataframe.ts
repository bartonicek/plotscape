import { Normalize, allEntries, values } from "utils";
import { Dataframe, newDataframe } from "../dataframe/Dataframe";
import { Factor } from "../factors/Factor";
import { Emitter, subscribable } from "../mixins/Emitter";
import { Variables } from "../types";
import { ReducerHandler } from "./ReducerHandler";

export type Reducers = Record<string, ReducerHandler>;
export type Results<T extends Reducers> = {
  [key in keyof T]: T[key]["result"];
};

export interface ReducedDataframe<
  T extends Variables = {},
  U extends Reducers = {}
> extends Dataframe<Normalize<T & Results<U>>>,
    Emitter<`changed`> {
  factor: Factor<T>;
  reducers: U;
  recompute(): void;
}

export function newReducedDataframe<T extends Variables, U extends Reducers>(
  factor: Factor<T>,
  reducers: U
): ReducedDataframe<T, U> {
  const reducersCopy = {} as U;
  for (const [k, v] of allEntries(reducers)) {
    reducersCopy[k] = v.clone().setFactor(factor) as any;
  }

  const columns = {} as any;
  for (const [k, v] of allEntries(factor.data.cols())) columns[k] = v;
  for (const [k, v] of allEntries(reducersCopy)) {
    v.setFactor(factor);
    columns[k] = v.result;
  }

  const data = newDataframe(columns as Normalize<T & Results<U>>);
  const props = { factor, reducers: reducersCopy, recompute };

  const self = subscribable({ ...data, ...props }) as ReducedDataframe<T, U>;
  self.recompute();

  factor.listen(`changed`, self.recompute.bind(self));
  return self;
}

function recompute<T extends Variables, U extends Reducers>(
  this: ReducedDataframe<T, U>
) {
  const { reducers } = this;

  for (const v of values(reducers)) {
    const reducer = v as ReducerHandler;
    reducer.recompute();
  }

  this.cachedN = undefined;
  this.emit(`changed`);
}
