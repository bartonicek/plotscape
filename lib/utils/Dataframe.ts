import { Indexable } from "./Indexable";
import { Metadata } from "./Metadata";

export interface Dataframe {
  [key: string | symbol]: Indexable;
}

export namespace Dataframe {
  /**
   * Finds the length across a list of `Indexable`s. The function just loops
   * through the list, until it finds an an array and then it returns its length.
   * If it doesn't find one (all indexables are functions), then it throws an error.
   * @param indexables An array of indexables
   * @returns A `number` (or throws)
   */

  export function findLength(data: Dataframe) {
    for (const v of Object.values(data)) {
      if (!v) continue;
      const length = Metadata.get(v, `length`);
      if (length) return length;
    }

    const msg = `At least one variable needs to be of fixed length`;
    throw new Error(msg);
  }
}
