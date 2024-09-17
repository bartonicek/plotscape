import { identity, isArray } from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Expanse } from "./Expanse";

export interface ExpanseSplit<T = any> extends Expanse<T[]> {
  type: `split`;
  innerType: Expanse.Type;
}

export namespace ExpanseSplit {
  const type = `split`;

  export function of<T>(expanse: Expanse<T>): ExpanseSplit<T> {
    const value = [] as T[];
    const innerType = expanse.type;

    return { ...expanse, value, type, innerType };
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize as any);
  Poly.set(Expanse.unnormalize, type, unnormalize as any);
  Poly.set(Expanse.train, type, train as any);
  Poly.set(Expanse.breaks, type, breaks);

  export function normalize<T>(expanse: ExpanseSplit<T>, values: T | T[]) {
    const { innerType } = expanse;
    const fn = Poly.dispatch(Expanse.normalize, identity, innerType);

    if (isArray(values)) return values.map((x) => fn(expanse, x));
    return fn(expanse, values);
  }

  export function unnormalize<T>(
    expanse: ExpanseSplit<T>,
    values: number | number[],
  ) {
    const { innerType } = expanse;
    const fn = Poly.dispatch(Expanse.unnormalize, identity, innerType);

    if (isArray(values)) return values.map((x) => fn(expanse, x));
    return fn(expanse, values);
  }

  export function train<T>(expanse: ExpanseSplit<T>, array: T[]) {
    const { innerType } = expanse;
    const fn = Poly.dispatch(Expanse.train, identity, innerType);
    fn(expanse, array);
  }

  export function breaks<T>(expanse: ExpanseSplit<T>) {
    const { innerType } = expanse;
    const fn = Poly.dispatch(Expanse.breaks, identity, innerType);
    return fn(expanse);
  }
}
