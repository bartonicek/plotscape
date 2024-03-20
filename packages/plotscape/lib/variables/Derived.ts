import { Scale } from "../Scale";
import { Named } from "../mixins/Named";
import { Proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Derived<T> extends Named, Variable<T>, Proxyable<T> {
  variable?: Variable<any>;
  derivefn: (index: number, variable?: Variable<unknown>) => T;
  valueAt(index: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
}

export function newDerived<T, U>(
  derivefn: (index: number, variable?: Variable<U>) => T,
  variable?: Variable<U>
) {
  return { variable, derivefn, valueAt, scaledAt } as Derived<T>;
}

function valueAt<T>(this: Derived<T>, index: number) {
  return this.derivefn(index, this.variable);
}

function scaledAt<T>(this: Derived<T>, index: number, scale: Scale<T>) {
  return scale.pushforward(this.valueAt(index));
}
