import { Expanse, Factor, Plot, Scale } from "../main";
import { Scene } from "../scene/Scene";
import { Summaries } from "../transformation/Summaries";
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

  scales.y.domain = Expanse.compound(vars.map((x) => Expanse.infer(x)));
  Scale.train(scales.x, names);

  console.log(Scale.breaks(scales.y));

  // Plot.addGeom(plot, lines);

  return plot;
}
