import { Dataframe } from "../dataframe/Dataframe";
import { subscribable } from "../mixins/Emitter";
import { Variables } from "../types";
import { Factor } from "./Factor";

export function newFactorComputed<T extends Variables>(
  cardinality: number,
  levels: number[],
  data: Dataframe<T>,
  parent?: Factor
): Factor<T> {
  const self = { parent, cardinality, levels, data, levelAt };
  return subscribable(self);
}

function levelAt(this: Factor, index: number) {
  return this.levels[index];
}
