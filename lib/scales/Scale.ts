import { Reactive } from "../Reactive";
import { getName, makeDispatchFn, makeListenFn } from "../utils/funs";
import { NAME } from "../utils/symbols";
import { Expanse, ExpanseValueMap } from "./Expanse";

export interface Scale<T extends Expanse = any, U extends Expanse = any>
  extends Reactive {
  other?: Scale;
  domain: T;
  codomain: U;
}

type EventType = `changed`;

export namespace Scale {
  export function of<T extends Expanse, U extends Expanse>(
    domain: T,
    codomain: U
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
    value: ExpanseValueMap[T["type"]]
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(codomain, Expanse.normalize(domain, value));
  }

  export function pullback<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: ExpanseValueMap[U["type"]]
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(domain, Expanse.normalize(codomain, value));
  }

  export function train<T extends Expanse>(
    scale: Scale<T>,
    array: ExpanseValueMap[T["type"]][],
    options?: { default?: boolean; silent?: boolean; ratio?: true }
  ) {
    if (getName(array) !== undefined) scale[NAME] = array[NAME];

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
