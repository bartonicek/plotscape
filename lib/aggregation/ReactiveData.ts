import { Reactive } from "../Reactive";
import { copyValues, merge, subset } from "../utils/funs";
import { PARENT } from "../utils/symbols";
import { Dataframe } from "../utils/types";
import { Factor } from "./Factor";

export interface ReactiveData<T extends Dataframe> extends Reactive {
  flat: T;
  grouped: T;
}

export namespace ReactiveData {
  export function of<
    T extends Dataframe,
    U extends Dataframe,
    V extends Factor[]
  >(data: T, computefn: (data: T, factor: Factor) => U, ...factors: V) {
    const result = {} as Record<string, U & V[number]["data"]>;

    for (let i = 0; i < factors.length; i++) {
      result[i] = compute(data, factors[i], computefn, result[i - 1]);

      Factor.listen(factors[i], `changed`, () => {
        const newData = compute(data, factors[i], computefn, result[i - 1]);

        for (const k of Object.keys(newData)) {
          copyValues(newData[k], result[i][k]);
          result[i][k][PARENT] = newData[k][PARENT];
        }
      });
    }

    return result;
  }

  function compute<T extends Dataframe, U extends Factor, V extends Dataframe>(
    data: T,
    factor: U,
    computefn: (data: T, factor: U) => V,
    parentData?: V
  ) {
    const computed = computefn(data, factor);
    if (!(parentData && factor.parentIndices)) {
      return merge(computed, factor.data);
    }

    for (const k of Object.keys(computed)) {
      const parentValues = subset(parentData[k], factor.parentIndices);
      computed[k][PARENT] = parentValues;
    }

    return merge(computed, factor.data);
  }
}
