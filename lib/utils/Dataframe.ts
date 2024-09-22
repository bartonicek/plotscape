import { Indexable } from "./types";

export interface Dataframe {
  [key: string | symbol]: Indexable;
}

export namespace Dataframe {}
