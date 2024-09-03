import { Factor } from "../transformation/Factor";
import { Reactive } from "../utils/Reactive";
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

export interface Marker extends Reactive<Marker.Event> {
  group: GroupType;
  indices: number[];
  transientIndices: number[];
  factor: Factor<{ [LAYER]: number[] }>;
}

export namespace Marker {
  export type Event = `updated` | `cleared`;

  export function of(n: number): Marker {
    const group = Transient;
    const indices = Array<number>(n).fill(Group.Base);
    const transientIndices: number[] = [];
    const type = Factor.Type.Surjection;
    const factor = Factor.of(type, 8, indices, {
      [LAYER]: [0, 1, 2, 3, 4, 5, 6, 7],
    });

    const marker = Reactive.of2<Event>()({
      group,
      indices,
      transientIndices,
      factor,
    });

    Reactive.listen(marker, `updated`, () =>
      Reactive.dispatch(factor, `changed`),
    );

    Reactive.listen(marker, `cleared`, () =>
      Reactive.dispatch(factor, `changed`),
    );

    return marker;
  }

  export function setGroup(marker: Marker, group: GroupType) {
    marker.group = group;
  }

  export function update(
    marker: Marker,
    indices: number[],
    options?: { group?: GroupType; silent?: boolean },
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

    if (!options?.silent) Reactive.dispatch(marker, `updated`);
  }

  export function clearAll(marker: Marker, options?: { silent?: boolean }) {
    for (let i = 0; i < marker.indices.length; i++) {
      marker.indices[i] = Group.Base;
    }

    if (!options?.silent) Reactive.dispatch(marker, `cleared`);
  }

  export function clearTransient(
    marker: Marker,
    options?: { silent?: boolean },
  ) {
    for (let i = 0; i < marker.transientIndices.length; i++) {
      const index = marker.transientIndices[i];
      marker.indices[index] = stripTransient(marker.indices[index]);
    }

    if (!options?.silent) Reactive.dispatch(marker, `cleared`);
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

export const LAYER = Symbol(`layer`);
