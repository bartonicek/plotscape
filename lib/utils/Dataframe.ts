import { Indexable } from "./Indexable";

export interface Dataframe {
  [key: string | symbol]: Indexable;
}

export namespace Dataframe {}
