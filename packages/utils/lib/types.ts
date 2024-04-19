export type TODO = any;
export type SideEffect = (...args: any[]) => void;
export type Lazy<T> = () => T;
export type ReduceFn<T, U> = (prev: U, next: T) => U;
export type MapFn<T, U> = (next: T) => U;

export type Dict = Record<PropertyKey, any>;
export type Normalize<T> = { [key in keyof T]: T[key] } & {};
export type Match<T, U> = {
  [key in keyof T as T[key] extends U ? key : never]: T[key];
};

export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <
  T
>() => T extends B ? 1 : 2
  ? true
  : false;

export type ReadonlyKeys<T> = keyof {
  [K in keyof T as Equal<Readonly<Pick<T, K>>, Pick<T, K>> extends true
    ? K
    : never]: K;
};

export type DisjointUnion<
  T extends Record<string, any> | undefined,
  U extends Record<string, any> | undefined
> = T extends undefined
  ? U
  : U extends undefined
  ? T
  : Normalize<
      { [key in keyof T & string]: T[key] } & {
        [key in keyof U as key extends keyof T & string
          ? `${key}$`
          : key]: U[key];
      }
    >;

export type SplitString<T extends string> =
  T extends `${infer First}${infer Rest}` ? First | SplitString<Rest> : never;

export type Letter = SplitString<`abcdefghijklmnopqrstuvwxyz`>;
