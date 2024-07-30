import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { Expanse, ExpanseValueMap } from "./Expanse";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpansePoint } from "./ExpansePoint";

export interface Scale<T extends Expanse = any, U extends Expanse = any> {
  other?: Scale;
  dispatch: EventTarget;
  domain: T;
  codomain: U;
}

type EventType = `changed`;

export namespace Scale {
  export function of<T extends Expanse, U extends Expanse>(
    domain: T,
    codomain: U
  ): Scale<T, U> {
    const dispatch = new EventTarget();
    const scale = { domain, dispatch, codomain } as any;

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
    options?: { default?: boolean }
  ) {
    Expanse.train(scale.domain, array, options);
  }

  export function restoreDefaults(scale: Scale) {
    Expanse.restoreDefaults(scale.domain);
    Expanse.restoreDefaults(scale.codomain);
  }

  export function breaks(scale: Scale) {
    const { domain } = scale;
    const labels = Expanse.breaks(domain);
    const positions = labels.map((x) => Scale.pushforward(scale, x));
    return { labels, positions };
  }

  export function move(scale: Scale, amount: number) {
    Expanse.move(scale.domain, amount);
  }
}
