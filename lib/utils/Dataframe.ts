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
  export function findLength(data: Dataframe): number {
    let length = -1;

    for (const v of Object.values(data)) {
      if (!v) continue;
      const len = Metadata.get(v, `length`) as number | undefined;
      if (!len) continue;

      const sameLengthError = `All arrays in the dataframe must have the same length`;
      if (length !== -1 && len != length) throw new Error(sameLengthError);

      length = len;
    }

    const noFixedLengthError = `No fixed-length variables present in the dataframe`;
    if (length === -1) throw new Error(noFixedLengthError);
    return length;
  }

  export function checkLength(data: Dataframe) {
    findLength(data);
  }
}
