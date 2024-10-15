import { Bars } from "../geoms/Bars";
import { Geom } from "../geoms/Geom";
import { Expanse } from "../main";
import { Plot } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { Dataframe } from "../utils/Dataframe";
import { max, one } from "../utils/funs";
import { Indexable } from "../utils/Indexable";
import { Reactive } from "../utils/Reactive";
import { Columns, VAnchor } from "../utils/types";

interface Summaries extends Dataframe {
  label: string[];
  label$: string[];
  stat: Reduced<number>;
}

interface Coordinates extends Dataframe {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
}

export interface Fluctplot extends Plot {
  scales: InferScales<{
    x: [`band`, `continuous`];
    y: [`band`, `continuous`];
  }>;
  data: readonly [Summaries, Summaries];
  bars: Bars;
}

export function Fluctuationplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], any[]] | [any[], any[], number[]],
  options?: Plot.Options & {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
): Fluctplot {
  const { data, marker } = scene;

  let [cat1, cat2, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? [...vals] : () => 1;

  const factor1 = Factor.product(Factor.from(cat1), Factor.from(cat2));
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const stat = [values, reducer] as const;
  const plotData = Summaries.of({ stat, ...queries }, factors);

  const scales = Scales.of({
    x: [`band`, `continuous`],
    y: [`band`, `continuous`],
  });

  const [type, representation] = [`fluct`, `absolute`] as const;
  const plotOpts: Plot.Options = { ...options, type, representation };
  const bars = Bars.of([] as Coordinates[], scales, {
    vAnchor: VAnchor.Middle,
  });
  const plot = Object.assign(Plot.of(plotData, scales, plotOpts), { bars });

  Scale.link(scales.area, [scales.width, scales.height]);
  Scale.shareCodomain(scales.area, [scales.width, scales.height]);

  fluctplot(plot);
  Plot.addGeom(plot, bars);

  Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  return plot;
}

function switchRepresentation(plot: Fluctplot) {
  if (plot.representation === `absolute`) pctfluctplot(plot);
  else fluctplot(plot);
}

function fluctplot(plot: Fluctplot) {
  const { data, scales, bars } = plot;

  const coordinates = Summaries.translate(data, [
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

  const areaProps = { scale: 1 / k ** 2, mult: 0.9 };
  Scale.set(scales.area, () => areaProps, { default: true });
  Expanse.set(scales.area.codomain, () => ({ offset: 0 }));

  Geom.setCoordinates(bars, coordinates);
  plot.representation = `absolute`;

  Plot.render(plot);
}

function pctfluctplot(plot: Fluctplot) {
  const { data, scales, bars } = plot;

  const coordinates = Summaries.translate(data, [
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

  const widthProps = { scale: 1 / k ** 2, mult: 0.9 };
  Scale.set(scales.area, () => widthProps, { default: true });
  Expanse.set(scales.area.codomain, () => ({ offset: -2 }));

  Geom.setCoordinates(bars, coordinates);
  plot.representation = `proportion`;

  Plot.render(plot);
}
