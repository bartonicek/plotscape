import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";

export interface Scale<T, U> {
  domain: Expanse<T>;
  norm: ExpanseContinuous;
  codomain: Expanse<U>;
  pushforward(value: T): U;
  pullback(value: U): T;
  setDomain<V>(domain: Expanse<V>): Scale<V, U>;
  setCodomain<V>(codomain: Expanse<V>): Scale<T, V>;
}

export function newScale<T, U>(
  domain: Expanse<T>,
  norm: ExpanseContinuous,
  codomain: Expanse<U>
): Scale<T, U> {
  return {
    domain,
    norm,
    codomain,
    setDomain,
    setCodomain,
    pushforward,
    pullback,
  };
}

function pushforward<T, U>(this: Scale<T, U>, value: T) {
  const { domain, norm, codomain } = this;
  return codomain.unnormalize(norm.unnormalize(domain.normalize(value)));
}

function pullback<T, U>(this: Scale<T, U>, value: U) {
  const { domain, norm, codomain } = this;
  return domain.unnormalize(norm.normalize(codomain.normalize(value)));
}

function setDomain<T, U>(this: Scale<any, U>, domain: Expanse<T>) {
  this.domain = domain;
  return this as Scale<T, U>;
}

function setCodomain<T, U>(this: Scale<T, any>, codomain: Expanse<U>) {
  this.codomain = codomain;
  return this as Scale<T, U>;
}
