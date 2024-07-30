import { makeDispatchFn, makeListenFn } from "../utils/funs";

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

export interface Marker {
  group: GroupType;
  indices: number[];
  transientIndices: number[];
  dispatch: EventTarget;
}

type EventType = `changed`;

export namespace Marker {
  export function of(n: number): Marker {
    const group = Transient;
    const indices = Array<number>(n).fill(Group.Base);
    const transientIndices: number[] = [];
    const dispatch = new EventTarget();
    return { group, indices, transientIndices, dispatch };
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
    clearTransient(marker);

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
}

function addTransient(x: number) {
  return x & ~4;
}

function stripTransient(x: number) {
  return x | 4;
}
