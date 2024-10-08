import { isSerializable } from "./funs";

declare global {
  interface Object extends Partial<Metadata> {}
  interface Array<T> extends Partial<Metadata> {}
}

const METADATA = Symbol(`metadata`);

export interface Metadata<T extends Record<string, any> = Record<string, any>> {
  [METADATA]: T;
}

type MetadataKey<T extends Metadata | Object> = T extends Metadata
  ? keyof T[typeof METADATA]
  : string;

export namespace Metadata {
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

  export function get<T extends Metadata | Object>(
    object: T,
    keys: MetadataKey<T> | MetadataKey<T>[],
  ) {
    if (!Array.isArray(keys)) return getDatum(object, keys as string);
    return keys.map((x) => getDatum(object, x as string));
  }

  export function set<T extends Metadata>(
    object: Object,
    props: Partial<T[typeof METADATA]>,
  ) {
    if (!hasMetadata(object)) object[METADATA] = {};
    for (const [k, v] of Object.entries(props)) object[METADATA]![k] = v;
  }

  export function copy<
    T extends Metadata | Object,
    U extends Metadata | Object,
  >(source: T, target: U, props?: MetadataKey<T>[]) {
    if (!hasMetadata(source)) return;
    if (!hasMetadata(target)) target[METADATA] = {};
    const keys = props ?? Object.keys(source[METADATA]);
    for (const key of keys as string[]) {
      // Need to use get() here in case e.g. `length`
      let value = get(source, key as MetadataKey<T>);
      // Clone if serializable
      if (isSerializable(value)) value = structuredClone(value);
      target[METADATA]![key] = value;
    }
  }

  function getDatum<T extends Metadata | Object>(object: T, key: string) {
    if (key === `length` && Array.isArray(object)) return object.length;
    return object[METADATA]?.[key];
  }
}
