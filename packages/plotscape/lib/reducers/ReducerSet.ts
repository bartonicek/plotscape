import { DisjointUnion, Normalize } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { Factor } from "../factors/Factor";
import { factorProduct } from "../factors/factorProduct";
import { Variables } from "../types";
import {
  ReducedDataframe,
  Reducers,
  Results,
  newReducedDataframe,
} from "./ReducedDataframe";

export interface ReducerSet<T extends Variables = {}, U extends Reducers = {}> {
  factor?: Factor<T>;
  _data?: Dataframe<Normalize<T & Results<U>>>;
  reducers: U;
  refine<V extends Variables>(
    factor: Factor<V>
  ): ReducerSet<DisjointUnion<T, V>, U>;
  data(): ReducedDataframe<Normalize<T & Results<U>>, U>;
}

export function newReducerSet<
  T extends Variables = {},
  U extends Reducers = {}
>(reducers: U, factor?: Factor<T>): ReducerSet<T, U> {
  return { reducers, factor, refine, data };
}

function refine<T extends Variables, U extends Reducers, V extends Variables>(
  this: ReducerSet<T, U>,
  factor: Factor<V>
) {
  const { factor: thisFactor, reducers } = this;
  const newFactor = thisFactor ? factorProduct(thisFactor, factor) : factor;
  type NewFactor = Factor<DisjointUnion<T, V>>;

  const result = newReducerSet(reducers, newFactor as NewFactor);

  return result;
}

function data<T extends Variables, U extends Reducers>(this: ReducerSet<T, U>) {
  if (!this.factor) throw new Error(`No factor to reduce data by`);
  const result = newReducedDataframe(this.factor, this.reducers);
  if (this._data) {
  }

  this._data = result;

  return result;
}
