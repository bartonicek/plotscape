import { DisjointUnion, allEntries, diff } from "utils";
import { newDataframe } from "../dataframe/Dataframe";
import { PARENT, POSITIONS } from "../symbols";
import { Variables } from "../types";
import { newReference } from "../variables/Reference";
import { Factor } from "./Factor";
import { newFactorComputed } from "./FactorComputed";

export function factorProduct<T extends Variables, U extends Variables>(
  factor1: Factor<T>,
  factor2: Factor<U>
): Factor<DisjointUnion<T, U>> {
  const self = product(factor1, factor2);

  const update = () => {
    const newFactor = product(factor1, factor2);

    self.parent = newFactor.parent;
    self.cardinality = newFactor.cardinality;
    self.levels = newFactor.levels;

    const cols = self.data.cols() as any;
    const newCols = newFactor.data.cols() as any;

    for (const [k, v] of allEntries(newCols)) {
      cols[k].domain = v.domain;
      cols[k].array = v.array;
      cols[k].source = v.source;
      cols[k].indexfn = v.indexfn;
    }

    self.emit();
  };

  factor1.listen(update);
  factor2.listen(update);

  return self;
}

export function product<T extends Variables, U extends Variables>(
  factor1: Factor<T>,
  factor2: Factor<U>
): Factor<DisjointUnion<T, U>> {
  const k = Math.max(factor1.cardinality, factor2.cardinality) + 1;

  const dirtyLevels = [] as number[];
  const dirtyUniqueLevels = new Set<number>();

  const factor1Map = {} as Record<number, number>;
  const factor2Map = {} as Record<number, number>;
  const positionsMap = {} as Record<number, Set<number>>;

  for (let i = 0; i < factor1.levels.length; i++) {
    const level = k * factor1.levelAt(i) + factor2.levelAt(i);

    if (!(level in factor1Map)) {
      factor1Map[level] = factor1.levelAt(i);
      factor2Map[level] = factor2.levelAt(i);
      positionsMap[level] = new Set();
    }

    dirtyLevels.push(level);
    dirtyUniqueLevels.add(level);
    positionsMap[level].add(i);
  }

  const sortedUniqueLevels = Array.from(dirtyUniqueLevels).sort(diff);
  const levels = dirtyLevels;

  // Need to clean up levels by removing unused ones,
  // e.g. [0, 2, 3, 2, 5] -> [0, 1, 2, 1, 3]
  for (let i = 0; i < levels.length; i++) {
    levels[i] = sortedUniqueLevels.indexOf(levels[i]);
  }

  const factor1ParentLevels = Object.values(factor1Map);
  const factor2ParentLevels = Object.values(factor2Map);
  const columns = {} as Variables;

  for (const [k, v] of allEntries(factor1.data.cols())) {
    // @ts-ignore
    columns[k] = v.proxy(() => factor1ParentLevels);
    columns[k].setName(v.name());
  }

  for (let [k, v] of allEntries(factor2.data.cols())) {
    if (typeof k === `string`) while (k in columns) k += `$`;
    // @ts-ignore
    columns[k] = v.proxy(() => factor2ParentLevels);
    columns[k].setName(v.name());
  }

  columns[POSITIONS] = newReference(Object.values(positionsMap));
  columns[PARENT] = newReference(Object.values(factor1Map));

  const parentFactor = newFactorComputed(
    factor1.cardinality,
    factor1ParentLevels,
    newDataframe({})
  );

  const cardinality = dirtyUniqueLevels.size;
  const data = newDataframe(columns as DisjointUnion<T, U>);

  const result = newFactorComputed(cardinality, levels, data, parentFactor);
  return result;
}
