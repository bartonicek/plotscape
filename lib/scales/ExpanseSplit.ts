import { identity } from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface ExpanseSplit<T = any> extends Expanse<T[]> {
  type: `split`;
  value: T[];
  normalized: number[];
  innerType: Expanse.Type;
}

export namespace ExpanseSplit {
  const type = `split`;

  export function of<T>(expanse?: Expanse<T>): ExpanseSplit<T> {
    const exp = expanse ?? ExpanseContinuous.of();
    const innerType = exp.type;

    return { ...exp, type, innerType } as unknown as ExpanseSplit;
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize as any);
  Poly.set(Expanse.unnormalize, type, unnormalize as any);
  Poly.set(Expanse.train, type, train as any);
  Poly.set(Expanse.breaks, type, breaks);

  export function normalize<T>(expanse: ExpanseSplit<T>, values: T | T[]) {
    const { innerType } = expanse;
    const fn = Poly.dispatch(Expanse.normalize, identity, innerType);

    if (Array.isArray(values)) return values.map((x) => fn(expanse, x));
    return fn(expanse, values);
  }

  export function unnormalize<T>(
    expanse: ExpanseSplit<T>,
    values: number | number[],
  ) {
    const { innerType } = expanse;
    const fn = Poly.dispatch(Expanse.unnormalize, identity, innerType);

    if (Array.isArray(values)) return values.map((x) => fn(expanse, x));
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
