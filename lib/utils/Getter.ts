import { isObject, isTypedArray } from "./funs";
import { Meta } from "./Meta";
import { Indexable, TypedArray } from "./types";

type Getter<T> = (index: number) => T;

export namespace Getter {
  export function of(indexable: TypedArray): (index: number) => number;
  export function of<T>(indexable: Indexable<T>): (index: number) => T;
  export function of(indexable: Indexable | TypedArray) {
    if (typeof indexable === `function`) return indexable;

    if (Array.isArray(indexable)) {
      const getter = (index: number) => indexable[index];
      Meta.set(getter, `length`, indexable.length);
      return getter;
    }

    if (isTypedArray(indexable)) {
      const getter = (index: number) => indexable[index];
      Meta.set(getter, `length`, indexable.length);
      return getter;
    }

    return () => indexable;
  }

  export function constant<T>(value: T): Getter<T> {
    return () => value;
  }

  export function proxy<T>(
    indexable: Indexable<T>,
    indices: number[] | Uint32Array,
  ): Getter<T> {
    const getter = Getter.of(indexable);
    const proxyGetter = (index: number) => getter(indices[index]);
    if (isObject(indexable)) {
      Meta.copy(proxyGetter, indexable);
    }

    Meta.set(proxyGetter, `length`, indices.length);
    return proxyGetter;
  }

  export function multi<T extends Indexable[]>(indexables: T): Getter<any[]> {
    const getters = indexables.map(Getter.of);
    const getter = (index: number) => getters.map((x) => x(index));
    Meta.copy(getter, indexables[0], [`length`]);
    return getter;
  }
}
