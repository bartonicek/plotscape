export const Transient = 255 as const;
export type Transient = typeof Transient;

export enum Group {
  Base = 7,
  First = 6,
  Second = 5,
  Third = 4,
}

export interface Marker {
  indices: number[];
  transientIndices: number[];
}

export namespace Marker {
  export function of(n: number): Marker {
    const indices = Array<number>(n).fill(Group.Base);
    const transientIndices: number[] = [];
    return { indices, transientIndices };
  }

  export function update(marker: Marker, indices: number[], group: number) {
    if (group === Transient) {
      for (let i = 0; i < indices.length; i++) {
        marker.indices[i] = addTransient(marker.indices[i]);
      }
      marker.transientIndices = indices;
      return;
    }

    for (let i = 0; i < indices.length; i++) marker.indices[i] = group;
  }

  export function clearAll(marker: Marker) {
    for (let i = 0; i < marker.indices.length; i++) {
      marker.indices[i] = Group.Base;
    }
    return;
  }

  export function clearTransient(marker: Marker) {
    for (let i = 0; i < marker.transientIndices.length; i++) {
      marker.indices[i] = stripTransient(marker.indices[i]);
    }
  }
}

function addTransient(x: number) {
  return x & ~4;
}

function stripTransient(x: number) {
  return x | 4;
}
