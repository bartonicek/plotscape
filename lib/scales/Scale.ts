import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { Expanse, ExpanseValueMap } from "./Expanse";
import { ExpanseType } from "./ExpanseType";

export interface Scale<
  T extends ExpanseType = any,
  U extends ExpanseType = any
> {
  other?: Scale;
  dispatch: EventTarget;
  domain: Expanse<T>;
  codomain: Expanse<U>;
}

type EventType = `changed`;

export namespace Scale {
  export function of<T extends ExpanseType, U extends ExpanseType>(
    domain: Expanse<T>,
    codomain: Expanse<U>
  ): Scale<T, U> {
    const dispatch = new EventTarget();
    const scale = { domain, dispatch, codomain };

    Expanse.listen(domain, `changed`, () => Scale.dispatch(scale, `changed`));
    Expanse.listen(codomain, `changed`, () => Scale.dispatch(scale, `changed`));

    return scale;
  }

  export const dispatch = makeDispatchFn<Scale, EventType>();
  export const listen = makeListenFn<Scale, EventType>();

  export function pushforward<T extends ExpanseType, U extends ExpanseType>(
    scale: Scale<T, U>,
    value: ExpanseValueMap[T]
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(codomain, Expanse.normalize(domain, value));
  }

  export function pullback<T extends ExpanseType, U extends ExpanseType>(
    scale: Scale<T, U>,
    value: ExpanseValueMap[U]
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(domain, Expanse.normalize(codomain, value));
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
