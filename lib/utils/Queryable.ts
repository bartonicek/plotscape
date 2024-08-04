declare global {
  interface Object {
    [QUERYABLE]?: boolean;
  }
}

const QUERYABLE = Symbol(`queryable`);

export namespace Queryable {
  export function set(object: Object, value: boolean) {
    object[QUERYABLE] = value;
  }

  export function is(object: Object) {
    return !!object[QUERYABLE];
  }

  export function copy(source: Object, target: Object) {
    target[QUERYABLE] = source[QUERYABLE];
  }
}
