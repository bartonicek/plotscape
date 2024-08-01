import { UntypedColumns } from "./types";

export type MtcarsUntyped = UntypedColumns<
  [`am`, `carb`, `cyl`, `disp`, `drat`, `gear`, `hp`, `mpg`, `qsec`, `vs`, `wt`]
>;

export type Mtcars = {
  am: number[];
  carb: number[];
  cyl: number[];
  disp: number[];
  drat: number[];
  gear: number[];
  hp: number[];
  mpg: number[];
  qsec: number[];
  vs: number[];
  wt: number[];
};
