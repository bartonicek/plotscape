import { allEntries, asInt, diff, inc, last, subsetOnIndices } from "utils";
import { newDataframe } from "../dataframe/Dataframe";
import { bimap, midpoint } from "../funs";
import {
  ObservableValue,
  getter,
  isObservable,
} from "../mixins/ObservableValue";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { CHILDPOSITIONS, POSITIONS } from "../symbols";
import { Continuous, newContinuous } from "../variables/Continuous";
import { Reference, newReference } from "../variables/Reference";
import { Factor } from "./Factor";
import { newFactorComputed } from "./FactorComputed";

export function factorBin(
  variable: Continuous,
  width?: number | ObservableValue<number>,
  anchor?: number | ObservableValue<number>
): Factor<{
  binStart: Continuous;
  binMid: Continuous;
  binEnd: Continuous;
  [POSITIONS]: Reference<Set<number>>;
  [CHILDPOSITIONS]: Reference<Set<number>>;
}> {
  const _width = getter(width);
  const _anchor = getter(anchor);

  const self = bin(variable, _width(), _anchor());

  const update = () => {
    const newFactor = bin(variable, _width(), _anchor());
    self.parent = newFactor.parent;
    self.cardinality = newFactor.cardinality;
    self.levels = newFactor.levels;

    for (const [k, v] of allEntries(newFactor.data.columns)) {
      self.data.columns[k].domain = v.domain;
      // @ts-ignore
      self.data.columns[k].array = v.array;
      self.data.columns[k].source = v.source;
      self.data.columns[k].indexfn = v.indexfn;
    }

    self.emit();
  };

  if (isObservable(width)) width.listen(update);
  if (isObservable(anchor)) anchor.listen(update);

  return self;
}

function bin(variable: Continuous, width?: number, anchor?: number) {
  const array = variable.array;
  const { min, max } = variable.domain;
  const range = variable.domain.range();

  const nBins = width ? Math.ceil(range / width) + 1 : 10;
  width = width ?? range / (nBins - 1);
  anchor = anchor ?? min;

  const breakMin = min - width + ((anchor - min) % width);
  const breakMax = max + width - ((max - anchor) % width);

  const breaks = Array(nBins + 2);
  breaks[0] = breakMin;
  breaks[breaks.length - 1] = breakMax;

  for (let i = 1; i < breaks.length - 1; i++) {
    breaks[i] = breakMin + i * width;
  }

  const dirtyUniqueLevels = new Set<number>();
  const dirtyLevels = [] as number[];
  const positions = {} as Record<number, Set<number>>;

  for (let i = 0; i < array.length; i++) {
    const level = breaks.findIndex((br) => br >= array[i]) - 1;
    if (!positions[level]) positions[level] = new Set();
    positions[level].add(i);
    dirtyUniqueLevels.add(level);
    dirtyLevels.push(level);
  }

  // Need to clean up levels by removing unused ones,
  // e.g. [0, 2, 3, 2, 5] -> [0, 1, 2, 1, 3]
  const sorted = Array.from(dirtyUniqueLevels).sort(diff);
  const indexMap = {} as Record<number, number>;

  for (const [k, v] of Object.entries(sorted)) indexMap[v] = asInt(k);

  const levels = dirtyLevels;
  for (let i = 0; i < levels.length; i++) levels[i] = indexMap[levels[i]];

  const [cleanBreakMin, cleanBreakMax] = [
    breaks[sorted[0]],
    breaks[last(sorted) + 1],
  ];

  const domain = newExpanseContinuous(cleanBreakMin, cleanBreakMax);
  const breaksVariable = newContinuous(breaks, domain);
  breaksVariable.setName(variable.name());

  const starts = subsetOnIndices(breaks, sorted);
  const ends = subsetOnIndices(breaks, sorted.map(inc));
  const mids = bimap(starts, ends, midpoint);

  const binStart = newContinuous(starts, domain);
  const binEnd = newContinuous(ends, domain);
  const binMid = newContinuous(mids, domain);

  if (variable.hasName()) {
    binStart.setName(`lower ${variable.name()}`);
    binEnd.setName(`upper ${variable.name()}`);
    binMid.setName(variable.name());
  }

  const columns = {
    binStart,
    binMid,
    binEnd,
    [POSITIONS]: newReference(Object.values(positions)),
    [CHILDPOSITIONS]: newReference([]),
  };

  const data = newDataframe(columns);
  return newFactorComputed(sorted.length, levels, data);
}
