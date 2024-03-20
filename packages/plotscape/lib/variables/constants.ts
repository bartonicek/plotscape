import { newDerived } from "./Derived";

export const zero = newDerived(() => 0);
export const one = newDerived(() => 1);
export const row = newDerived((i) => i);
