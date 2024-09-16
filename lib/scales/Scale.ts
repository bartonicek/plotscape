import { formatAxisLabels } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Expanse } from "./Expanse";
import { ExpanseBand } from "./ExpanseBand";
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
      name?: boolean;
      ratio?: boolean;
    },
  ) {
    const { domain } = scale;
    const setName = options?.name ?? true;
    if (setName && Meta.has(array, `name`)) Meta.copy(scale, array, [`name`]);

    // Automatically coerce expanse to band if array is string[]
    if (typeof array[0] === "string" && Expanse.isContinuous(domain)) {
      const labels = Array.from(new Set(array) as Set<string>);
      scale.domain = ExpanseBand.of(labels) as unknown as T;
    }

    Expanse.train(scale.domain, array, options);

    if (options?.ratio && Expanse.isContinuous(domain)) {
      Expanse.set(domain, (e) => (e.min = 0));
    }
  }

  export function restoreDefaults(scale: Scale) {
    Expanse.reset(scale.domain);
    Expanse.reset(scale.codomain);
  }

  export function breaks(scale: Scale): {
    labels: string[];
    positions: number[];
  } {
    const breaks = Expanse.breaks(scale.domain);
    let labels = formatAxisLabels(breaks);

    if (Expanse.isCompound(scale.domain)) {
      labels = formatAxisLabels(breaks, { decimals: 1 });

      const positions = breaks.map((x: number) =>
        Expanse.unnormalize(scale.codomain, Expanse.normalize(scale.domain, x)),
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
    if (!Expanse.isContinuous(scale.domain)) return;
    return (
      ExpanseContinuous.range(scale.domain) / Expanse.unitRange(scale.domain)
    );
  }

  export function codomainRange(scale: Scale) {
    if (!Expanse.isContinuous(scale.codomain)) return;
    return (
      ExpanseContinuous.range(scale.codomain) *
      Expanse.unitRange(scale.codomain)
    );
  }

  export function unitRatio(scale: Scale) {
    const { domain, codomain } = scale;

    if (!Expanse.isContinuous(domain) || !Expanse.isContinuous(codomain)) {
      return;
    }

    if ([domain, codomain].map(Expanse.isContinuous).includes(false)) {
      throw new Error(`Both domain and codomain need to be continuous`);
    }

    const domainRange = ExpanseContinuous.range(domain);
    const codomainRange =
      ExpanseContinuous.range(codomain) * Expanse.unitRange(codomain);

    return codomainRange / domainRange;
  }

  export function isContinuous(
    scale: Scale,
  ): scale is Scale<ExpanseContinuous, ExpanseContinuous> {
    return (
      Expanse.isContinuous(scale.domain) && Expanse.isContinuous(scale.codomain)
    );
  }
}
