import { identity } from "../utils/funs";
import { Polymorphic } from "../utils/Polymorphic";
import { satisfies } from "../utils/types";
import { Expanse, ExpanseMethods } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface ExpanseSplit<T = any> extends Expanse<T[]> {
  type: `split`;
  value: T[];
  normalized: number[];

  props: { innerType: Expanse.Type };
}

// Check that generic methods are implemented
satisfies<ExpanseMethods<any[]>, typeof ExpanseSplit>;

export namespace ExpanseSplit {
  const type = `split`;

  export function of<T>(expanse?: Expanse<T>): ExpanseSplit<T> {
    const exp = expanse ?? ExpanseContinuous.of();
    const props = { ...exp.props, innerType: exp.type };

    return { ...exp, type, props } as ExpanseSplit;
  }

  // Expanse methods implementations
  Polymorphic.set(Expanse.normalize, type, normalize);
  Polymorphic.set(Expanse.unnormalize, type, unnormalize);
  Polymorphic.set(Expanse.train, type, train as any);
  Polymorphic.set(Expanse.breaks, type, breaks);

  export function normalize<T>(expanse: ExpanseSplit<T>, values: T[]) {
    const { innerType } = expanse.props;

    const fn = Polymorphic.dispatch(Expanse.normalize, identity, innerType);

    if (Array.isArray(values)) return values.map((x) => fn(expanse, x));
    return fn(expanse, values);
  }

  export function unnormalize<T>(expanse: ExpanseSplit<T>, values: number[]) {
    const { innerType } = expanse.props;
    const fn = Polymorphic.dispatch(Expanse.unnormalize, identity, innerType);

    if (Array.isArray(values)) return values.map((x) => fn(expanse, x));
    return fn(expanse, values);
  }

  export function train<T>(expanse: ExpanseSplit<T>, array: T[]) {
    const { innerType } = expanse.props;
    const fn = Polymorphic.dispatch(Expanse.train, identity, innerType);
    fn(expanse, array);
  }

  export function breaks<T>(expanse: ExpanseSplit<T>) {
    const { innerType } = expanse.props;
    const fn = Polymorphic.dispatch(Expanse.breaks, identity, innerType);
    return fn(expanse);
  }
}
