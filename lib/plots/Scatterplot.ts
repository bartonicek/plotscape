import { Points } from "../geoms/Points";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Summaries } from "../transformation/Summaries";
import { Columns, Indexable } from "../utils/types";

export interface Scatterplot extends Plot {
  scales: InferScales<{}>;
  data: readonly [
    { x: Indexable; y: Indexable },
    { x: Indexable; y: Indexable },
  ];
}

export function Scatterplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], any[]],
  options?: Plot.Options & { queries?: (data: T) => any[][] },
): Scatterplot {
  const { data, marker } = scene;

  const [x, y, size] = selectfn(data);
  const queries = options?.queries ? options?.queries(data) : {};
  const bijectionData = { x, y, size: size ?? (() => 0.5), ...queries };

  const factor1 = Factor.bijection(x.length, bijectionData);
  const factor2 = Factor.product(factor1, marker.factor);

  const plotData = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(plotData, [(d) => d, (d) => d]);
  const scales = Scales.of();
  const plotOpts: Plot.Options = { ...options, type: `scatter` } as const;

  const plot = Plot.of(plotData, scales, plotOpts);

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
