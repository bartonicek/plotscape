import { zero } from "utils";
import { newDataframe } from "../dataframe/Dataframe";
import { subscribable } from "../mixins/Emitter";
import { Factor } from "./Factor";

export function newFactorMono(): Factor<{}> {
  const cardinality = 1;
  const levels = [0];
  const levelAt = zero;
  const data = newDataframe({});

  return subscribable({ cardinality, levels, data, levelAt });
}
