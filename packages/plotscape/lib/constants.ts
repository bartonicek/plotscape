import { newDataframe } from "./main";
import { POSITIONS } from "./symbols";
import { newDerived } from "./variables/Derived";

export const zero = newDerived(() => 0);
export const one = newDerived(() => 1);
export const row = newDerived((i) => i);
export const position = newDerived((i) => new Set([i]));

export const oneRowOneCase = newDataframe({ [POSITIONS]: position });
