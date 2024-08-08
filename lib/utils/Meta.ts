import { isArray } from "./funs";

const NAME = Symbol(`name`);
const LENGTH = Symbol(`length`);
const MIN = Symbol(`min`);
const MAX = Symbol(`max`);
const QUERYABLE = Symbol(`queryable`);
export const PARENTVALUES = Symbol(`parentValues`);
export const FACTOR = Symbol(`factor`);
export const REDUCER = Symbol(`reducer`);

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

export const metaProps = {
  name: NAME,
  length: LENGTH,
  min: MIN,
  max: MAX,
  queryable: QUERYABLE,
  parent: PARENTVALUES,
} as const;

export type MetaProp = keyof typeof metaProps;

export namespace Meta {
  export function copy(source: Object, target: Object, props?: MetaProp[]) {
    const keys = props ?? Object.keys(metaProps);
    for (const key of keys as MetaProp[]) {
      target[metaProps[key]] = source[metaProps[key]];
    }
  }

  export function has(object: Object, prop: MetaProp) {
    return !!object[metaProps[prop]];
  }

  export function hasName(object: Object) {
    return !!object[NAME];
  }

  export function getName(object: Object) {
    return object[NAME] ?? `unknown`;
  }

  export function setName(object: Object, value: string) {
    object[NAME] = value;
  }

  export function getLength(object: Object) {
    if (isArray(object)) return object.length;
    return object[LENGTH];
  }

  export function setLength(object: Object, value: number) {
    object[LENGTH] = value;
  }

  export function hasMinMax(array: number[]) {
    return !!array[MIN] && !!array[MAX];
  }

  export function getMinMax(array: number[]): [number, number] | undefined {
    return hasMinMax(array) ? [array[MIN]!, array[MAX]!] : undefined;
  }

  export function setMinMax(array: number[], min: number, max: number) {
    array[MIN] = min;
    array[MAX] = max;
  }

  export function isQueryable(object: Object) {
    return object[QUERYABLE];
  }

  export function setQueryable(object: Object, value: boolean) {
    object[QUERYABLE] = value;
  }
}
