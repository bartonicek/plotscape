import { Getter } from "../Getter";
import { Factor } from "../main";
import { Reactive } from "../Reactive";
import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { LAYER } from "../utils/symbols";

export const Transient = 255 as const;
export type Transient = typeof Transient;

export enum Group {
  Base = 0,
  First = 1,
  Second = 2,
  Third = 3,
  BaseTransient = 4,
  FirstTransient = 5,
  SecondTransient = 6,
  ThirdTransient = 7,
}

type GroupType = Group | Transient;

export interface Marker extends Reactive {
  group: GroupType;
  indices: number[];
  transientIndices: number[];
  factor: Factor<{ [LAYER]: number[] }>;
}

type EventType = `changed`;

export namespace Marker {
  export function of(n: number): Marker {
    const group = Transient;
    const indices = Array<number>(n).fill(Group.Base);
    const transientIndices: number[] = [];
    const factor = Factor.of(8, indices, { [LAYER]: [7, 6, 5, 4, 3, 2, 1] });

    const marker = Reactive.of({ group, indices, transientIndices, factor });
    Marker.listen(marker, `changed`, () => Factor.dispatch(factor, `changed`));

    return marker;
  }

  export const listen = makeListenFn<Marker, EventType>();
  export const dispatch = makeDispatchFn<Marker, EventType>();

  export function setGroup(marker: Marker, group: GroupType) {
    marker.group = group;
  }

  export function update(
    marker: Marker,
    indices: number[],
    options?: { group?: GroupType; silent?: boolean }
  ) {
    const group = options?.group ?? marker.group;
    clearTransient(marker, { silent: true });

    if (group === Transient) {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];
        marker.indices[index] = addTransient(marker.indices[index]);
      }
      marker.transientIndices = indices;
    } else {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i];
        marker.indices[index] = group;
      }
    }

    if (!options?.silent) Marker.dispatch(marker, `changed`);
  }

  export function clearAll(marker: Marker, options?: { silent?: boolean }) {
    for (let i = 0; i < marker.indices.length; i++) {
      marker.indices[i] = Group.Base;
    }

    if (!options?.silent) Marker.dispatch(marker, `changed`);
  }

  export function clearTransient(
    marker: Marker,
    options?: { silent?: boolean }
  ) {
    for (let i = 0; i < marker.transientIndices.length; i++) {
      const index = marker.transientIndices[i];
      marker.indices[index] = stripTransient(marker.indices[index]);
    }

    if (!options?.silent) Marker.dispatch(marker, `changed`);
  }

  export function getLayer(marker: Marker) {
    return Getter.computed((i) => marker.factor.data[LAYER][marker.indices[i]]);
  }
}

function addTransient(x: number) {
  return x | 4;
}

function stripTransient(x: number) {
  return x & ~4;
}