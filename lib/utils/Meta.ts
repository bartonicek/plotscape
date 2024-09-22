const NAME = Symbol(`name`);
const LENGTH = Symbol(`length`);
const MIN = Symbol(`min`);
const MAX = Symbol(`max`);
const QUERYABLE = Symbol(`queryable`);
const REDUCED = Symbol(`reduced`);
const PARENT_VALUES = Symbol(`parent-values`);
const IS_DIMENSION = Symbol(`is-dimension`);

declare global {
  interface Object {
    [NAME]?: string;
    [LENGTH]?: number;
    [MIN]?: number;
    [MAX]?: number;
    [QUERYABLE]?: boolean;
    [REDUCED]?: boolean;
    [PARENT_VALUES]?: any;
    [IS_DIMENSION]: boolean;
  }
}

const keyToSymbolMap = {
  name: NAME,
  length: LENGTH,
  min: MIN,
  max: MAX,
  queryable: QUERYABLE,
  reduced: REDUCED,
  parent: PARENT_VALUES,
  isDimension: IS_DIMENSION,
} as const;

type KeyToSymbolMap = typeof keyToSymbolMap;
type Prop = keyof KeyToSymbolMap;
type PropValue = { [key in keyof KeyToSymbolMap]: Object[KeyToSymbolMap[key]] };
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

  export function get<T extends Prop | Prop[]>(object: Object, props: T) {
    if (Array.isArray(props)) return props.map((x) => getDatum(object, x));
    return getDatum(object, props);
  }

  function getDatum<T extends Prop>(object: Object, prop: T) {
    if (prop === `length` && Array.isArray(object)) return object.length;
    return object[keyToSymbolMap[prop]];
  }

  type PropDict = {
    [key in keyof typeof keyToSymbolMap]: Object[(typeof keyToSymbolMap)[key]];
  };

  export function set(object: Object, props: Partial<PropDict>) {
    type Entries = [keyof KeyToSymbolMap, any][];
    for (const [k, v] of Object.entries(props) as Entries) {
      object[keyToSymbolMap[k]] = v;
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
