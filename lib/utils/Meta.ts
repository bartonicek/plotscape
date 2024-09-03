const NAME = Symbol(`name`);
const LENGTH = Symbol(`length`);
const MIN = Symbol(`min`);
const MAX = Symbol(`max`);
const QUERYABLE = Symbol(`queryable`);
const PARENTVALUES = Symbol(`parentValues`);

declare global {
  interface Object {
    [NAME]?: string;
    [LENGTH]?: number;
    [MIN]?: number;
    [MAX]?: number;
    [QUERYABLE]?: boolean;
    [PARENTVALUES]?: any;
  }
}

const keyToSymbolMap = {
  name: NAME,
  length: LENGTH,
  min: MIN,
  max: MAX,
  queryable: QUERYABLE,
  parent: PARENTVALUES,
} as const;

type Prop = keyof typeof keyToSymbolMap;
type PropValue = {
  [key in keyof typeof keyToSymbolMap]: Object[(typeof keyToSymbolMap)[key]];
};
type MapValues<T extends Prop[]> = T extends [
  infer U extends Prop,
  ...infer Rest extends Prop[],
]
  ? [PropValue[U], ...MapValues<Rest>]
  : [];

export namespace Meta {
  export function has(object: Object, prop: Prop) {
    return !!object[keyToSymbolMap[prop]];
  }

  export function get(object: Object, prop: Prop) {
    if (prop === `length` && Array.isArray(object)) return object.length;
    return object[keyToSymbolMap[prop]];
  }

  export function getN<const T extends Prop[]>(object: Object, props: T) {
    const result = [];
    for (let i = 0; i < props.length; i++) result.push(get(object, props[i]));
    return result as MapValues<T>;
  }

  export function set<T extends Prop>(
    object: Object,
    prop: T,
    value: PropValue[T],
  ) {
    object[keyToSymbolMap[prop]] = value;
  }

  export function setN<const T extends Prop[]>(
    object: Object,
    props: T,
    values: MapValues<T>,
  ) {
    for (let i = 0; i < props.length; i++) {
      set(object, props[i], values[i]);
    }
  }

  export function copy(target: Object, source: Object, props?: Prop[]) {
    const keys = props ?? Object.keys(keyToSymbolMap);
    for (const key of keys as Prop[]) {
      // Need to use get() here in case e.g. `length`
      target[keyToSymbolMap[key]] = get(source, key);
    }
  }
}
