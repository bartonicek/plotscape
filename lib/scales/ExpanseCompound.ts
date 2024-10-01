import { Poly } from "../utils/Poly";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface ExpanseCompound<T extends Expanse[] = Expanse[]>
  extends Expanse<any[]> {
  type: `compound`;
  value: any[];
  normalized: number[];

  expanses: T;
}

export namespace ExpanseCompound {
  const type = `compound` as const;

  export function of<T extends Expanse[] = Expanse[]>(expanses?: T) {
    const base = ExpanseContinuous.of();
    const exps = expanses ?? ([] as unknown as T);

    return { ...base, type, expanses: exps } as unknown as ExpanseCompound<T>;
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize);
  Poly.set(Expanse.unnormalize, type, unnormalize);
  Poly.set(Expanse.train, type, train);
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
