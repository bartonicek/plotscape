import { Poly } from "../utils/Poly";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface ExpanseCompound<T extends Expanse[] = Expanse[]>
  extends Expanse<any[]> {
  expanses: T;
}

export namespace ExpanseCompound {
  const type = `compound` as const;

  export function of<T extends Expanse[] = Expanse[]>(
    expanses: T = [] as unknown as T,
  ): ExpanseCompound<T> {
    const value = [] as any[];
    const base = ExpanseContinuous.of();

    const result = { ...base, type, value, expanses };
    return result;
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize as any);
  Poly.set(Expanse.unnormalize, type, unnormalize as any);
  Poly.set(Expanse.train, type, train as any);
  Poly.set(Expanse.breaks, type, breaks);

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

  export function breaks(expanse: ExpanseCompound): any[] {
    return ExpanseContinuous.breaks(expanse as unknown as ExpanseContinuous);
  }

  export function reset(expanse: ExpanseCompound) {
    for (const e of expanse.expanses) Expanse.reset(e);
  }
}
