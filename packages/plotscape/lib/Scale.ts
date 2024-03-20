import { Expanse } from "./Expanse";
import { ExpanseContinuous, newExpanseContinuous } from "./ExpanseContinuous";
import { Named, named } from "./mixins/Named";

type Aesthetic = `x` | `y`;

/* -------------------------------- Interface ------------------------------- */

export interface Scale<T = unknown> extends Named {
  other?: Scale;
  aes?: Aesthetic;
  domain: Expanse<T>;
  norm: ExpanseContinuous;
  codomain: ExpanseContinuous;
  clone(): Scale<T>;
  setAes(aesthetic: Aesthetic): this;
  setOther(other: Scale): this;
  pushforward(value: T): number;
  pullback(value: number): T;
  setDomain<V extends string | number>(domain: Expanse<V>): Scale<V>;
  breaks(): T[];
}

/* ------------------------------- Constructor ------------------------------ */

export function newScale<T = number>(
  domain?: Expanse<T>,
  norm?: ExpanseContinuous,
  codomain?: ExpanseContinuous
): Scale<T> {
  domain = domain ?? (newExpanseContinuous() as unknown as Expanse<T>);
  norm = norm ?? newExpanseContinuous();
  codomain = codomain ?? newExpanseContinuous();

  const props = { domain, norm, codomain };
  const methods = {
    setOther,
    setAes,
    setDomain,
    pushforward,
    pullback,
    clone,
    breaks,
  };
  return named({ ...props, ...methods });
}

/* --------------------------------- Methods -------------------------------- */

function clone<T>(this: Scale<T>) {
  return newScale(
    this.domain.clone(),
    this.norm.clone(),
    this.codomain.clone()
  );
}

function setAes<T>(this: Scale<T>, aes: Aesthetic) {
  this.aes = aes;
  return this;
}

function setOther<T>(this: Scale<T>, other: Scale) {
  this.other = other;
  return this;
}

function pushforward<T>(this: Scale<T>, value: T) {
  const { domain, norm, codomain } = this;
  return codomain.unnormalize(norm.unnormalize(domain.normalize(value)));
}

function pullback<T>(this: Scale<T>, value: number) {
  const { domain, norm, codomain } = this;
  return domain.unnormalize(norm.normalize(codomain.normalize(value)));
}

function setDomain<T>(this: Scale<T>, domain: Expanse<T>) {
  this.domain = domain;
  return this as Scale<T>;
}

function breaks<T>(this: Scale<T>) {
  return this.domain.breaks(this.norm);
}
