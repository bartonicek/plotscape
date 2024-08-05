const NAME = Symbol(`name`);
const MIN = Symbol(`min`);
const MAX = Symbol(`max`);
const QUERYABLE = Symbol(`queryable`);

declare global {
  interface Object {
    [NAME]?: string;
    [MIN]?: number;
    [MAX]?: number;
    [QUERYABLE]?: boolean;
  }
}

export namespace Meta {
  export function copy(source: Object, target: Object) {
    target[NAME] = source[NAME];
    target[MIN] = source[MIN];
    target[MAX] = source[MAX];
    target[QUERYABLE] = source[QUERYABLE];
  }

  export function hasName(object: Object) {
    return !!object[NAME];
  }

  export function getName(object: Object) {
    return object[NAME] ?? `unknown`;
  }

  export function setName(object: Object, name: string) {
    object[NAME] = name;
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
}
