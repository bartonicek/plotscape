import { Dataframe } from "../dataframe/Dataframe";
import { Emitter } from "../mixins/Emitter";
import { Variables } from "../types";

export interface Factor<T extends Variables = any> extends Emitter<`changed`> {
  parent?: Factor;
  cardinality: number;
  levels: number[];
  data: Dataframe<T>;
  levelAt(index: number): number;
}
