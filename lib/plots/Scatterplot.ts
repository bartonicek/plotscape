import { Points } from "../geoms/Points";
import { Expanse, Scales } from "../main";
import { Plot } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Summaries } from "../transformation/Summaries";
import { Columns, Indexable } from "../utils/types";

type Scatterplot = Plot & {
  summaries: readonly [
    { x: Indexable<any>; y: Indexable<any> },
    { x: Indexable<any>; y: Indexable<any> },
  ];
};

export function Scatterplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], any[]],
  options?: { ratio?: number; queries?: (data: T) => any[][] },
) {
  const { data, marker } = scene;

  const [x, y, size] = selectfn(data);
  const queries = options?.queries ? options?.queries(data) : {};
  const bijectionData = { x, y, size: size ?? (() => 0.5), ...queries };

  const factor1 = Factor.bijection(x.length, bijectionData);
  const factor2 = Factor.product(factor1, marker.factor);

  const plotData = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(plotData, [(d) => d, (d) => d]);
  const scales = Scales.of();

  const plot = Plot.of(plotData, scales, { ratio: options?.ratio });

  Scale.train(scales.x, x, { default: true });
  Scale.train(scales.y, y, { default: true });
  if (size) Scale.train(scales.size, size, { default: true });

  // Automatically adjust size based on number of datapoints
  const max = 30 / Math.log(x.length + 2);
  Expanse.set(scales.size.codomain, () => ({ max }), { default: true });

  const points = Points.of(coordinates, scales);
  Plot.addGeom(plot, points);

  return plot;
}
