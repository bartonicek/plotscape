import { Lines } from "../geoms/Lines";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Summaries } from "../transformation/Summaries";
import { defaultParameters } from "../utils/defaultParameters";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { Columns } from "../utils/types";

export function Lineplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => number[][],
  options?: {
    queries?: (data: T) => any[][];
  },
) {
  const { data, marker } = scene;

  const vars = selectfn(data);
  const names = vars.map(Meta.getName);

  const x = Getter.constant(names);
  const y = Getter.multi(vars);
  const queries = options?.queries ? options.queries(data) : {};

  const factor1 = Factor.bijection({ x, y, ...queries });
  const factor2 = Factor.product(factor1, marker.factor);

  const summaries = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(summaries, [(d) => d, (d) => d]);

  const plot = Plot.of({ type: `line` });
  const { scales } = plot;

  const { expandX: ex, expandY: ey } = defaultParameters;
  const xOpts = { zero: ex, one: 1 - ex };
  const yOpts = { zero: ey, one: 1 - ey };

  Scale.setDomain(scales.x, Expanse.split(Expanse.point(names, xOpts)));
  Scale.setCoomain(scales.x, Expanse.split(scales.x.codomain));

  const domains = vars.map((x) => Expanse.infer(x));
  Scale.setDomain(scales.y, Expanse.compound(domains, yOpts));
  Scale.setCoomain(scales.y, Expanse.split(scales.y.codomain));

  Meta.setName(scales.x, `variable`);
  Meta.setName(scales.y, `value`);

  Plot.setData(plot, coordinates);
  Plot.addGeom(plot, Lines.of());

  return plot as unknown as Plot;
}
