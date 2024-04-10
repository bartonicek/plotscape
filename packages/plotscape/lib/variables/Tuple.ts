import { seq } from "utils";
import { mix } from "../funs";
import { Named, named } from "../mixins/Named";
import { Queryable, queryable } from "../mixins/Queryable";
import { Expanse } from "../scales/Expanse";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { Variable, isContinuous } from "./Variable";

type VariableTuple<T extends unknown[]> = {
  [key in keyof T]: Variable<T[key]>;
};

/** Returns an array of values by index. */
export interface Tuple<T extends unknown[] = unknown[]>
  extends Named,
    Queryable {
  order: number[];
  variables: VariableTuple<T>;
  commonDomain: boolean;

  domain: Expanse;
  n(): number;
  valueAt(index: number, offset?: number): T;
  scaledAt(index: number, scale: Scale): number[];
  clone(): Tuple<T>;

  setOrder(indices: number[]): this;
  setCommonDomain(): this;
  unsetCommonDomain(): this;
}

export function newTuple<T extends any[]>(
  variables: VariableTuple<T>
): Tuple<T> {
  const tag = `Tuple`;
  const commonDomain = false;
  const order = seq(0, variables.length - 1);
  const domain = newExpanseContinuous() as unknown as Expanse<T>;
  const props = { tag, variables, order, domain, commonDomain };
  const methods = {
    clone,
    n,
    valueAt,
    scaledAt,
    setOrder,
    setCommonDomain,
    unsetCommonDomain,
  };
  const self = { ...props, ...methods };

  return mix(self).with(named).with(queryable);
}

function clone<T extends unknown[]>(this: Tuple<T>) {
  const copy = { ...this };
  return copy;
}

function n<T extends unknown[]>(this: Tuple<T>) {
  for (const v of this.variables) {
    if (v.n() != -1) return v.n();
  }
  throw new Error(`No fixed length variables present`);
}

function valueAt<T extends unknown[]>(
  this: Tuple<T>,
  index: number,
  offset = 0
) {
  const { variables, order } = this;
  const result = Array(variables.length) as T;
  for (let j = 0; j < variables.length; j++) {
    const variable = variables[j];
    result[order[j]] = variable.valueAt(index, offset);
  }
  return result;
}

function scaledAt<T extends unknown[]>(
  this: Tuple<T>,
  index: number,
  scale: Scale
) {
  const { variables, order, domain, commonDomain } = this;
  const result = Array(variables.length) as number[];

  const originalDomain = scale.domain;
  if (commonDomain) scale.domain = domain; // Swap the scale domain for the common domain

  for (let j = 0; j < variables.length; j++) {
    const variable = variables[j];
    if (!commonDomain) scale.domain = variable.domain;
    result[order[j]] = variable.scaledAt(index, scale);
  }

  scale.domain = originalDomain; // Set the domain back to the original value
  return result;
}

function setOrder<T extends unknown[]>(this: Tuple<T>, indices: number[]) {
  for (let i = 0; i < indices.length; i++) this.order[i] = indices[i];
  return this;
}

function setCommonDomain<T extends unknown[]>(this: Tuple<T>) {
  let [min, max] = [Infinity, -Infinity];

  for (const v of this.variables) {
    if (!isContinuous(v)) {
      const message = `All variables must be continuous to set a common domain.`;
      throw new Error(message);
    }

    min = Math.min(min, v.domain.min);
    max = Math.max(max, v.domain.max);
  }

  this.domain.setMin!(min).setMax!(max);
  this.commonDomain = true;

  return this;
}

function unsetCommonDomain<T extends unknown[]>(this: Tuple<T>) {
  this.domain.setMin!(0).setMax!(1);
  this.commonDomain = false;
  return this;
}
