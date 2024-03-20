import { DisjointUnion, Normalize, entries } from "utils";
import { Factor } from "../factors/Factor";
import { factorProduct } from "../factors/factorProduct";
import { Variables } from "../types";
import {
  ReducedDataframe,
  Reducers,
  Results,
  newReducedDataframe,
} from "./ReducedDataframe";

export interface Partition<T extends Variables, U extends Reducers> {
  factor?: Factor<T>;
  reducers: U;
  _data?: ReducedDataframe<Normalize<T & Results<U>>, U>;
  refine<V extends Variables>(
    factor: Factor<V>
  ): Partition<DisjointUnion<T, V>, U>;
  data(): ReducedDataframe<Normalize<T & Results<U>>, U>;
}

export function newPartition<T extends Variables = {}, U extends Reducers = {}>(
  reducers: U,
  factor?: Factor<T>
): Partition<T, U> {
  return { reducers, factor, refine, data };
}

function refine<T extends Variables, U extends Reducers, V extends Variables>(
  this: Partition<T, U>,
  factor: Factor<V>
) {
  const { factor: thisFactor, reducers } = this;

  type NewFactor = Factor<DisjointUnion<T, V>>;
  const newFactor = thisFactor ? factorProduct(thisFactor, factor) : factor;
  const result = newPartition(reducers, newFactor as NewFactor);
  result._data = newReducedDataframe(newFactor as any, reducers) as any;

  if (this._data) {
    for (const [k, v] of entries(this._data.reducers)) {
      result._data!.reducers[k].setParent(v);
    }
  }

  return result;
}

function data<T extends Variables, U extends Reducers>(this: Partition<T, U>) {
  const { _data } = this;
  if (!_data) throw new Error(`No factor to reduce data by`);
  return _data;
}
