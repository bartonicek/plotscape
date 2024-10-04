import { formatAxisLabels, invertRange } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Expanse } from "./Expanse";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseContinuous } from "./ExpanseContinuous";

type Direction = 1 | -1;

/**
 * Translates values from domain to codomain and back.
 */
export interface Scale<T extends Expanse = Expanse, U extends Expanse = Expanse>
  extends Reactive {
  domain: T;
  codomain: U;

  props: Scale.Props;
  defaults: Scale.Props;
  frozen: (keyof Scale.Props)[];
  linked: Scale[];
}

export namespace Scale {
  export interface Props {
    zero: number;
    one: number;
    direction: Direction;
    scale: number;
    mult: number;
  }

  export function of<T extends Expanse, U extends Expanse>(
    domain: T,
    codomain: U,
  ): Scale<T, U> {
    const [zero, one, direction] = [0, 1, 1] as const;
    const [scale, mult] = [1, 1];
    const props = { zero, one, direction, scale, mult };
    const defaults = { ...props };
    const [linked, frozen] = [[], []] as [Scale[], (keyof Props)[]];

    const result = Reactive.of()({
      domain,
      codomain,
      props,
      defaults,
      frozen,
      linked,
    });

    Reactive.propagate(domain, result, `changed`);
    Reactive.propagate(codomain, result, `changed`);

    return result;
  }

  export function linear() {
    return Scale.of(ExpanseContinuous.of(), ExpanseContinuous.of());
  }

  export function pushforward<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: Expanse.Value<T>,
  ): Expanse.Value<U> {
    const { domain, codomain, props } = scale;
    let normalized = Expanse.normalize(domain, value);

    if (Array.isArray(normalized)) {
      normalized = normalized.map((x) => applyPropsForward(x, props));
    } else {
      normalized = applyPropsForward(normalized, props);
    }

    return Expanse.unnormalize(codomain, normalized);
  }

  export function pullback<T extends Expanse, U extends Expanse>(
    scale: Scale<T, U>,
    value: Expanse.Value<U>,
  ): Expanse.Value<T> {
    const { domain, codomain, props } = scale;
    let normalized = Expanse.normalize(codomain, value);

    if (Array.isArray(normalized)) {
      normalized = normalized.map((x) => applyPropsBackward(x, props));
    } else {
      normalized = applyPropsBackward(normalized, props);
    }

    return Expanse.unnormalize(domain, normalized);
  }

  function applyPropsForward(x: number, props: Props) {
    const { zero, one, direction, scale, mult } = props;
    x = x * scale * mult;
    x = zero + x * (one - zero);
    return applyDirection(x, direction);
  }

  // Does not use direction since [0, 1] already encodes direction
  function applyPropsBackward(x: number, props: Props) {
    const { zero, one, scale, mult } = props;
    x = (x - zero) / (one - zero);
    return x / (scale * mult);
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

  export function setDomain(scale: Scale, domain: Expanse) {
    Reactive.removeAll(scale.domain, `changed`);
    scale.domain = domain;
    Reactive.propagate(scale.domain, scale, `changed`);
  }

  export function setCodomain(scale: Scale, codomain: Expanse) {
    Reactive.removeAll(scale.codomain, `changed`);
    scale.codomain = codomain;
    Reactive.propagate(scale.codomain, scale, `changed`);
  }

  export function freeze(scale: Scale, props: (keyof Props)[]) {
    for (const p of props) if (!scale.frozen.includes(p)) scale.frozen.push(p);
  }

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

    // Reflect back
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
    if (setName && Meta.has(array, `name`)) Meta.copy(array, scale, [`name`]);

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
    const { domain, codomain, props } = scale;
    let { zero, one } = props;
    [zero, one] = invertRange(zero, one);

    let breaks = Expanse.breaks(domain, zero, one) as any;
    let labels = formatAxisLabels(breaks);
    let positions: number[];

    if (Expanse.isCompound(domain)) {
      labels = formatAxisLabels(breaks, { decimals: 1 });
      if (domain.commonScale) breaks = Expanse.normalize(domain, breaks);
      breaks = breaks.map((x: number) => applyPropsForward(x, props));
      positions = Expanse.unnormalize(scale.codomain, breaks);
    } else if (Expanse.isSplit(codomain)) {
      positions = Scale.pushforward(scale, breaks);
    } else {
      positions = breaks.map((x: any) => Scale.pushforward(scale, x));
    }

    return { labels, positions };
  }

  export function link(source: Scale, targets: Scale[]) {
    for (const target of targets) {
      if (!source.linked.includes(target)) source.linked.push(target);
    }
  }

  export function shareCodomain(source: Scale, targets: Scale[]) {
    for (const target of targets) {
      target.codomain = source.codomain;
    }
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
