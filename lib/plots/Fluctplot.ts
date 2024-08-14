import { Bars } from "../geoms/Bars";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { max, one } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns, Dataframe, VAnchor } from "../utils/types";

enum Representation {
  Absolute,
  Proportion,
}

interface Fluctplot extends Plot {
  representation: Representation;
  summaries: readonly [
    { label: string[]; label$: string[]; stat: Reduced<number> },
    { label: string[]; label$: string[]; stat: Reduced<number> },
  ];
}

export function Fluctuationplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  },
) {
  const { data, marker } = scene;

  let [cat1, cat2, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? [...vals] : () => 1;

  if (!Meta.hasName(values)) Meta.setName(values, `count`);
  else Meta.setName(values, `${reducer.name} of ${Meta.getName(values)}`);

  const factor1 = Factor.product(Factor.from(cat1), Factor.from(cat2));
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = [] as (Dataframe & Reactive)[];

  const representation = Representation.Absolute;
  const opts = { type: `fluct`, scales: { x: `band`, y: `band` } } as const;
  const plot = { representation, ...Plot.of(opts), summaries, coordinates };

  Scale.shareCodomain(plot.scales.area, plot.scales.width);
  Scale.shareCodomain(plot.scales.area, plot.scales.height);

  Plot.listen(plot, `n`, () => switchRepresentation(plot));

  fluctplot(plot);
  Plot.addGeom(plot, Bars.of({ vAnchor: VAnchor.Middle }));

  return plot as unknown as Plot;
}

function switchRepresentation(plot: Fluctplot) {
  if (plot.representation === Representation.Absolute) pctfluctplot(plot);
  else fluctplot(plot);
}

function fluctplot(plot: Fluctplot) {
  const { summaries, scales } = plot;

  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: d.label$, height: d.stat, width: d.stat }),
    (d) => ({
      x: d.label,
      y: d.label$,
      height: Reduced.stack(d.stat),
      width: Reduced.stack(d.stat),
    }),
  ]);

  const [flat] = coordinates;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, flat.y, opts);
  Scale.train(scales.width, flat.width, opts);
  Scale.train(scales.height, flat.height, opts);

  const k = max(new Set(flat.x).size, new Set(flat.y).size);

  Expanse.set(
    scales.area.codomain,
    (e) => {
      e.scale = 1 / k;
      e.mult = 0.9;
      e.offset = 0;
    },
    { default: true },
  );

  Plot.setData(plot, coordinates);
  plot.representation = Representation.Absolute;

  Plot.dispatch(plot, `render`);
}

function pctfluctplot(plot: Fluctplot) {
  const { summaries, scales } = plot;

  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: d.label$, height: one, width: one }),
    (d) => ({
      x: d.label,
      y: d.label$,
      height: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
      width: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
    }),
  ]);

  const [flat] = coordinates;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, flat.y, opts);
  Scale.train(scales.width, [0, 1], opts);
  Scale.train(scales.height, [0, 1], opts);

  const k = max(new Set(flat.x).size, new Set(flat.y).size);

  Expanse.set(
    scales.area.codomain,
    (e) => {
      e.scale = 1 / k;
      e.mult = 0.9;
      e.offset = -1;
    },
    { default: true },
  );

  Plot.setData(plot, coordinates);
  plot.representation = Representation.Proportion;

  Plot.dispatch(plot, `render`);
}
