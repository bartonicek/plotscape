import { Letter } from "utils";
import { ContextId } from "./plot/Plot";
import { Representation } from "./representations/Representation";
import { LAYER, POSITIONS } from "./symbols";
import { Continuous } from "./variables/Continuous";
import { Discrete } from "./variables/Discrete";
import { Reference } from "./variables/Reference";
import { Tuple } from "./variables/Tuple";
import { Variable } from "./variables/Variable";

export type Variables = Record<PropertyKey, Variable | Tuple>;
export type VariableValue<T extends Variable | Tuple> = T extends Variable<
  infer V
>
  ? V
  : T extends Tuple<infer W>
  ? W
  : never;

export type InferVariable<T> = T extends number
  ? Continuous
  : T extends string
  ? Discrete
  : Reference;

export type RowOf<T extends Variables> = {
  [key in keyof T]: VariableValue<T[key]>;
};

export type Primitive = string | number | symbol | object;
export type SymbolProps<T> = { [key in keyof T & symbol]: T[key] };

export enum Dimension {
  Scalar,
  Tuple,
}

export type Point = [x: number, y: number];
export type Rect = [x0: number, y0: number, x1: number, y1: number];
export type Margins = [
  bottom: number,
  left: number,
  top: number,
  right: number
];

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ActionKey =
  | `Equal`
  | `Minus`
  | `BracketLeft`
  | `BracketRight`
  | `Semicolon`
  | `Quote`
  | `Key${Uppercase<Letter>}`
  | `Digit${Digit}`;

export type KeyActions = Partial<
  Record<ActionKey, (event: KeyboardEvent) => void>
>;

export interface GraphicObject extends Partial<Representation> {}

export type HexColour = `#${string}`;
export type RGB = [red: number, green: number, blue: number];

export type BoundaryCols = { [POSITIONS]: Reference<Set<number>> };
export type RenderCols = { [LAYER]: Reference<ContextId> };

export enum Group {
  Transient = 255,
  Group1 = 7,
  Group2 = 6,
  Group3 = 5,
  Group4 = 4,
}

export enum Type {
  Absolute,
  Proportion,
}

export enum Order {
  Alphanumeric,
  Custom,
}

export enum VerticalAnchor {
  Middle = 1 / 2,
  Top = 1,
  Bottom = 0,
}

export enum HorizontalAnchor {
  Center = 1 / 2,
  Left = 1,
  Right = 0,
}
