import { Bars } from "../geoms/Bars";
import { Geom } from "../geoms/Geom";
import { Expanse } from "../main";
import { Plot } from "../plot/Plot";
import { ExpanseBand } from "../scales/ExpanseBand";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { Dataframe } from "../utils/Dataframe";
import { cumsum, one, orderIndices, zero } from "../utils/funs";
import { Indexable } from "../utils/Indexable";
import { Metadata } from "../utils/Metadata";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";

interface Coordinates extends Dataframe {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
}

export interface Barplot extends Plot {
  scales: InferScales<{ x: [`band`, `continuous`] }>;
  data: readonly [
    { label: string[]; stat: Reduced<number> },
    { label: string[]; stat: Reduced<number> },
  ];
  bars: Bars;
}

export function Barplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[]] | [any[], number[]],
  options?: Plot.Options & {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
): Barplot {
  const { data, marker } = scene;

  let [cat, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? vals : () => 1;

  const factor1 = Factor.from(cat);
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const stat = [values, reducer] as const;
  const plotData = Summaries.of({ stat, ...queries }, factors);

  const scales = Scales.of({ x: [`band`, `continuous`] });
  const [type, representation] = [`bar`, `absolute`] as const;
  const plotOpts = { ...options, type, representation } as const;
  const bars = Bars.of([] as Coordinates[], scales);

  const plot = Object.assign(Plot.of(plotData, scales, plotOpts), { bars });
  barplot(plot);
  Plot.addGeom(plot, bars);

  Scale.link(scales.y, [scales.height]);
  Scale.freeze(scales.y, [`zero`]);
  Scale.freeze(scales.height, [`zero`]);

  Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  return plot;
}

function sortAxis(domain: ExpanseBand, values: number[]) {
  if (!domain.props.ordered) {
    const indices = orderIndices(values);
    ExpanseBand.reorder(domain, indices);
  } else ExpanseBand.reorder(domain);
}

function switchRepresentation(plot: Barplot) {
  if (plot.representation === `absolute`) spineplot(plot);
  else barplot(plot);
}

function barplot(plot: Barplot) {
  const { data, scales, bars } = plot;
  const coordinates = Summaries.translate(data, [
    (d) => ({ x: d.label, y: zero, height: d.stat, width: one }),
    (d) => ({ x: d.label, y: zero, height: Reduced.stack(d.stat), width: one }),
  ]);

  const [flat] = coordinates;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, flat.height, opts);
  Scale.train(scales.width, [0, 1], opts);
  Scale.train(scales.height, flat.height, opts);

  ExpanseBand.setWeights(scales.x.domain);

  const k = 1 / new Set(flat.x).size;
  const widthProps = { scale: k, mult: 0.9 };
  Scale.set(scales.width, () => widthProps, { default: true });
  Expanse.set(scales.width.codomain, () => ({ offset: 0 }), { default: true });

  Metadata.copy(flat.height, scales.y, [`name`]);

  Reactive.removeAll(plot, `reorder`);
  Reactive.listen(plot, `reorder`, () =>
    sortAxis(scales.x.domain, flat.height),
  );

  Geom.setCoordinates(bars, coordinates);

  plot.representation = `absolute`;
  Plot.render(plot);
  Plot.renderAxes(plot);

  return plot;
}

function spineplot(plot: Barplot) {
  const { data, scales, bars } = plot;
  const coordinates = Summaries.translate(data, [
    (d) => ({ x: d.label, y: zero, height: one, width: d.stat }),
    (d) => ({
      x: d.label,
      y: zero,
      height: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
      width: Reduced.parent(d.stat),
    }),
  ]);

  const [flat] = coordinates;
  const opts = { default: true, ratio: true };

  Scale.train(scales.x, flat.x, opts);
  Scale.train(scales.y, [0, 1], opts);
  Scale.train(scales.width, cumsum(flat.width), opts);
  Scale.train(scales.height, [0, 1], opts);

  ExpanseBand.setWeights(scales.x.domain, flat.width);

  const widthProps = { scale: 1, mult: 1 };
  Scale.set(scales.width, () => widthProps, { default: true });
  Expanse.set(scales.width.codomain, () => ({ offset: -1 }), { default: true });

  Metadata.set(scales.y, { name: `proportion` });

  Reactive.removeAll(plot, `reorder`);
  Reactive.listen(plot, `reorder`, () => sortAxis(scales.x.domain, flat.width));

  Geom.setCoordinates(bars, coordinates);

  plot.representation = `proportion`;
  Plot.render(plot);
  Plot.renderAxes(plot);
}
