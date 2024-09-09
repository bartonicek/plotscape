import { Expanse } from "./Expanse";

export interface ExpanseIdentity extends Expanse {}

export namespace ExpanseIdentity {
  export function of() {
    return { type: `identity` };
  }

  export function normalize(x: any) {
    return x;
  }

  export function unnormalize(x: any) {
    return x;
  }
}
