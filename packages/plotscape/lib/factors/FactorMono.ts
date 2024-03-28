import { zero } from "utils";
import { newDataframe } from "../dataframe/Dataframe";
import { observable } from "../mixins/Observable";
import { Factor } from "./Factor";

export function newFactorMono(): Factor<{}> {
  const cardinality = 1;
  const levels = [0];
  const levelAt = zero;
  const data = newDataframe({});

  return observable({ cardinality, levels, data, levelAt });
}
