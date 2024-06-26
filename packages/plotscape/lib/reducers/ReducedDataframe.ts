import { Normalize, allEntries, values } from "utils";
import { Dataframe, newDataframe } from "../dataframe/Dataframe";
import { Factor } from "../factors/Factor";
import { Observable, observable } from "../mixins/Observable";
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
    Observable {
  factor: Factor<T>;
  reducers: U;
  update(): void;
}

export function newReducedDataframe<T extends Variables, U extends Reducers>(
  factor: Factor<T>,
  reducers: U
): ReducedDataframe<T, U> {
  const reducersCopy = {} as U;
  for (const [k, v] of allEntries(reducers)) {
    reducersCopy[k] = v.clone().setFactor(factor) as any;
  }

  const columns = {} as Variables;
  for (const [k, v] of allEntries(factor.data.cols())) columns[k] = v;
  for (const [k, v] of allEntries(reducersCopy)) {
    v.setFactor(factor);
    columns[k] = v.result;
  }

  const data = newDataframe(columns as Normalize<T & Results<U>>);
  const props = { factor, reducers: reducersCopy, update };

  const self = observable({ ...data, ...props }) as ReducedDataframe<T, U>;
  self.update();

  factor.listen(self.update.bind(self));
  return self;
}

function update<T extends Variables, U extends Reducers>(
  this: ReducedDataframe<T, U>
) {
  const { reducers } = this;

  for (const v of values(reducers)) {
    const reducer = v as ReducerHandler;
    reducer.recompute();
  }

  this.cachedN = undefined;
  this.emit();
}
