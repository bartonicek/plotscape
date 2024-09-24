import { Reactive } from "./Reactive";
import { Indexable } from "./types";

export interface Dataframe extends Partial<Reactive> {
  [key: string | symbol]: Indexable;
}

export namespace Dataframe {}
