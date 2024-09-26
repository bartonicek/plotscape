import { Lines } from "../geoms/Lines";
import { Plot } from "../plot/Plot";
import { ExpanseCompound } from "../scales/ExpanseCompound";
import { ExpansePoint } from "../scales/ExpansePoint";
import { ExpanseSplit } from "../scales/ExpanseSplit";
import { inferExpanse } from "../scales/inferExpanse";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Summaries } from "../transformation/Summaries";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { Columns } from "../utils/types";

export interface Pcoordsplot extends Plot {
  scales: InferScales<{
    x: [`split`, `split`];
    y: [`compound`, `split`];
  }>;
  data: readonly [any, any];
  lines: Lines;
}

export function Pcoordsplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => number[][],
  options?: {
    queries?: (data: T) => any[][];
  },
): Pcoordsplot {
  const { data, marker } = scene;

  const vars = selectfn(data);
  const names = vars.map((x) => Meta.get(x, `name`)) as string[];

  const x = Getter.constant(names);
  const y = Getter.multi(vars);
  const queries = options?.queries ? options.queries(data) : {};

  const factor1 = Factor.bijection(vars[0].length, { x, y, ...queries });
  const factor2 = Factor.product(factor1, marker.factor);
  const plotData = Summaries.of({}, [factor1, factor2] as const);

  const scales = Scales.of({
    x: [`split`, `split`],
    y: [`compound`, `split`],
  });
  const props = { type: `pcoords`, representation: `absolute` } as const;
  const coordinates = Summaries.translate(plotData, [(d) => d, (d) => d]);
  const lines = Lines.of(coordinates, scales);

  const plot = Object.assign(Plot.of(plotData, scales, props), { lines });
  Plot.addGeom(plot, lines);

  const domains = vars.map((x) => inferExpanse(x));
  scales.x.domain = ExpanseSplit.of(ExpansePoint.of(names));
  scales.y.domain = ExpanseCompound.of(domains);
  // scales.x.codomain = ExpanseSplit.of(scales.x.codomain);
  // scales.y.codomain = ExpanseSplit.of(scales.y.codomain);

  Meta.set(scales.x, { name: `variable` });
  Meta.set(scales.y, { name: `value` });

  return plot;
}
