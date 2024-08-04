import { Factor } from "../main";
import { Reactive } from "../utils/Reactive";
import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { LAYER } from "../utils/symbols";
import { DataLayer, Indexable } from "../utils/types";

export const Transient = 255 as const;
export type Transient = typeof Transient;

export enum Group {
  Base = 7,
  First = 6,
  Second = 5,
  Third = 4,
  BaseTransient = 3,
  FirstTransient = 2,
  SecondTransient = 1,
  ThirdTransient = 0,
}

type GroupType = Group | Transient;

export interface Marker extends Reactive {
  group: GroupType;
  indices: number[];
  transientIndices: number[];
  factor: Factor<{ [LAYER]: number[] }>;
}

type EventType = `updated` | `cleared`;

export namespace Marker {
  export function of(n: number): Marker {
    const group = Transient;
    const indices = Array<number>(n).fill(Group.Base);
    const transientIndices: number[] = [];
    const type = Factor.Type.Surjection;
    const factor = Factor.of(type, 8, indices, {
      [LAYER]: [0, 1, 2, 3, 4, 5, 6, 7],
    });

    const marker = Reactive.of({ group, indices, transientIndices, factor });
    Marker.listen(marker, `updated`, () => Factor.dispatch(factor, `changed`));
    Marker.listen(marker, `cleared`, () => Factor.dispatch(factor, `changed`));

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

    if (!options?.silent) Marker.dispatch(marker, `updated`);
  }

  export function clearAll(marker: Marker, options?: { silent?: boolean }) {
    for (let i = 0; i < marker.indices.length; i++) {
      marker.indices[i] = Group.Base;
    }

    if (!options?.silent) Marker.dispatch(marker, `cleared`);
  }

  export function clearTransient(
    marker: Marker,
    options?: { silent?: boolean }
  ) {
    for (let i = 0; i < marker.transientIndices.length; i++) {
      const index = marker.transientIndices[i];
      marker.indices[index] = stripTransient(marker.indices[index]);
    }

    if (!options?.silent) Marker.dispatch(marker, `cleared`);
  }

  export function getLayer(marker: Marker): Indexable<DataLayer> {
    const { factor, indices } = marker;
    return (i) => factor.data[LAYER][indices[i]] as DataLayer;
  }
}

function addTransient(x: number) {
  return x & ~4;
}

function stripTransient(x: number) {
  return x | 4;
}
