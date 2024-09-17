import { isNumberArray } from "../utils/funs";
import { Expanse } from "./Expanse";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpansePoint } from "./ExpansePoint";

// Has to be in a separate file because of circular imports
export function inferExpanse(values: any[], options = { train: true }) {
  const isNumeric = isNumberArray(values);
  const expanse = isNumeric ? ExpanseContinuous.of() : ExpansePoint.of();
  if (options.train) Expanse.train(expanse, values);
  return expanse;
}
