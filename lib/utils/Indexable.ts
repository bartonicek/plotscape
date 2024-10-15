import { isSerializable } from "./funs";

export type Indexable<T = unknown> = T | ((index: number) => T) | T[];
export type Indexables = Record<string, Indexable>;

export namespace Indexable {
  export type Value<T extends Indexable> =
    T extends Indexable<infer U> ? U : never;

  export function clone<T extends Indexable>(indexable: T): T {
    if (isSerializable(indexable)) return structuredClone(indexable);
    return indexable;
  }
}
