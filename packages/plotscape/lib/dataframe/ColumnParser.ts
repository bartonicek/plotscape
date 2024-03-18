import { Normalize } from "utils";
import { Continuous } from "../Continuous";
import { Discrete } from "../Discrete";
import {
  ColumnParserContinuous,
  newColumnParserContinuous,
} from "./ColumnParserContinuous";
import {
  ColumnParserDiscrete,
  newColumnParserDiscrete,
} from "./ColumnParserDiscrete";

export type ColumnParser = ColumnParserContinuous | ColumnParserDiscrete;
export type ParsedColumns<T extends Record<string, ColumnParser>> = Normalize<{
  [key in keyof T]: T[key] extends ColumnParserContinuous
    ? Continuous
    : Discrete;
}>;

export function col(type: `continuous`): ColumnParserContinuous;
export function col(type: `discrete`): ColumnParserDiscrete;
export function col(type: `continuous` | `discrete`) {
  if (type === `continuous`) return newColumnParserContinuous();
  else return newColumnParserDiscrete();
}
