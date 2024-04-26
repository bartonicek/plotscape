import { Normalize } from "utils";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";
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

export function continuous() {
  return newColumnParserContinuous();
}

export function discrete() {
  return newColumnParserDiscrete();
}

export function col(type: `continuous`): ColumnParserContinuous;
export function col(type: `discrete`): ColumnParserDiscrete;
/**
 * A columns parser helper function.
 * @param type The type of variable: either `discrete` or `continuous`
 * @returns A column parser object that has methods for modifying
 * how the corresponding variable will be parsed.
 */
export function col(type: `continuous` | `discrete`) {
  if (type === `continuous`) return newColumnParserContinuous();
  else return newColumnParserDiscrete();
}
