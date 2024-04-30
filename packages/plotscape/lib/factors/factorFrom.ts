import { newDataframe } from "../dataframe/Dataframe";
import { newExpanseDiscreteWeighted } from "../scales/ExpanseDiscreteWeighted";
import { CHILDPOSITIONS, POSITIONS } from "../symbols";
import { Discrete, newDiscrete } from "../variables/Discrete";
import { Reference, newReference } from "../variables/Reference";
import { Factor } from "./Factor";
import { newFactorComputed } from "./FactorComputed";

export function factorFrom(
  variable: Discrete,
  labels?: string[]
): Factor<{
  label: Discrete;
  [POSITIONS]: Reference<Set<number>>;
  [CHILDPOSITIONS]: Reference<Set<number>>;
}> {
  const array = variable.values();
  labels = labels ?? variable.domain.values;

  const levels = [] as number[];
  const positions = {} as Record<number, Set<number>>;

  for (let i = 0; i < array.length; i++) {
    const level = labels.indexOf(array[i].toString());
    if (!positions[level]) positions[level] = new Set();
    positions[level].add(i);
    levels.push(level);
  }

  const domain = newExpanseDiscreteWeighted(labels);
  const columns = {
    label: newDiscrete(labels, domain),
    [POSITIONS]: newReference(Object.values(positions)),
    [CHILDPOSITIONS]: newReference([]),
  };

  columns.label.setName(variable.name());
  const data = newDataframe(columns);

  const factor = newFactorComputed(labels!.length, levels, data);

  return factor;
}
