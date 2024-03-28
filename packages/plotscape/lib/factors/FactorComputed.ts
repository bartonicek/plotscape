import { Dataframe } from "../dataframe/Dataframe";
import { observable } from "../mixins/Observable";
import { Variables } from "../types";
import { Factor } from "./Factor";
import { newFactorMono } from "./FactorMono";

export function newFactorComputed<T extends Variables>(
  cardinality: number,
  levels: number[],
  data: Dataframe<T>,
  parent?: Factor
): Factor<T> {
  parent = parent ?? newFactorMono();
  const self = { parent, cardinality, levels, data, levelAt };

  return observable(self);
}

function levelAt(this: Factor, index: number) {
  return this.levels[index];
}
