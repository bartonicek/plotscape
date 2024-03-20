import { Variables } from "../types";
import { Variable } from "../variables/Variable";
import { Representation } from "./Representation2";

type Encodings = {
  x: Variable<number>;
  y0: Variable<number>;
  y1: Variable<number>;
};

export interface Bars extends Representation<Variables> {}
