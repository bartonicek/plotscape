import { Dataframe } from "./Dataframe";
import { isObject, isTypedArray } from "./funs";
import { Indexable } from "./Indexable";
import { Metadata } from "./Metadata";
import { TypedArray } from "./types";

export type Getter<T> = (index: number) => T;

export namespace Getter {
  export function of(indexable: TypedArray): (index: number) => number;
  export function of<T>(indexable: Indexable<T>): (index: number) => T;
  export function of(indexable: Indexable | TypedArray) {
    if (typeof indexable === `function`) return indexable;

    if (Array.isArray(indexable) || isTypedArray(indexable)) {
      const getter = (index: number) => indexable[index];
      Metadata.set(getter, { length: indexable.length });
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
    if (isObject(indexable)) Metadata.copy(indexable, proxyGetter);

    Metadata.set(proxyGetter, { length: indices.length });
    return proxyGetter;
  }

  export function multi<T extends Indexable[]>(indexables: T): Getter<any[]> {
    const getters = indexables.map(Getter.of);
    const getter = (index: number) => getters.map((x) => x(index));
    Metadata.copy(indexables[0], getter, [`length`]);
    return getter;
  }

  export function mapObject<T extends Dataframe>(indexables: T) {
    const result = {} as any;
    for (const k of Reflect.ownKeys(indexables)) {
      result[k] = Getter.of(indexables[k]);
    }
    return result as { [key in keyof T]: Getter<Indexable.Value<T[key]>> };
  }

  export function array<T>(n: number, indexable: Indexable<T>) {
    const getter = Getter.of(indexable);
    const result = Array<T>(n);
    for (let i = 0; i < n; i++) result[i] = getter(i);
    return result;
  }
}
