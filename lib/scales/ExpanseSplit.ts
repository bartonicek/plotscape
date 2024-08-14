import { isArray } from "../utils/funs";
import { Expanse } from "./Expanse";

export interface ExpanseSplit<T = any> extends Expanse<T[]> {
  type: `split`;
  innerType: Expanse.Type;
}

export namespace ExpanseSplit {
  export function of<T>(expanse: Expanse<T>): ExpanseSplit<T> {
    const value = [] as T[];
    const type = `split`;
    const innerType = expanse.type;

    return { ...expanse, value, type, innerType };
  }

  export function normalize<T>(expanse: ExpanseSplit<T>, values: T | T[]) {
    if (isArray(values)) {
      return values.map((x) =>
        Expanse.methods[expanse.innerType].normalize(expanse, x),
      );
    }
    return Expanse.methods[expanse.innerType].normalize(expanse, values);
  }

  export function unnormalize<T>(
    expanse: ExpanseSplit<T>,
    values: number | number[],
  ) {
    if (isArray(values)) {
      return values.map((x) =>
        Expanse.methods[expanse.innerType].unnormalize(expanse, x),
      );
    }
    return Expanse.methods[expanse.innerType].unnormalize(expanse, values);
  }

  export function train<T>(expanse: ExpanseSplit<T>, array: T[]) {
    Expanse.methods[expanse.innerType].train(expanse, array);
  }

  export function breaks<T>(expanse: ExpanseSplit<T>) {
    return Expanse.methods[expanse.innerType].breaks(expanse);
  }
}
