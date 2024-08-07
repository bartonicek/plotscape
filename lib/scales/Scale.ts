import { formatLabels } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

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
    codomain: U,
  ): Scale<T, U> {
    const scale = Reactive.of({ domain, codomain });

    Expanse.listen(domain, `changed`, () => Scale.dispatch(scale, `changed`));
    Expanse.listen(codomain, `changed`, () => Scale.dispatch(scale, `changed`));

    return scale;
  }

  export const dispatch = Reactive.makeDispatchFn<Scale, EventType>();
  export const listen = Reactive.makeListenFn<Scale, EventType>();

  export function setDomain(scale: Scale, expanse: Expanse) {
    scale.domain = expanse;
    Expanse.listen(expanse, `changed`, () => Scale.dispatch(scale, `changed`));
  }

  export function setCoomain(scale: Scale, expanse: Expanse) {
    scale.codomain = expanse;
    Expanse.listen(expanse, `changed`, () => Scale.dispatch(scale, `changed`));
  }

  export function pushforward<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: T[`value`],
  ): U[`value`] {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(codomain, Expanse.normalize(domain, value));
  }

  export function pullback<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: U[`value`],
  ): T[`value`] {
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
    array: T[`value`][],
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

  export function breaks(scale: Scale): {
    labels: string[];
    positions: number[];
  } {
    const breaks = Expanse.breaks(scale.domain) as any;
    let labels = formatLabels(breaks);

    if (scale.domain.type === Expanse.Type.Compound) {
      labels = formatLabels(breaks, { decimals: 1 });
      const positions = breaks.map((x: number) =>
        Expanse.unnormalize(
          scale.codomain,
          ExpanseContinuous.normalize(scale.domain, x),
        ),
      );

      return { labels, positions };
    } else if (scale.codomain.type === Expanse.Type.Split) {
      const positions = Scale.pushforward(scale, breaks);
      return { labels, positions };
    }

    const positions = breaks.map((x: any) => Scale.pushforward(scale, x));

    return { labels, positions };
  }

  export function move(scale: Scale, amount: number) {
    Expanse.move(scale.domain, amount);
  }
}
