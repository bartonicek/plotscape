import { Lines } from "../geoms/Lines";
import { Expanse, Factor, Plot, Scale } from "../main";
import { Scene } from "../scene/Scene";
import { Summaries } from "../transformation/Summaries";
import { defaultParameters } from "../utils/defaultParameters";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { Columns } from "../utils/types";

export function Lineplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => number[][],
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.Line });

  const vars = selectfn(data);
  const names = vars.map(Meta.getName);

  const x = Getter.constant(names);
  const y = Getter.multi(vars);

  const factor1 = Factor.bijection({ x, y });
  const factor2 = Factor.product(factor1, marker.factor);

  const summaries = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(summaries, [(d) => d, (d) => d]);

  const { scales } = plot;

  const { expandX, expandY } = defaultParameters;
  const xOpts = { zero: expandX, one: 1 - expandX };
  const yOpts = { zero: expandY, one: 1 - expandY };

  Scale.setDomain(scales.x, Expanse.split(Expanse.point(names, xOpts)));
  Scale.setCoomain(scales.x, Expanse.split(scales.x.codomain));

  const domains = vars.map((x) => Expanse.infer(x));
  Scale.setDomain(scales.y, Expanse.compound(domains, yOpts));
  Scale.setCoomain(scales.y, Expanse.split(scales.y.codomain));

  Meta.setName(scales.x, `variable`);
  Meta.setName(scales.y, `value`);

  const [flat, grouped] = coordinates;
  const lines = Lines.of({ flat, grouped });
  Plot.addGeom(plot, lines);

  Plot.setData(plot, coordinates);

  return plot;
}
