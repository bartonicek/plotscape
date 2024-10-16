import { isFunction, isObject, isSerializable } from "./funs";

declare global {
  interface Object extends Partial<Metadata> {}
  interface Array<T> extends Partial<Metadata> {}
}

export const METADATA = Symbol(`metadata`);

type MetadataDict = Record<string, unknown>;
export interface Metadata<T extends MetadataDict = MetadataDict> {
  [METADATA]: T;
}

export namespace Metadata {
  export type Props<T extends Metadata> = T[typeof METADATA];
  export type Key<T extends Metadata> = keyof T[typeof METADATA];

  export function of<T extends Object>(object: T) {
    object[METADATA] = {};
    return object as T & Metadata;
  }

  export function hasMetadata(x: unknown): x is Metadata {
    return (isObject(x) || isFunction(x)) && !!x[METADATA];
  }

  export function has<K extends string>(
    x: unknown,
    key: K,
  ): x is Metadata<{ [key in K]: unknown }> {
    return hasMetadata(x) && !!x[METADATA]?.[key];
  }

  export function get<T extends Metadata, K extends Key<T>>(
    x: T,
    key: K,
  ): Props<T>[K];

  export function get<T extends Metadata, const K extends Key<T>[]>(
    x: T,
    keys: K,
  ): MapProps<T, K>;

  export function get(x: unknown[], key: `length`): number;
  export function get(x: Object, key: string): unknown;
  export function get(x: Object, key: string[]): unknown[];

  export function get<T extends Metadata | Object>(
    x: T,
    keys: T extends Metadata ? Key<T> | Key<T>[] : string,
  ) {
    if (!Array.isArray(keys)) return getDatum(x, keys);
    return keys.map((e) => getDatum(x, e));
  }

  function getDatum<T extends Metadata | Object>(x: T, key: string) {
    if (key === `length` && Array.isArray(x)) return x.length;
    return x[METADATA]?.[key];
  }

  export function set<T extends Metadata>(
    x: Object,
    props: Partial<T[typeof METADATA]>,
  ) {
    if (!hasMetadata(x)) x[METADATA] = {};
    for (const [k, v] of Object.entries(props)) x[METADATA]![k] = v;
  }

  export function copy<T extends Metadata, U extends Metadata>(
    source: T,
    target: U,
    keys?: Key<T>[],
  ): void;

  export function copy<T extends Metadata>(
    source: T,
    target: Object,
    keys?: Key<T>[],
  ): void;

  export function copy(source: unknown, target: unknown, keys?: string[]): void;

  export function copy<
    T extends Metadata | Object,
    U extends Metadata | Object,
  >(source: T, target: U, keys?: T extends Metadata ? Key<T>[] : string[]) {
    if (!hasMetadata(source)) return;
    if (!hasMetadata(target)) target[METADATA] = {};
    const _keys = keys ?? Object.keys(source[METADATA]);
    for (const key of _keys as string[]) {
      // Need to use get() here in case e.g. `length`
      let value = get(source, key);
      // Clone if serializable
      if (isSerializable(value)) value = structuredClone(value);
      target[METADATA]![key] = value;
    }
  }

  type MapProps<T extends Metadata, K extends readonly Key<T>[]> = K extends [
    infer U extends Key<T>,
    ...infer Rest extends Key<T>[],
  ]
    ? [Props<T>[U], ...MapProps<T, Rest>]
    : [];
}
