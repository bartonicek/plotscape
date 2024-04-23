import { Dict, minMax, seq } from "utils";
import { mix } from "../funs";
import { Named, named } from "../mixins/Named";
import { Queryable, queryable } from "../mixins/Queryable";
import { ShallowCloneable, shallowCloneable } from "../mixins/ShallowClonable";
import { Expanse } from "../scales/Expanse";
import {
  ExpanseContinuous,
  isExpanseContinuous,
  newExpanseContinuous,
} from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { Variable, isContinuous } from "./Variable";

type VariableTuple<T extends unknown[]> = {
  [key in keyof T]: Variable<T[key]>;
};

/** Returns an array of values by index. */
export interface Tuple<T extends unknown[] = unknown[]>
  extends Named,
    Queryable,
    ShallowCloneable {
  order: number[];
  variables: VariableTuple<T>;

  commonDomain: boolean;
  domain: Expanse<T>;

  n(): number;
  valueAt(index: number, offset?: number): T;
  scaledAt(index: number, scale: Scale): number[];
  clone(): Tuple<T>;

  setOrder(indices: number[]): this;
  setCommonDomain(): ExpanseContinuous;
  unsetCommonDomain(): ExpanseContinuous;

  injectQueryInfo(index: number, infoDict: Dict): void;
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
    injectQueryInfo,
  };
  const self = mix({ ...props, ...methods })
    .with(named)
    .with(queryable)
    .with(shallowCloneable);

  return self;
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

  for (let j = 0; j < variables.length; j++) {
    const variable = variables[j];
    scale.domain = commonDomain ? domain : variable.domain;
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
  if (!isExpanseContinuous(this.domain)) {
    throw new Error(`Only continuous domain can be shared.`);
  }

  let [min, max] = [Infinity, -Infinity];

  for (const v of this.variables) {
    if (!isContinuous(v)) {
      throw new Error(`All variables must be continuous for common domain.`);
    }
    const [newMin, newMax] = minMax(v.array);
    min = Math.min(min, newMin);
    max = Math.max(max, newMax);
  }

  this.domain.setMinMax(min, max);
  this.commonDomain = true;

  return this.domain;
}

function unsetCommonDomain<T extends unknown[]>(this: Tuple<T>) {
  if (!isExpanseContinuous(this.domain)) {
    throw new Error(`Only continuous domain can be shared.`);
  }

  this.domain.setMinMax(0, 1);
  this.commonDomain = false;

  return this.domain;
}

function injectQueryInfo<T extends unknown[]>(
  this: Tuple<T>,
  index: number,
  infoDict: Dict
) {
  for (const v of this.variables) {
    if (!v.hasName()) continue;
    v.injectQueryInfo(index, infoDict);
  }
}
