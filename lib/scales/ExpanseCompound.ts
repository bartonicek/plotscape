import { Polymorphic } from "../utils/Polymorphic";
import { Reactive } from "../utils/Reactive";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface ExpanseCompound<T extends Expanse[] = Expanse[]>
  extends Expanse<any[]> {
  type: `compound`;
  readonly value: any[];
  readonly normalized: number[];

  expanses: T;
  continuous: ExpanseContinuous;
  props: { min: number; max: number };
  commonScale: boolean;
}

export namespace ExpanseCompound {
  const type = `compound` as const;

  export function of<T extends Expanse[] = Expanse[]>(expanses: T) {
    const base = Expanse.base();
    const continuous = ExpanseContinuous.of();
    const commonScale = false;

    const result = { ...base, continuous, type, commonScale, expanses };
    return result as unknown as ExpanseCompound<T>;
  }

  // Expanse methods implementations
  Polymorphic.set(Expanse.normalize, type, normalize);
  Polymorphic.set(Expanse.unnormalize, type, unnormalize);
  Polymorphic.set(Expanse.train, type, train);
  Polymorphic.set(Expanse.breaks, type, breaks as any);
  Polymorphic.set(Expanse.reset, type, reset);

  export function normalize(expanse: ExpanseCompound, values: any[]) {
    const { expanses } = expanse;

    if (expanse.commonScale === true) {
      return values.map((e) => Expanse.normalize(expanse.continuous, e));
    }

    return values.map((e, i) => Expanse.normalize(expanses[i], e));
  }

  export function unnormalize(expanse: ExpanseCompound, values: number[]) {
    const { expanses } = expanse;

    if (expanse.commonScale === true) {
      return values.map((e) => Expanse.normalize(expanse.continuous, e));
    }

    return values.map((e, i) => Expanse.unnormalize(expanses[i], e));
  }

  export function train(expanse: ExpanseCompound, values: any[][]) {
    const { expanses } = expanse;

    if (values.length != expanses.length) {
      throw new Error(
        `The number of arrays does not match the number of expanses.`,
      );
    }

    for (let i = 0; i < values.length; i++) {
      Expanse.train(expanses[i], values[i], { default: true });
    }
  }

  export function breaks(expanse: ExpanseCompound, zero: number, one: number) {
    const result = ExpanseContinuous.breaks(expanse.continuous, zero, one);
    return result;
  }

  export function reset(expanse: ExpanseCompound) {
    for (const e of expanse.expanses) Expanse.reset(e);
    Expanse.reset(expanse.continuous);
  }

  export function setCommonScale(expanse: ExpanseCompound, value: boolean) {
    const { expanses, continuous } = expanse;

    if (!value) {
      expanse.commonScale = false;
      Object.assign(continuous.props, { min: 0, max: 1 });
      Object.assign(continuous.defaults, { min: 0, max: 1 });
      Reactive.dispatch(expanse, `changed`);
      return;
    }

    if (expanses.some((e) => !Expanse.isContinuous(e))) {
      throw new Error(
        `Common scale can only be set if all expanses are continuous.`,
      );
    }

    let [min, max] = [Infinity, -Infinity];
    for (const e of expanses as ExpanseContinuous[]) {
      min = Math.min(min, e.props.min);
      max = Math.max(max, e.props.max);
    }

    Object.assign(continuous.props, { min, max });
    Object.assign(continuous.defaults, { min, max });

    expanse.commonScale = true;
    Reactive.dispatch(expanse, `changed`);
  }
}
