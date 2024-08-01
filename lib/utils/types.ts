import { Frame } from "../plot/Frame";
import { NAME } from "./symbols";

declare global {
  // Makes it possible to assign names to objects such as Arrays
  interface Object {
    [NAME]?: string;
  }
  // interface Array<T> {
  //   [PARENT]?: this;
  // }
}

export type Flat<T> = { [key in keyof T]: T[key] } & {};

export type Entries<T> = [keyof T, T[keyof T]][];

export type MapFn<T> = (next: T) => T;
export type ReduceFn<T, U> = (prev: U, next: T) => U;

export type Indexable<T = any> = T[] | ((index: number) => T);

export type Stringable = { toString(): string };
export type Indexables = Record<string, Indexable>;
export type Dataframe = Record<string | symbol, any[]>;

export enum Direction {
  Forwards = 1,
  Backwards = -1,
}

export type Rect = [x0: number, y0: number, x1: number, y1: number];

export type Margins = [
  bottom: number,
  left: number,
  top: number,
  right: number
];

export enum VAnchor {
  Middle = 1 / 2,
  Top = 1,
  Bottom = 0,
}

export enum HAnchor {
  Center = 1 / 2,
  Left = 1,
  Right = 0,
}

export enum MouseButton {
  Left = 0,
  Right = 2,
}
export const dataLayers = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const baseLayers = [4, 5, 6, 7] as const;
export type DataLayer = (typeof dataLayers)[number];

export type Layers = {
  [key in DataLayer]: Frame;
};
