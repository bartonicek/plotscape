import { Bars } from "../geoms/Bars";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { one, zero } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Columns } from "../utils/types";

export function Barplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[]] | [any[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  },
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.Bar, scales: { x: Expanse.Band } });

  let [category, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? [...vals] : () => 1;

  if (!Meta.hasName(values)) Meta.setName(values, `count`);
  else Meta.setName(values, `${reducer.name} of ${Meta.getName(values)}`);

  const factor1 = Factor.from(category);
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: zero, height: d.stat, width: one }),
    (d) => ({ x: d.label, y: zero, height: Reduced.stack(d.stat), width: one }),
  ]);

  const { scales } = plot;
  const [flat, grouped] = coordinates;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  for (const scale of [scales.y, scales.height]) {
    Scale.train(scale, flat.height, opts);
    Expanse.freeze(scale.domain, [`zero`]);
  }

  const k = 1 / new Set(category).size;
  Expanse.linkTo(scales.y.domain, scales.height.domain);
  Expanse.set(scales.width.codomain, (e) => ((e.scale = k), (e.mult = 0.9)), {
    default: true,
  });

  Meta.setName(scales.y, Meta.getName(values));

  const bars = Bars.of({ flat, grouped });
  Plot.addGeom(plot, bars);

  const barplot = { ...plot, summaries, coordinates };
  return barplot;
}
