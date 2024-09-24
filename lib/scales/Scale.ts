import { formatAxisLabels, invertRange } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Expanse } from "./Expanse";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseContinuous } from "./ExpanseContinuous";

type Direction = 1 | -1;

export interface Scale<T extends Expanse = Expanse, U extends Expanse = Expanse>
  extends Reactive {
  domain: T;
  codomain: U;
  linked: Scale[];

  props: Scale.Props;
  defaults: Scale.Props;
  frozen: string[];
}

export namespace Scale {
  export interface Props {
    zero: number;
    one: number;
    direction: Direction;
  }

  export function of<T extends Expanse, U extends Expanse>(
    domain: T,
    codomain: U,
  ): Scale<T, U> {
    const props = { zero: 0, one: 1, direction: 1 as Direction };
    const defaults = { ...props };
    const [linked, frozen] = [[], []] as [Scale[], string[]];

    const scale = Reactive.of()({
      domain,
      codomain,
      props,
      defaults,
      frozen,
      linked,
    });

    Reactive.propagate(domain, scale, `changed`);
    Reactive.propagate(codomain, scale, `changed`);

    return scale;
  }

  // 'default' is a keyword, unfortunately
  export function standard() {
    return Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());
  }

  export function pushforward<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: T[`value`],
  ): U[`value`] {
    const { domain, codomain, props } = scale;
    const { zero, one, direction } = props;

    let normalized = Expanse.normalize(domain, value);
    if (!Array.isArray(normalized)) {
      normalized = zero + normalized * (one - zero);
      normalized = applyDirection(normalized, direction);
    } else {
      normalized = normalized.map((x) =>
        applyDirection(zero + x * (one - zero), direction),
      );
    }

    return Expanse.unnormalize(codomain, normalized);
  }

  // Pullback does not use direction since [0, 1] already encodes direction
  export function pullback<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: U[`value`],
  ): T[`value`] {
    const { domain, codomain, props } = scale;
    const { zero, one } = props;

    let normalized = Expanse.normalize(codomain, value);
    if (!Array.isArray(normalized)) {
      normalized = (normalized - zero) / (one - zero);
    } else {
      normalized = normalized.map((x) => (x - zero) / (one - zero));
    }

    return Expanse.unnormalize(domain, normalized);
  }

  function applyDirection(x: number, direction: 1 | -1) {
    return 0.5 * (1 - direction) + direction * x;
  }

  export function set(
    scale: Scale,
    setfn: (scale: Props) => Partial<Props>,
    options?: { default?: boolean; silent?: boolean; unfreeze?: boolean },
  ) {
    const { linked, frozen, props } = scale;
    const modified = setfn({ ...props });

    if (!options?.unfreeze) {
      // Frozen properties don't get modified
      for (const k of frozen as (keyof Props)[]) delete modified[k];
    }

    Object.assign(props, modified);
    if (!!options?.default) Object.assign(scale.defaults, modified);
    if (!options?.silent) Reactive.dispatch(scale, `changed`);

    for (const s of linked) Scale.set(s, setfn, options);
  }

  export function freeze(scale: Scale, props: (keyof Props)[]) {
    for (const p of props) if (!scale.frozen.includes(p)) scale.frozen.push(p);
  }

  // export function setDomain<T extends Expanse, U extends Scale<T, Expanse>>(
  //   scale: U,
  //   setfn: (props: U[`[props]`]) => U[`props`],
  //   options?: { default?: boolean; silent?: boolean; unfreeze?: boolean },
  // ) {
  //   Expanse.set(scale.domain, setfn, options);
  // }

  // export function setCodomain<T extends Expanse, U extends Scale<T, Expanse>>(
  //   scale: U,
  //   setfn: (props: U[`[props]`]) => U[`props`],
  //   options?: { default?: boolean; silent?: boolean; unfreeze?: boolean },
  // ) {
  //   Expanse.set(scale.codomain, setfn, options);
  // }

  export function flip(scale: Scale) {
    Scale.set(scale, (s) => ({ direction: (-1 * s.direction) as Direction }));
  }

  export function move(scale: Scale, amount: number) {
    let { direction, zero, one } = scale.props;
    zero += direction * amount;
    one += direction * amount;
    Scale.set(scale, () => ({ zero, one }));
  }

  export function expand(
    scale: Scale,
    zero: number,
    one: number,
    options?: { default?: boolean; silent?: boolean },
  ) {
    const { zero: currZero, one: currOne, direction } = scale.props;
    const currRange = currOne - currZero;

    // Reflect if direction is backwards
    if (direction === -1) [zero, one] = [1 - zero, 1 - one];

    // Normalize the zoom values within the current range
    [zero, one] = [zero, one].map((x) => (x - currZero) / currRange);
    [zero, one] = invertRange(zero, one);

    // Finally, reflect again
    if (direction === -1) [zero, one] = [1 - zero, 1 - one];

    Scale.set(scale, () => ({ zero, one }), options);
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
      scale.domain = ExpanseBand.of(labels) as unknown as T;
    }

    Expanse.train(scale.domain, array, options);
  }

  export function reset(scale: Scale, options?: { silent?: boolean }) {
    Object.assign(scale.props, scale.defaults);
    if (!options?.silent) Reactive.dispatch(scale, `changed`);
  }

  export function restore(scale: Scale) {
    Expanse.reset(scale.domain, { silent: true });
    Expanse.reset(scale.codomain, { silent: true });
    Scale.reset(scale);
  }

  export function breaks(scale: Scale): {
    labels: string[];
    positions: number[];
  } {
    const { domain, props } = scale;
    let { zero, one } = props;
    [zero, one] = invertRange(zero, one);

    const breaks = Expanse.breaks(domain, zero, one) as any;
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

  export function link(scale1: Scale, scale2: Scale) {
    if (!scale1.linked.includes(scale2)) scale1.linked.push(scale2);
  }

  export function shareCodomain(scale1: Scale, scale2: Scale) {
    scale2.codomain = scale1.codomain;
  }

  export function unitRange(scale: Scale) {
    return scale.props.one - scale.props.zero;
  }

  export function domainRange(scale: Scale) {
    const { domain } = scale;
    if (!Expanse.isContinuous(domain)) return;
    return ExpanseContinuous.range(domain) / unitRange(scale);
  }

  export function codomainRange(scale: Scale) {
    const { codomain } = scale;
    if (!Expanse.isContinuous(codomain)) return;
    return ExpanseContinuous.range(codomain) * unitRange(scale);
  }

  export function unitRatio(scale: Scale) {
    if (!isContinuous(scale)) {
      throw new Error(`Both domain and codomain need to be continuous`);
    }

    const { domain, codomain } = scale;
    const dr = ExpanseContinuous.range(domain);
    const cdr = ExpanseContinuous.range(codomain) * unitRange(scale);

    return cdr / dr;
  }

  export function isContinuous(
    scale: Scale,
  ): scale is Scale<ExpanseContinuous, ExpanseContinuous> {
    const { domain, codomain } = scale;
    return Expanse.isContinuous(domain) && Expanse.isContinuous(codomain);
  }
}
