import { seq } from "utils";
import { Dataframe, newDataframe } from "../dataframe/Dataframe";
import { Factor } from "../factors/Factor";
import { newFactorComputed } from "../factors/FactorComputed";
import { Observable, observable } from "../mixins/Observable";
import { ContextId } from "../plot/Plot";
import { LAYER, POSITIONS } from "../symbols";
import { Reference, newReference } from "../variables/Reference";
import { Group, GroupOrder, Transient } from "./GroupOrder";

export type MarkerCols = {
  [LAYER]: Reference<ContextId>;
  [POSITIONS]: Reference<Set<number>>;
};

const transientGroups = [0, 1, 2, 3];

function addTransient(group: Group) {
  return (group & ~4) as Group;
}

function stripTransient(group: Group) {
  return (group | 4) as Group;
}

/* -------------------------------- Interface ------------------------------- */

export interface Marker extends Observable {
  n: number;
  factor: Factor<MarkerCols>;
  group: Group;
  groupOrder: GroupOrder;
  indices: Group[];

  positions: Set<number>[];
  transientPositions: Set<number>;

  setGroup(group: Group): this;
  cycleGroups(): this;
  update(selected: Set<number>, force?: boolean): this;
  clearAll(): this;
  clearTransient(): this;
  data(): Dataframe<MarkerCols>;
}

/* ------------------------------- Constructor ------------------------------ */

export function newMarker(n: number, groupOrder: GroupOrder): Marker {
  const group = Transient;
  const indices = Array<Group>(n).fill(Group.Group1);

  const positions = Array.from(Array(8), () => new Set<number>());
  positions[7] = new Set(seq(0, n - 1));
  const layerVar = newReference<ContextId>(groupOrder.layers);
  const positionsVar = newReference(positions);

  const _data = newDataframe({ [LAYER]: layerVar, [POSITIONS]: positionsVar });
  const factor = newFactorComputed(8, indices, _data);
  const transientPositions = new Set<number>();

  const props = {
    n,
    group,
    groupOrder,
    indices,
    positions,
    transientPositions,
    factor,
  };

  const methods = {
    setGroup,
    cycleGroups,
    update,
    clearAll,
    clearTransient,
    data,
  };

  const self = observable({ ...props, ...methods });

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function setGroup(this: Marker, group: Group) {
  this.group = group;
  return this;
}

function cycleGroups(this: Marker) {
  const { indices, groupOrder: groupOrderer } = this;
  const { Group2, Group3, Group4 } = groupOrderer.groups;

  for (let i = 0; i < indices.length; i++) {
    switch (indices[i]) {
      case Group2:
        indices[i] = Group4;
        break;
      case Group3:
        indices[i] = Group2;
        break;
      case Group4:
        indices[i] = Group3;
    }
  }

  this.update(new Set(), true);
  return this;
}

function update(this: Marker, selected: Set<number>, force?: boolean) {
  const { group, indices, positions, transientPositions } = this;

  this.clearTransient();
  if (!selected.size && !force) return this;

  for (const p of positions) {
    for (const i of selected) p.delete(i);
  }

  if (group === Transient) {
    for (const i of selected) {
      const index = addTransient(indices[i]);
      indices[i] = index;
      positions[index].add(i);
      transientPositions.add(i);
    }
  } else {
    for (const i of selected) {
      const index = group;
      indices[i] = index;
      positions[index].add(i);
    }
  }

  this.factor.emit();
  this.emit();
  return this;
}

function clearAll(this: Marker) {
  const { indices, positions } = this;

  for (const p of positions) p.clear();
  for (let i = 0; i < this.n; i++) positions[Group.Group1].add(i);
  indices.fill(Group.Group1);

  this.factor.emit();
  return this;
}

function clearTransient(this: Marker) {
  const { indices, positions, transientPositions } = this;

  for (const i of transientGroups) positions[i].clear();
  for (const i of transientPositions) {
    const index = stripTransient(indices[i]);
    indices[i] = index;
    positions[index].add(i);
  }

  transientPositions.clear();
  this.factor.emit();
  return this;
}

function data(this: Marker) {
  const { n, factor, indices } = this;
  const data = factor.data.proxy(indices);
  const positions = Array.from(Array(n), (_, i) => new Set([i]));
  data.columns[POSITIONS] = newReference(positions);
  this.factor.listen(() => data.emit());

  return data;
}
