import { Bars } from "../geoms/Bars";
import {
  Expanse,
  ExpanseContinuous,
  Factor,
  Plot,
  Reducer,
  Scale,
  Scene,
} from "../main";
import { Reduced } from "../transformation/Reduced";
import { Summaries } from "../transformation/Summaries";
import { max, sqrt, square } from "../utils/funs";
import { Name } from "../utils/Name";
import { Columns, Indexable, VAnchor } from "../utils/types";

export function Fluctuationplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  },
) {
  const { data, marker } = scene;
  type Variables = [any[], any[], Indexable<number>];
  const plot = Plot.of({
    type: Plot.Type.Fluct,
    scales: { x: Expanse.Band, y: Expanse.Band },
  });

  let [cat1, cat2, values] = selectfn(data) as Variables;
  const reducer = values && options?.reducer ? options.reducer : Reducer.sum;
  values = values ?? (() => 1);

  if (!Name.has(values)) Name.set(values, `count`);
  else Name.set(values, `${reducer.name} of ${Name.get(values)}`);

  const factor1 = Factor.product(Factor.from(cat1), Factor.from(cat2));
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: d.label$, height: d.stat, width: d.stat }),
    (d) => ({
      x: d.label,
      y: d.label$,
      height: Reduced.stack(d.stat),
      width: Reduced.stack(d.stat),
    }),
  ]);

  const { scales } = plot;
  const [flat, grouped] = coordinates;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, flat.y, opts);
  Scale.train(scales.height, flat.height, opts);
  Scale.train(scales.width, flat.width, opts);

  const k = 1 / max(new Set(cat1).size, new Set(cat2).size) ** 2;

  scales.width.codomain = scales.area.codomain;
  scales.height.codomain = scales.area.codomain;

  const settingWH = (e: ExpanseContinuous) => {
    e.scale = k;
    e.mult = 0.9;
    e.trans = square;
    e.inv = sqrt;
  };

  Expanse.set(scales.width.codomain, settingWH, { default: true });
  Expanse.set(scales.height.codomain, settingWH, { default: true });

  const bars = Bars.of({ flat, grouped }, { vAnchor: VAnchor.Middle });
  Plot.addGeom(plot, bars);

  const fluctplot = { ...plot, summaries, coordinates };
  return fluctplot;
}
