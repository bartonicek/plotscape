import { Getter } from "./Getter";
import { Meta } from "./Meta";
import { Indexable } from "./types";

export interface Dataframe {
  [key: string | symbol]: Indexable;
}

export namespace Dataframe {
  export function getQueryRow(data: Dataframe, index: number) {
    const result = {} as Record<string, any>;

    for (const v of Object.values(data)) {
      const [name, queryable] = [Meta.get(v, `name`), Meta.get(v, `queryable`)];
      if (!name || !queryable) continue;
      result[name] = Getter.of(v)(index);
    }

    return result;
  }
}
