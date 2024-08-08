import { Bars } from "../geoms/Bars";
import { ExpanseBand } from "../main";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { cumsum, one, orderIndices, zero } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns, Dataframe } from "../utils/types";

enum Representation {
  Absolute,
  Proportion,
}

interface Barplot extends Plot {
  representation: Representation;
  summaries: readonly [
    { label: string[]; stat: Reduced<number> },
    { label: string[]; stat: Reduced<number> },
  ];
  coordinates: Dataframe[];
  bars?: Bars;
}

export function Barplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[]] | [any[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  },
) {
  const { data, marker } = scene;

  let [category, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? [...vals] : () => 1;

  if (!vals) Meta.setName(values, `count`);
  else Meta.setName(values, `${reducer.name} of ${Meta.getName(vals)}`);

  const factor1 = Factor.from(category);
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = [] as (Dataframe & Reactive)[];

  const representation = Representation.Absolute;
  const opts = { type: Plot.Type.Bar, scales: { x: Expanse.Band } } as const;
  const plot = { representation, ...Plot.of(opts), summaries, coordinates };

  Plot.listen(plot, `n`, () => {
    switch (plot.representation) {
      case Representation.Absolute:
        spineplot(plot);
        break;
      case Representation.Proportion:
        barplot(plot);
        break;
    }
  });

  barplot(plot);

  return plot;
}

function sortAxis(domain: ExpanseBand, values: number[]) {
  if (!domain.ordered) {
    const indices = orderIndices(values);
    ExpanseBand.reorder(domain, indices);
  } else ExpanseBand.reorder(domain);
}

function barplot(plot: Barplot) {
  const { summaries } = plot;
  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: zero, height: d.stat, width: one }),
    (d) => ({ x: d.label, y: zero, height: Reduced.stack(d.stat), width: one }),
  ]);

  const [flat, grouped] = coordinates;
  plot.coordinates = coordinates;

  const { scales } = plot;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, flat.height, opts);
  Scale.train(scales.width, [0, 1], opts);
  Scale.train(scales.height, flat.height, opts);

  Expanse.freeze(scales.y.domain, [`zero`]);
  Expanse.freeze(scales.height.domain, [`zero`]);
  ExpanseBand.setWeights(scales.x.domain);

  const k = 1 / new Set(flat.x).size;
  Expanse.linkTo(scales.y.domain, scales.height.domain);
  Expanse.set(
    scales.width.codomain,
    (e) => {
      e.scale = k;
      e.mult = 0.9;
      e.offset = 0;
    },
    { default: true },
  );

  Meta.setName(scales.y, Meta.getName(flat.height));

  Reactive.removeListeners(plot, `o`);
  Plot.listen(plot, `o`, () => sortAxis(scales.x.domain, flat.height));

  const bars = Bars.of({ flat, grouped });
  if (plot.bars) Plot.deleteGeom(plot, plot.bars);
  Plot.addGeom(plot, bars);

  plot.bars = bars;
  plot.representation = Representation.Absolute;
  Plot.dispatch(plot, `render`);
  Plot.dispatch(plot, `render-axes`);
}

function spineplot(plot: Barplot) {
  const { summaries } = plot;
  const coordinates = Summaries.translate(summaries, [
    (d) => ({ x: d.label, y: zero, height: one, width: d.stat }),
    (d) => ({
      x: d.label,
      y: zero,
      height: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
      width: Reduced.parent(d.stat),
    }),
  ]);

  const [flat, grouped] = coordinates;
  plot.coordinates = coordinates;

  const { scales } = plot;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, [0, 1], opts);
  Scale.train(scales.width, cumsum(flat.width), opts);
  Scale.train(scales.height, [0, 1], opts);
  Expanse.freeze(scales.y.domain, [`zero`]);
  Expanse.freeze(scales.height.domain, [`zero`]);

  ExpanseBand.setWeights(scales.x.domain, flat.width);

  Expanse.linkTo(scales.y.domain, scales.height.domain);
  Expanse.set(
    scales.width.codomain,
    (e) => {
      e.scale = 1;
      e.mult = 1;
      e.offset = -1;
    },
    { default: true },
  );

  Meta.setName(scales.y, `proportion`);

  console.log(scales.x.domain);

  Reactive.removeListeners(plot, `o`);
  Plot.listen(plot, `o`, () => sortAxis(scales.x.domain, flat.width));

  const bars = Bars.of({ flat, grouped });
  if (plot.bars) Plot.deleteGeom(plot, plot.bars);
  Plot.addGeom(plot, bars);

  plot.bars = bars;
  plot.representation = Representation.Proportion;
  Plot.dispatch(plot, `render`);
  Plot.dispatch(plot, `render-axes`);
}
