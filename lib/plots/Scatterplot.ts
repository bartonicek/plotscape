import { Points } from "../geoms/Points";
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

  const factor1 = Factor.bijection(bijectionData);
  const factor2 = Factor.product(factor1, marker.factor);

  const summaries = Summaries.of({}, [factor1, factor2] as const);
  const coordinates = Summaries.translate(summaries, [(d) => d, (d) => d]);

  const plot = Plot.of({ type: `scatter`, ratio: options?.ratio });
  const { scales } = plot;

  Scale.train(scales.x, x, { default: true });
  Scale.train(scales.y, y, { default: true });

  if (size) Scale.train(scales.size, size, { default: true });
  Plot.setData(plot, coordinates);
  Plot.addGeom(plot, Points.of());

  return { ...plot, summaries } as unknown as Plot;
}
