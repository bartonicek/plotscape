import { Flat } from "../utils/types";
import { Expanse } from "./Expanse";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseCompound } from "./ExpanseCompound";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpansePoint } from "./ExpansePoint";
import { ExpanseSplit } from "./ExpanseSplit";
import { Scale } from "./Scale";

const expanseMap = {
  continuous: ExpanseContinuous,
  point: ExpansePoint,
  band: ExpanseBand,
  split: ExpanseSplit,
  compound: ExpanseCompound,
};

// The above is namespaces, below is interfaces - need to declare both
type ExpanseMap = {
  continuous: ExpanseContinuous;
  point: ExpansePoint;
  band: ExpanseBand;
  split: ExpanseSplit;
  compound: ExpanseCompound;
};

type InferScale<T extends [Expanse.Type, Expanse.Type]> = T extends any[]
  ? Scale<ExpanseMap[T[0]], ExpanseMap[T[1]]>
  : Scale<ExpanseContinuous, ExpanseContinuous>;

const scaleNames = [
  `x`,
  `y`,
  `size`,
  `area`,
  `areaPct`,
  `width`,
  `height`,
] as const;

type ScaleName = (typeof scaleNames)[number];
type ScaleOptions = Partial<Record<ScaleName, [Expanse.Type, Expanse.Type]>>;

export type Scales = { [key in ScaleName]: Scale };
export type InferScales<T extends ScaleOptions = {}> = Flat<{
  [key in keyof T | ScaleName]: T[key] extends [Expanse.Type, Expanse.Type]
    ? InferScale<T[key]>
    : Scale<ExpanseContinuous, ExpanseContinuous>;
}>;

export namespace Scales {
  export function of<T extends ScaleOptions>(options?: T): InferScales<T> {
    const result = {} as Record<string, Scale>;
    for (const name of scaleNames) result[name] = Scale.linear();

    for (const [k, [domain, codomain]] of Object.entries(options ?? {})) {
      // @ts-ignore
      result[k] = Scale.of(expanseMap[domain].of(), expanseMap[codomain].of());
    }

    return result as InferScales<T>;
  }

  export function set<T extends Scales, K extends ScaleName, U extends Scale>(
    scales: T,
    key: K,
    scale: U,
  ) {
    return { ...scales, [key]: scale };
  }
}
