import { NAME } from "./symbols";

export namespace Name {
  export function has(object: Object) {
    return object[NAME] !== undefined;
  }

  export function get(object: Object) {
    return object[NAME] ?? `unknown`;
  }

  export function set(object: Object, value: string) {
    object[NAME] = value;
  }

  export function copy(source: Object, target: Object) {
    target[NAME] = source[NAME];
  }
}
