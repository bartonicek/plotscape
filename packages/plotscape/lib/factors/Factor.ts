import { Dataframe } from "../dataframe/Dataframe";
import { Observable } from "../mixins/Observable";
import { Variables } from "../types";

/** Partitions some data into a discrete number of levels, corresponding to the cardinality. */
export interface Factor<T extends Variables = any> extends Observable {
  parent?: Factor;
  cardinality: number;
  levels: number[];
  data: Dataframe<T>;
  levelAt(index: number): number;
}
