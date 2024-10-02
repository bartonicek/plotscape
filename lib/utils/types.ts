import { Frame } from "../plot/Frame";

export type Primitive = string | number | boolean | undefined | null;
export type Flat<T> = { [key in keyof T]: T[key] } & {};
export type Entries<T> = [keyof T, T[keyof T]][];

export type AnyFn = (...args: any[]) => any;
export type MapFn<T> = (next: T) => T;
export type ReduceFn<T, U> = (prev: U, next: T) => U;

export type Stringable = { toString(): string };

export type Indexable<T = any> = T | ((index: number) => T) | T[];
export type IndexableValue<T extends Indexable> =
  T extends Indexable<infer U> ? U : never;
export type Indexables = Record<string, Indexable>;

export type Columns = Record<string, any[]>;
export type UntypedColumns<S extends string[]> = { [key in S[number]]: any[] };
export type Direction = 1 | -1;

export type Point = [x: number, y: number];
export type Rect = [x0: number, y0: number, x1: number, y1: number];

export type Margins = [
  bottom: number,
  left: number,
  top: number,
  right: number,
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

export type StringToUnion<T extends string> =
  T extends `${infer U}${infer Rest}` ? [U, ...StringToUnion<Rest>] : [];

export const dataLayers = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const baseLayers = [4, 5, 6, 7] as const;
export type DataLayer = (typeof dataLayers)[number];
export type DataLayers = { [key in DataLayer]: Frame };

export type TaggedUnion<
  T extends Record<string, any> | undefined,
  U extends Record<string, any> | undefined,
> = T extends undefined
  ? U
  : U extends undefined
    ? T
    : Flat<
        { [key in keyof T & string]: T[key] } & {
          [key in keyof U as key extends keyof T & string
            ? `${key}$`
            : key]: U[key];
        }
      >;

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
export type Representation = `absolute` | `propotion`;

export type KeyboardKey =
  | `1`
  | `2`
  | `3`
  | `4`
  | `5`
  | `6`
  | `7`
  | `8`
  | `9`
  | `0`
  | `-`
  | `=`
  | `~`
  | `!`
  | `@`
  | `#`
  | `$`
  | `%`
  | `^`
  | `&`
  | `*`
  | `(`
  | `)`
  | `_`
  | `+`
  | `q`
  | `w`
  | `e`
  | `r`
  | `t`
  | `y`
  | `u`
  | `i`
  | `o`
  | `p`
  | `[`
  | `]`
  | `Q`
  | `W`
  | `E`
  | `R`
  | `T`
  | `Y`
  | `U`
  | `I`
  | `O`
  | `P`
  | `{`
  | `}`
  | `a`
  | `s`
  | `d`
  | `f`
  | `g`
  | `h`
  | `j`
  | `k`
  | `l`
  | `;`
  | `'`
  | `A`
  | `S`
  | `D`
  | `F`
  | `G`
  | `H`
  | `J`
  | `K`
  | `L`
  | `:`
  | `z`
  | `x`
  | `c`
  | `v`
  | `b`
  | `n`
  | `m`
  | `,`
  | `.`
  | `/`
  | `Z`
  | `X`
  | `C`
  | `V`
  | `B`
  | `N`
  | `M`
  | `<`
  | `>`
  | `?`;
