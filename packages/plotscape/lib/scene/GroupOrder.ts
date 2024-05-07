import { seq } from "utils";
import { ContextId } from "../main";

export const Transient = 255 as const;
export type Transient = typeof Transient;
export const Base = 7 as const;
export type Base = typeof Base;
export type PersistentGroup = 6 | 5 | 4;
export type Group = Transient | Base | PersistentGroup | 3 | 2 | 1;

export const Group = {
  Group1: 7 as const,
  Group2: 6 as PersistentGroup,
  Group3: 5 as PersistentGroup,
  Group4: 4 as PersistentGroup,
};

export interface GroupOrder {
  layers: ContextId[];
  groups: typeof Group;
  cycle(): this;
}

const layers = seq(0, 7) as ContextId[];
const groups = Group;

export function newGroupOrderer(): GroupOrder {
  const props = { layers, groups };
  const methods = { cycle };
  const self = { ...props, ...methods };

  return self;
}

function cycle(this: GroupOrder) {
  const { Group2, Group3, Group4 } = this.groups;

  Group.Group2 = Group4;
  Group.Group3 = Group2;
  Group.Group4 = Group3;

  const [l1, l2, l3, _1, lt1, lt2, lt3, _2] = this.layers;
  this.layers[0] = l3;
  this.layers[1] = l1;
  this.layers[2] = l2;

  this.layers[4] = lt3;
  this.layers[5] = lt1;
  this.layers[6] = lt2;

  return this;
}
