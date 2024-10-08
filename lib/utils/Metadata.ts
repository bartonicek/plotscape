import { isSerializable } from "./funs";

declare global {
  interface Object extends Partial<Metadata> {}
  interface Array<T> extends Partial<Metadata> {}
}

const METADATA = Symbol(`metadata`);

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

  export function hasMetadata(object: Object): object is Metadata {
    return !!object[METADATA];
  }

  export function has(object: Object, key: string) {
    return !!object[METADATA]?.[key];
  }

  export function get<T extends Metadata, K extends Key<T>>(
    object: T,
    key: K,
  ): Props<T>[K];

  export function get<T extends Metadata, const K extends Key<T>[]>(
    object: T,
    keys: K,
  ): MapProps<T, K>;

  export function get(object: any[], key: `length`): number;
  export function get(object: Object, key: string): unknown;
  export function get(object: Object, key: string[]): unknown[];

  export function get<T extends Metadata | Object>(
    object: T,
    keys: T extends Metadata ? Key<T> | Key<T>[] : string,
  ) {
    if (!Array.isArray(keys)) return getDatum(object, keys);
    return keys.map((x) => getDatum(object, x));
  }

  function getDatum<T extends Metadata | Object>(object: T, key: string) {
    if (key === `length` && Array.isArray(object)) return object.length;
    return object[METADATA]?.[key];
  }

  export function set<T extends Metadata>(
    object: Object,
    props: Partial<T[typeof METADATA]>,
  ) {
    if (!hasMetadata(object)) object[METADATA] = {};
    for (const [k, v] of Object.entries(props)) object[METADATA]![k] = v;
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

  export function copy(source: Object, target: Object, keys?: string[]): void;

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
