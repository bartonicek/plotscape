import { identity } from "utils";
import { newDataframe } from "../dataframe/Dataframe";
import { subscribable } from "../mixins/Emitter";
import { Factor } from "./Factor";

export function newFactorMono(): Factor<{}> {
  const cardinality = 1;
  const levels = [1];
  const levelAt = identity;
  const data = newDataframe({});

  // @ts-ignore
  return subscribable({ cardinality, levels, data, levelAt });
}
