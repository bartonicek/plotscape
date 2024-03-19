import { seq } from "utils";
import { ContextId } from "./Plot";
import { Dataframe, newDataframe } from "./dataframe/Dataframe";
import { Emitter, subscribable } from "./mixins/Emitter";
import { LAYER, POSITIONS } from "./symbols";
import { Group } from "./types";
import { Reference, newReference } from "./variables/Reference";

export type MarkerCols = {
  [LAYER]: Reference<ContextId>;
  [POSITIONS]: Reference<Set<number>>;
};

function addTransient(group: number) {
  return group & ~4;
}

function stripTransient(group: number) {
  return group | 4;
}

export interface Marker extends Emitter<`changed`> {
  data: Dataframe<MarkerCols>;
  group: Group;
  groupIndices: Group[];

  positions: Set<number>[];
  transientPositions: Set<number>;
}

export function newMarker(n: number): Marker {
  const group = Group.Transient;
  const groupIndices = Array<Group>(n).fill(Group.Group1);

  const positions = Array.from(Array(8), () => new Set<number>());
  const layerVariable = newReference<ContextId>(seq(0, 7) as ContextId[]);
  const positionsVariable = newReference(positions);

  const data = newDataframe({
    [LAYER]: layerVariable,
    [POSITIONS]: positionsVariable,
  });

  const transientPositions = new Set<number>();

  const props = { group, groupIndices, positions, transientPositions, data };
  const self = subscribable({ ...props });

  return self;
}
