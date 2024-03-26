import { named } from "../mixins/Named";
import { Expanse } from "../scales/Expanse";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { Dimension } from "../types";
import { Variable, isContinuous } from "./Variable";

type VariableTuple<T extends unknown[]> = {
  [key in keyof T]: Variable<T[key]>;
};

export interface Tuple<T extends unknown[] = unknown[]>
  extends Variable<T, Dimension.Tuple> {
  commonDomain: boolean;
  variables: VariableTuple<T>;
  setCommonDomain(): this;
}

export function newTuple<T extends any[]>(
  variables: VariableTuple<T>
): Tuple<T> {
  const commonDomain = false;
  const domain = newExpanseContinuous() as unknown as Expanse<T>;
  const props = { variables, domain, commonDomain };
  const methods = { clone, n, valueAt, scaledAt, setCommonDomain };
  const self = { ...props, ...methods };

  return named(self);
}

function clone<T extends unknown[]>(this: Tuple<T>) {
  const copy = { ...this };
  return copy;
}

function n<T extends unknown[]>(this: Tuple<T>) {
  for (const v of this.variables) {
    if (v.n) return v.n();
  }
  throw new Error(`No fixed length variables present`);
}

function valueAt<T extends unknown[]>(
  this: Tuple<T>,
  index: number,
  offset = 0
) {
  const { variables } = this;
  const result = Array(variables.length) as T;
  for (let i = 0; i < variables.length; i++) {
    result[i] = variables[i].valueAt(index, offset);
  }
  return result;
}

function scaledAt<T extends unknown[]>(
  this: Tuple<T>,
  index: number,
  scale: Scale
) {
  const { variables, domain, commonDomain } = this;
  const result = Array(variables.length) as number[];

  const originalDomain = scale.domain;
  if (commonDomain) scale.domain = domain;

  for (let j = 0; j < variables.length; j++) {
    if (!commonDomain) scale.domain = variables[j].domain;
    result[j] = variables[j].scaledAt(index, scale);
  }

  scale.domain = originalDomain; // Need to set the domain back to the original value
  return result;
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
