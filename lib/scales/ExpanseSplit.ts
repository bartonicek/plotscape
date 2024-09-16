import { identity, isArray } from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Expanse } from "./Expanse";

export interface ExpanseSplit<T = any> extends Expanse<T[]> {
  type: `split`;
  innerType: Expanse.Type;
}

export namespace ExpanseSplit {
  const type = `split` as const;

  export function of<T>(expanse: Expanse<T>): ExpanseSplit<T> {
    const value = [] as T[];
    const innerType = expanse.type;

    return { ...expanse, value, type, innerType };
  }

  // Expanse method implementations
  Poly.set(Expanse.normalize, type, normalize as any);
  Poly.set(Expanse.unnormalize, type, unnormalize as any);
  Poly.set(Expanse.train, type, train as any);
  Poly.set(Expanse.breaks, type, breaks);

  function normalize<T>(expanse: ExpanseSplit<T>, values: T | T[]) {
    const { innerType: type } = expanse;
    const normalizefn = Poly.dispatch(Expanse.normalize, identity, type);

    if (isArray(values)) return values.map((x) => normalizefn(expanse, x));
    return normalizefn(expanse, values);
  }

  function unnormalize<T>(expanse: ExpanseSplit<T>, values: number | number[]) {
    const { innerType: type } = expanse;
    const unnormalizefn = Poly.dispatch(Expanse.unnormalize, identity, type);

    if (isArray(values)) return values.map((x) => unnormalizefn(expanse, x));
    return unnormalizefn(expanse, values);
  }

  function train<T>(expanse: ExpanseSplit<T>, array: T[]) {
    const { innerType: type } = expanse;
    const trainfn = Poly.dispatch(Expanse.train, identity, type);

    trainfn(expanse, array);
  }

  function breaks<T>(expanse: ExpanseSplit<T>) {
    const { innerType: type } = expanse;
    const breaksfn = Poly.dispatch(Expanse.train, identity, type);

    return breaksfn(expanse);
  }
}
