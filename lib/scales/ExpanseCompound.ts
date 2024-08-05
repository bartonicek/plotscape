import { seq } from "../utils/funs";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";

export interface ExpanseCompound<T extends Expanse[] = Expanse[]>
  extends Expanse {
  expanses: T;
}

export namespace ExpanseCompound {
  export function of<T extends Expanse[] = Expanse[]>(
    expanses: T = [] as unknown as T,
    options?: { zero?: number; one?: number; direction?: Direction },
  ): ExpanseCompound<T> {
    const type = Expanse.Type.Compound;
    const base = Expanse.base(options);
    const { zero, one, direction } = base;
    const defaults = { zero, one, direction };
    return { type, expanses, ...base, defaults };
  }

  export function normalize(expanse: ExpanseCompound, value: any[]): number[] {
    const { expanses } = expanse;
    if (!Array.isArray(value)) return value;
    return value.map((e, i) => Expanse.normalize(expanses[i], e)) as number[];
  }

  export function unnormalize(
    expanse: ExpanseCompound,
    value: any[],
  ): number[] {
    const { expanses } = expanse;
    if (!Array.isArray(value)) return value;
    return value.map((e, i) => Expanse.unnormalize(expanses[i], e)) as number[];
  }

  export function train(expanse: ExpanseCompound, values: any[][]) {
    const { expanses } = expanse;

    if (values.length != expanses.length) {
      const msg = `The number of arrays does not match the number of expanses.`;
      throw new Error(msg);
    }

    for (let i = 0; i < values.length; i++) {
      Expanse.train(expanses[i], values[i]);
    }
  }

  export function breaks(expanse: ExpanseCompound) {
    return seq(expanse.zero, expanse.one, 4);
  }
}
