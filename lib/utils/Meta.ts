declare global {
  interface Object {
    [METADATA]?: Record<string, any>;
  }
}

const METADATA = Symbol(`metadata`);
export interface Meta<T extends Record<string, any> = Record<string, any>> {
  [METADATA]: T;
}

type MetadataKey<T extends Meta | Object> = T extends Meta
  ? keyof T[typeof METADATA]
  : string;

export namespace Meta {
  export function of<T extends Object>(object: T) {
    object[METADATA] = {};
    return object as T & Meta;
  }

  export function hasMetadata(object: Object): object is Meta {
    return !!object[METADATA];
  }

  export function has(object: Object, key: string) {
    return !!object[METADATA]?.[key];
  }

  export function get<T extends Meta>(
    object: T,
    keys: MetadataKey<T> | MetadataKey<T>[],
  ) {
    if (!Array.isArray(keys)) return getDatum(object, keys as string);
    return keys.map((x) => getDatum(object, x as string));
  }

  export function set<T extends Meta>(
    object: Object,
    props: Partial<T[typeof METADATA]>,
  ) {
    if (!hasMetadata(object)) object[METADATA] = {};
    for (const [k, v] of Object.entries(props)) object[METADATA]![k] = v;
  }

  export function copy<T extends Meta | Object, U extends Meta | Object>(
    target: T,
    source: U,
    props?: MetadataKey<T>[],
  ) {
    if (!hasMetadata(source)) return;
    if (!hasMetadata(target)) target[METADATA] = {};
    const keys = props ?? Object.keys(source[METADATA]);
    for (const key of keys as string[]) {
      // Need to use get() here in case e.g. `length`
      target[METADATA]![key] = get(source, key as MetadataKey<U>);
    }
  }

  function getDatum<T extends Meta>(object: T, key: string) {
    if (key === `length` && Array.isArray(object)) return object.length;
    return object[METADATA]?.[key];
  }
}
