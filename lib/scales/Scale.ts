import { formatAxisLabels } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface Scale<T extends Expanse = Expanse, U extends Expanse = Expanse>
  extends Reactive {
  domain: T;
  codomain: U;
}

export namespace Scale {
  export function of<T extends Expanse, U extends Expanse>(
    domain: T,
    codomain: U,
  ): Scale<T, U> {
    const scale = Reactive.of()({ domain, codomain });
    Reactive.propagate(domain, scale, `changed`);
    Reactive.propagate(codomain, scale, `changed`);

    return scale;
  }

  export function setDomain(scale: Scale, expanse: Expanse) {
    scale.domain = expanse;
    Reactive.propagate(scale.domain, scale, `changed`);
  }

  export function setCoomain(scale: Scale, expanse: Expanse) {
    scale.codomain = expanse;
    Reactive.propagate(scale.codomain, scale, `changed`);
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
    if (setName && Meta.has(array, `name`)) Meta.copy(scale, array, [`name`]);

    // Automatically coerce expanse to band if array is string[]
    if (typeof array[0] === "string" && Expanse.isContinuous(scale.domain)) {
      const labels = Array.from(new Set(array) as Set<string>);
      scale.domain = Expanse.band(labels) as unknown as T;
    }

    Expanse.train(scale.domain, array, options);
  }

  export function restoreDefaults(scale: Scale) {
    Expanse.reset(scale.domain);
    Expanse.reset(scale.codomain);
  }

  export function breaks(scale: Scale): {
    labels: string[];
    positions: number[];
  } {
    const breaks = Expanse.breaks(scale.domain) as any;
    let labels = formatAxisLabels(breaks);

    if (Expanse.isCompound(scale.domain)) {
      labels = formatAxisLabels(breaks, { decimals: 1 });

      const positions = breaks.map((x: number) =>
        Expanse.unnormalize(
          scale.codomain,
          ExpanseContinuous.normalize(scale.domain as any, x),
        ),
      );

      return { labels, positions };
    } else if (Expanse.isSplit(scale.codomain)) {
      const positions = Scale.pushforward(scale, breaks);
      return { labels, positions };
    }

    const positions = breaks.map((x: any) => Scale.pushforward(scale, x));

    return { labels, positions };
  }

  export function move(scale: Scale, amount: number) {
    Expanse.move(scale.domain, amount);
  }

  export function shareCodomain(scale1: Scale, scale2: Scale) {
    scale2.codomain = scale1.codomain;
  }

  export function domainRange(scale: Scale) {
    return Expanse.range(scale.domain) / Expanse.unitRange(scale.domain);
  }

  export function codomainRange(scale: Scale) {
    return Expanse.range(scale.codomain) * Expanse.unitRange(scale.codomain);
  }

  export function unitRatio(scale: Scale) {
    const { domain, codomain } = scale;

    if ([domain, codomain].map(Expanse.isContinuous).includes(false)) {
      throw new Error(`Both domain and codomain need to be continuous`);
    }

    const domainRange = Expanse.range(domain);
    const codomainRange = Expanse.range(codomain) * Expanse.unitRange(codomain);

    return codomainRange / domainRange;
  }
}
