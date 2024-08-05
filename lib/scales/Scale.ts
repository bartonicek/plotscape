import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Expanse, ExpanseValueMap } from "./Expanse";

export interface Scale<T extends Expanse = any, U extends Expanse = any>
  extends Reactive {
  other?: Scale;
  domain: T;
  codomain: U;
  // pushadapter: (value: any, domain: T, codomain: U) => number;
  // pulladapter: (value: any, domain: T, codomain: U) => any;
}

type EventType = `changed`;

export namespace Scale {
  export function of<T extends Expanse, U extends Expanse>(
    domain: T,
    codomain: U,
  ): Scale<T, U> {
    const scale = Reactive.of({ domain, codomain });

    Expanse.listen(domain, `changed`, () => Scale.dispatch(scale, `changed`));
    Expanse.listen(codomain, `changed`, () => Scale.dispatch(scale, `changed`));

    return scale;
  }

  export const dispatch = makeDispatchFn<Scale, EventType>();
  export const listen = makeListenFn<Scale, EventType>();

  export function pushforward<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: ExpanseValueMap[T["type"]],
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(codomain, Expanse.normalize(domain, value));
  }

  export function pullback<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: ExpanseValueMap[U["type"]],
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(domain, Expanse.normalize(codomain, value));
  }

  export function expand(
    scale: Scale,
    zero: number,
    one: number,
    options?: { default?: boolean },
  ) {
    Expanse.expand(scale.domain, zero, one, options);
  }

  export function train<T extends Expanse>(
    scale: Scale<T>,
    array: ExpanseValueMap[T["type"]][],
    options?: {
      default?: boolean;
      silent?: boolean;
      ratio?: boolean;
      name?: boolean;
    },
  ) {
    const setName = options?.name ?? true;
    if (setName && Meta.hasName(array)) Meta.copy(array, scale);

    // Automatically coerce expanse to band if array is string
    if (typeof array[0] === "string" && Expanse.isContinuous(scale.domain)) {
      const labels = Array.from(new Set(array) as Set<string>);
      scale.domain = Expanse.band(labels) as unknown as T;
    }

    Expanse.train(scale.domain, array, options);
  }

  export function restoreDefaults(scale: Scale) {
    Expanse.restoreDefaults(scale.domain);
    Expanse.restoreDefaults(scale.codomain);
  }

  export function breaks(scale: Scale) {
    return Expanse.breaks(scale.domain);
  }

  export function move(scale: Scale, amount: number) {
    Expanse.move(scale.domain, amount);
  }
}
