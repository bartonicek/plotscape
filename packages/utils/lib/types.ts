export type Lazy<T> = () => T;
export type ReduceFn<T, U> = (prev: U, next: T) => U;
export type MapFn<T, U> = (next: T) => U;

export type Dict = Record<PropertyKey, any>;
export type Normalize<T> = { [key in keyof T]: T[key] } & {};

export type DisjointUnion<
  T extends Record<string, any>,
  U extends Record<string, any>
> = Normalize<
  { [key in keyof T & string]: T[key] } & {
    [key in keyof U as key extends keyof T & string ? `${key}$` : key]: U[key];
  }
>;
