import { Factor } from "../transformation/Factor";
import { Indexable } from "../utils/Indexable";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { DataLayer } from "../utils/types";

export const Transient = 255 as const;
export type Transient = typeof Transient;

export const Group = {
  Base: 7,
  First: 6,
  Second: 5,
  Third: 4,
  BaseTransient: 3,
  FirstTransient: 2,
  SecondTransient: 1,
  ThirdTransient: 0,
} as const;

export type Group = typeof Group;
export type GroupId = Group[keyof Group] | Transient;
export const LAYER = Symbol(`layer`);

export interface Marker extends Reactive<Marker.Event> {
  group: GroupId;
  indices: Uint32Array;
  transientIndices: number[];
  factor: Factor<{ [LAYER]: number[] }>;
}

export namespace Marker {
  export type Event = `cleared`;

  export function of(n: number): Marker {
    const group = Transient;
    const indices = new Uint32Array(n).fill(Group.Base);
    const transientIndices: number[] = [];
    const type: Factor.Type = `surjection`;

    const layer = [0, 1, 2, 3, 4, 5, 6, 7];
    const factor = Factor.of(type, 8, indices, { [LAYER]: layer });
    Meta.set(layer, { queryable: true });

    const marker = Reactive.of<Event>()({
      group,
      indices,
      transientIndices,
      factor,
    });

    Reactive.propagate(marker, factor, `changed`);
    return marker;
  }

  export function setGroup(marker: Marker, group: GroupId) {
    marker.group = group;
  }

  export function update(
    marker: Marker,
    indices: number[],
    options?: { group?: GroupId; silent?: boolean },
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

    if (!options?.silent) Reactive.dispatch(marker, `changed`);
  }

  export function clearAll(marker: Marker, options?: { silent?: boolean }) {
    for (let i = 0; i < marker.indices.length; i++) {
      marker.indices[i] = Group.Base;
    }

    if (!options?.silent) {
      Reactive.dispatch(marker, `changed`);
      Reactive.dispatch(marker, `cleared`);
    }
  }

  export function clearTransient(
    marker: Marker,
    options?: { silent?: boolean },
  ) {
    for (let i = 0; i < marker.transientIndices.length; i++) {
      const index = marker.transientIndices[i];
      marker.indices[index] = stripTransient(marker.indices[index]);
    }

    if (!options?.silent) {
      Reactive.dispatch(marker, `changed`);
      Reactive.dispatch(marker, `cleared`);
    }
  }

  export function getLayer(marker: Marker): Indexable<DataLayer> {
    const { factor, indices } = marker;
    return (i) => factor.data[LAYER][indices[i]] as DataLayer;
  }

  export function isTransient(x: number) {
    return !(x & 4);
  }

  function addTransient(x: number) {
    return x & ~4;
  }

  function stripTransient(x: number) {
    return x | 4;
  }
}
