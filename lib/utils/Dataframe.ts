import { Reduced } from "../transformation/Reduced";
import { Getter } from "./Getter";
import { Meta } from "./Meta";
import { Indexable } from "./types";

export interface Dataframe {
  [key: string | symbol]: Indexable;
}

export namespace Dataframe {
  export function getQueryRow(
    data: Dataframe,
    index: number,
    options?: { reduced?: `exclude` | `only` },
  ) {
    const result = {} as Record<string, any>;

    for (const v of Object.values(data)) {
      const [name, queryable, reduced] = [
        Meta.get(v, `name`),
        Meta.get(v, `queryable`),
        Meta.get(v, `reduced`),
      ];

      if (options?.reduced === `exclude` && reduced) continue;
      if (options?.reduced === `only` && !reduced) continue;

      if (!name || !queryable) continue;

      // To avoid e.g. stacking, shifting, etc...
      const variable = reduced ? v[Reduced.ORIGINAL_VALUES] : v;
      const getter = Getter.of(variable);

      result[name] = getter(index);
    }

    return result;
  }
}
