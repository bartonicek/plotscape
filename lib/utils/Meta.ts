const MIN = Symbol(`min`);
const MAX = Symbol(`max`);

declare global {
  interface Array<T> {
    [MIN]: number;
    [MAX]: number;
  }
}

export namespace Meta {
  export function copy(source: any[], target: any[]) {
    target[MIN] = source[MIN];
    target[MAX] = source[MAX];
  }

  export function hasMinMax(array: number[]) {
    return !!array[MIN] && !!array[MAX];
  }

  export function getMinMax(array: number[]) {
    return hasMinMax(array) ? [array[MIN], array[MAX]] : undefined;
  }

  export function setMinMax(array: number[], min: number, max: number) {
    array[MIN] = min;
    array[MAX] = max;
  }
}
