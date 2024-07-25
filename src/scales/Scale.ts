import { Expanse, ExpanseValue } from "./Expanse";
import { ExpanseTag } from "./ExpanseTag";

export interface Scale<T extends ExpanseTag, U extends ExpanseTag> {
  domain: Expanse<T>;
  codomain: Expanse<U>;
}

export module Scale {
  export function of<T extends ExpanseTag, U extends ExpanseTag>(
    domain: Expanse<T>,
    codomain: Expanse<U>
  ): Scale<T, U> {
    return { domain, codomain };
  }

  export function pushforward<T extends ExpanseTag, U extends ExpanseTag>(
    scale: Scale<T, U>,
    value: ExpanseValue[T]
  ) {
    console.log(Expanse.namespaces);
    const { domain, codomain } = scale;
    return Expanse.unnormalize(codomain, Expanse.normalize(domain, value));
  }

  export function pullback<T extends ExpanseTag, U extends ExpanseTag>(
    scale: Scale<T, U>,
    value: ExpanseValue[U]
  ) {
    const { domain, codomain } = scale;
    return Expanse.unnormalize(domain, Expanse.normalize(codomain, value));
  }
}
