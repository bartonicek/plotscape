import { Letter } from "utils";
import { Contexts } from "./plot/Plot";
import { Continuous } from "./variables/Continuous";
import { Discrete } from "./variables/Discrete";
import { Reference } from "./variables/Reference";
import { Variable } from "./variables/Variable";

export type Variables = Record<PropertyKey, Variable<unknown>>;
export type VariableValue<T extends Variable> = T extends Variable<infer V>
  ? V
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

export type Rect = [x0: number, y0: number, x1: number, y1: number];
export type Margins = [
  bottom: number,
  left: number,
  top: number,
  right: number
];
export type ActionKey =
  | `Equal`
  | `Minus`
  | `BracketLeft`
  | `BracketRight`
  | `Semicolon`
  | `Quote`
  | `Key${Uppercase<Letter>}`;

export type KeyActions = Partial<Record<ActionKey, (event: Event) => void>>;

export interface GraphicObject {
  render(contexts: Contexts): void;
  check?(coords: Rect): Set<number>;
  query?(x: number, y: number): Record<string, any> | undefined;
}

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
  ByName,
  ByCount,
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
