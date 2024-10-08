import { CanvasFrame } from "../plot/CanvasFrame";

export type Primitive = string | number | boolean | undefined | null;
export type Flat<T> = { [key in keyof T]: T[key] } & {};
export type Entries<T> = [keyof T, T[keyof T]][];
export type ValuesOf<T extends Object> = T[keyof T];

export type AnyFn = (...args: any[]) => any;
export type MapFn<T, U = T> = (next: T) => U;
export type ReduceFn<T, U> = (prev: U, next: T) => U;

export type Stringable = { toString(): string };
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

export type VAnchor = ValuesOf<typeof VAnchor>;
export const VAnchor = {
  Top: 1,
  Middle: 1 / 2,
  Bottom: 0,
} as const;

export type HAnchor = ValuesOf<typeof HAnchor>;
export const HAnchor = {
  Left: 1,
  Center: 1 / 2,
  Right: 0,
};

export type MouseButton = ValuesOf<typeof MouseButton>;
export const MouseButton = {
  Left: 0,
  Right: 2,
} as const;

export type StringToUnion<T extends string> =
  T extends `${infer U}${infer Rest}` ? [U, ...StringToUnion<Rest>] : [];

export const dataLayers = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const baseLayers = [4, 5, 6, 7] as const;
export type DataLayer = (typeof dataLayers)[number];
export type DataLayers = { [key in DataLayer]: CanvasFrame };

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
export type Representation = `absolute` | `proportion`;

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
