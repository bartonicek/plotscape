import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface ExpanseCompound<T extends Expanse[] = Expanse[]>
  extends Expanse<any[]> {
  expanses: T;
}

export namespace ExpanseCompound {
  export function of<T extends Expanse[] = Expanse[]>(
    expanses: T = [] as unknown as T,
    options?: { zero?: number; one?: number; direction?: Direction },
  ): ExpanseCompound<T> {
    const value = [] as any[];
    const type = `compound` as const;

    const base = Expanse.continuous(0, 1, options);
    const { zero, one, direction } = base;
    const defaults = { zero, one, direction };

    for (const expanse of expanses) {
      Object.assign(expanse, { zero, one, direction });
      Object.assign(expanse.defaults, { zero, one, direction });
    }

    const expanse = { expanses, ...base, value, type, defaults };
    Expanse.listen(expanse, `changed`, () => {
      const { zero, one, direction } = expanse;
      for (const expanse of expanses) {
        Object.assign(expanse, { zero, one, direction });
        Object.assign(expanse.defaults, { zero, one, direction });
      }
    });

    return expanse;
  }

  export function normalize(expanse: ExpanseCompound, value: any[]) {
    const { expanses } = expanse;
    return value.map((e, i) => Expanse.normalize(expanses[i], e)) as number[];
  }

  export function unnormalize(expanse: ExpanseCompound, value: number[]) {
    const { expanses } = expanse;
    return value.map((e, i) => Expanse.unnormalize(expanses[i], e)) as any[];
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
    return ExpanseContinuous.breaks(expanse as unknown as ExpanseContinuous);
  }

  export function restoreDefaults(expanse: ExpanseCompound) {
    for (const e of expanse.expanses) Expanse.restoreDefaults(e);
  }
}
