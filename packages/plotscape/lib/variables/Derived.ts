import { mix } from "../funs";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Expanse } from "../scales/Expanse";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { Variable } from "./Variable";

/** Returns values by index based on a function which may or
 * may not refer to another variable.
 */
export interface Derived<T> extends Named, Variable<T>, Proxyable<T> {
  variable?: Variable;
  domain: Expanse<T>;
  derivefn: (index: number, variable?: Variable) => T;
  setDomain(domain: Expanse<T>): this;
  valueAt(index: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
}

export function newDerived<T, U>(
  derivefn: (index: number, variable?: Variable<U>) => T,
  variable?: Variable<U>
): Derived<T> {
  const tag = `Derived`;
  const domain = newExpanseContinuous() as unknown as Expanse<T>;
  const props = { [Symbol.toStringTag]: tag, variable, domain };
  const methods = { clone, n, derivefn, valueAt, scaledAt, setDomain };
  const self = { ...props, ...methods };

  return mix(self).with(named).with(proxyable) as Derived<T>;
}

function clone<T>(this: Derived<T>) {
  return this;
}

function n<T>(this: Derived<T>) {
  return -1;
}

function setDomain<T>(this: Derived<T>, domain: Expanse<T>) {
  this.domain = domain;
  return this;
}

function valueAt<T>(this: Derived<T>, index: number) {
  return this.derivefn(index, this.variable);
}

function scaledAt<T>(this: Derived<T>, index: number, scale: Scale<T>) {
  return scale.pushforward(this.valueAt(index));
}
