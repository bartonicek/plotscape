import { Continuous } from "./variables/Continuous";
import { Discrete } from "./variables/Discrete";
import { Reference } from "./variables/Reference";
import { Variable } from "./variables/Variable";

export type Variables = Record<PropertyKey, Variable>;
export type VariableValue<T extends Variable> = T extends Variable<infer V>
  ? V
  : never;

export type InferVariable<T> = T extends number
  ? Continuous
  : T extends string
  ? Discrete
  : Reference;

export type RowOf<T extends Variables> = {
  [key in keyof T]: VariableValue<T[key]>;
};

export type Primitive = string | number | symbol | object;
