import { Dataframe, Scene } from "@abartonicek/plotscape5";
import { Points } from "../geoms/Points";
import { Factor, Plot, Scale } from "../main";
import { Summaries } from "../transformation/Summaries";

export function Scatterplot<T extends Dataframe>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], any[]],
  options?: { ratio?: number },
) {
  const { data, marker } = scene;

  const [x, y, size] = selectfn(data);
  const factor1 = Factor.bijection({ x, y, size: size ?? (() => 0.5) });
  const factor2 = Factor.product(factor1, marker.factor);

  const summaries = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(summaries, [(d) => d, (d) => d]);

  const plot = Plot.of({ type: Plot.Type.Scatter, ratio: options?.ratio });
  const { scales } = plot;

  Scale.train(scales.x, x, { default: true });
  Scale.train(scales.y, y, { default: true });

  if (size) Scale.train(scales.size, size, { default: true });
  Plot.setData(plot, coordinates);
  Plot.addGeom(plot, Points.of());

  return plot;
}
