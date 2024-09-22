import { Lines } from "../geoms/Lines";
import { Plot } from "../plot/Plot";
import { ExpanseCompound } from "../scales/ExpanseCompound";
import { ExpansePoint } from "../scales/ExpansePoint";
import { ExpanseSplit } from "../scales/ExpanseSplit";
import { inferExpanse } from "../scales/inferExpanse";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Summaries } from "../transformation/Summaries";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { Columns } from "../utils/types";

export function Pcoordsplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => number[][],
  options?: {
    queries?: (data: T) => any[][];
  },
) {
  const { data, marker } = scene;

  const vars = selectfn(data);
  const names = vars.map((x) => Meta.get(x, `name`)) as string[];

  const x = Getter.constant(names);
  const y = Getter.multi(vars);
  const queries = options?.queries ? options.queries(data) : {};

  const factor1 = Factor.bijection(vars[0].length, { x, y, ...queries });
  const factor2 = Factor.product(factor1, marker.factor);

  const summaries = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(summaries, [(d) => d, (d) => d]);

  const plot = Plot.of({ type: `pcoords` });
  const { scales } = plot;

  const { expandX: ex, expandY: ey } = scene.options;
  const xOpts = { zero: ex, one: 1 - ex };
  const yOpts = { zero: ey, one: 1 - ey };

  Scale.setDomain(scales.x, ExpanseSplit.of(ExpansePoint.of(names, xOpts)));
  Scale.setCoomain(scales.x, ExpanseSplit.of(scales.x.codomain));

  const domains = vars.map((x) => inferExpanse(x));
  Scale.setDomain(scales.y, ExpanseCompound.of(domains, yOpts));
  Scale.setCoomain(scales.y, ExpanseSplit.of(scales.y.codomain));

  Meta.set(scales.x, { name: `variable` });
  Meta.set(scales.y, { name: `value` });

  Plot.setData(plot, coordinates);
  Plot.addGeom(plot, Lines.of());

  return plot as unknown as Plot;
}
