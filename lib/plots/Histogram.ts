import { Rectangles } from "../geoms/Rectangles";
import { Expanse } from "../main";
import { Plot } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { zero } from "../utils/funs";
import { Name } from "../utils/Name";
import { Columns, Indexable } from "../utils/types";

export function Histogram<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [number[]] | [number[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  },
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.Histo });

  let [binned, values] = selectfn(data) as [any[], Indexable<number>];
  const reducer = values && options?.reducer ? options.reducer : Reducer.sum;
  values = values ?? (() => 1);

  if (!Name.has(values)) Name.set(values, `count`);
  else Name.set(values, `${reducer.name} of ${Name.get(values)}`);

  const factor1 = Factor.bin(binned);
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = Summaries.translate(summaries, [
    (d) => ({
      x0: d.binMin,
      y0: zero,
      x1: d.binMax,
      y1: d.stat,
    }),
    (d) => ({
      x0: d.binMin,
      y0: zero,
      x1: d.binMax,
      y1: Reduced.stack(d.stat),
    }),
  ]);

  const { scales } = plot;
  const [flat, grouped] = coordinates;

  Scale.train(scales.x, flat.x1, { default: true });
  Scale.train(scales.y, flat.y1, { default: true, ratio: true });
  Expanse.freeze(scales.y.domain, [`zero`]);

  Name.set(scales.x, Name.get(binned));
  Name.set(scales.y, Name.get(values));

  const rectangles = Rectangles.of({ flat, grouped });
  Plot.addGeom(plot, rectangles);

  const histogram = { ...plot, summaries, coordinates };
  return histogram;
}
