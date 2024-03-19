import { Expanse } from "./Expanse";
import { ExpanseContinuous, newExpanseContinuous } from "./ExpanseContinuous";
import { Named, named } from "./mixins/Named";

type Scaleable = number | string;

export interface Scale<T extends Scaleable = Scaleable> extends Named {
  domain: Expanse<T>;
  norm: ExpanseContinuous;
  codomain: ExpanseContinuous;
  pushforward(value: T): number;
  pullback(value: number): T;
  setDomain<V extends Scaleable>(domain: Expanse<V>): Scale<V>;
}

export function newScale<T extends Scaleable = number>(
  domain?: Expanse<T>,
  norm?: ExpanseContinuous,
  codomain?: ExpanseContinuous
): Scale<T> {
  domain = domain ?? (newExpanseContinuous() as unknown as Expanse<T>);
  norm = norm ?? newExpanseContinuous();
  codomain = codomain ?? newExpanseContinuous();

  return {
    ...named({
      domain: domain!,
      norm,
      codomain: codomain!,
    }),
    setDomain,
    pushforward,
    pullback,
  };
}

function pushforward<T extends Scaleable>(this: Scale<T>, value: T) {
  const { domain, norm, codomain } = this;
  return codomain.unnormalize(norm.unnormalize(domain.normalize(value)));
}

function pullback<T extends Scaleable>(this: Scale<T>, value: number) {
  const { domain, norm, codomain } = this;
  return domain.unnormalize(norm.normalize(codomain.normalize(value)));
}

function setDomain<T extends Scaleable>(this: Scale<T>, domain: Expanse<T>) {
  this.domain = domain;
  return this as Scale<T>;
}

// function setCodomain<T extends Scaleable, U extends Scaleable>(
//   this: Scale<T>,
//   codomain: Expanse<U>
// ) {
//   this.codomain = codomain;
//   return this as Scale<T, U>;
// }
