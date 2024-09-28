import { Geom } from "../geoms/Geom";
import { Rectangles } from "../geoms/Rectangles";
import { Plot } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { Dataframe } from "../utils/Dataframe";
import { minmax, one, zero } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns, Indexable } from "../utils/types";

interface Coordinates {
  x0: Indexable<number>;
  y0: Indexable<number>;
  x1: Indexable<number>;
  y1: Indexable<number>;
  area: Indexable<number>;
}

interface Summaries {
  binMin: number[];
  binMax: number[];
  breaks: number[];
  stat: Reduced<number>;
}

export interface Histogram extends Plot {
  scales: InferScales<{}>;
  data: readonly [Dataframe, Summaries, Summaries];
  rectangles: Rectangles;
}

export function Histogram<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [number[]] | [number[], number[]],
  options?: Plot.Options & {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
): Histogram {
  const { data, marker } = scene;

  let [binned, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? vals : () => 1;

  const [min, max] = minmax(binned);
  const range = max - min;

  const pars = Reactive.of()({ anchor: min, width: range / 15 });

  const factor0 = Factor.mono(binned.length);
  const factor1 = Factor.product(factor0, Factor.bin(binned, pars));
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor0, factor1, factor2] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const stat = [values, reducer] as const;

  const plotData = Summaries.of({ stat, ...queries }, factors);
  const scales = Scales.of();
  const [type, representation] = [`histo`, `absolute`] as const;
  const plotOpts: Plot.Options = { ...options, type, representation };
  const rectangles = Rectangles.of([] as Coordinates[], scales);

  const plot = Object.assign(Plot.of(plotData, scales, plotOpts), {
    rectangles,
  });
  histogram(plot);
  Plot.addGeom(plot, rectangles);

  Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  const inc = range / 10;

  Reactive.listen(plot, `set-parameters`, (data) => {
    if (!data) return;
    if (data.width) Reactive.set(pars, () => ({ width: data.width }));
    if (data.anchor) Reactive.set(pars, () => ({ anchor: data.anchor }));
  });

  Reactive.listen(plot, `grow`, () =>
    Reactive.set(pars, (p) => ({ width: (p.width * 10) / 9 })),
  );

  Reactive.listen(plot, `shrink`, () =>
    Reactive.set(pars, (p) => ({ width: (p.width * 9) / 10 })),
  );

  Reactive.listen(plot, `increment-anchor`, () =>
    Reactive.set(pars, (p) => ({ anchor: p.anchor + inc })),
  );

  Reactive.listen(plot, `decrement-anchor`, () =>
    Reactive.set(pars, (p) => ({ anchor: p.anchor - inc })),
  );

  Reactive.listen(plot, `reset`, () => {
    Reactive.set(pars, () => ({ anchor: min, width: range / 15 }));
  });

  return plot;
}

function switchRepresentation(plot: Histogram) {
  if (plot.representation === `absolute`) spinogram(plot);
  else histogram(plot);
}

function histogram(plot: Histogram) {
  const { data, rectangles } = plot;
  const coordinates = Summaries.translate(data, [
    (d) => d,
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
  const [, flat] = coordinates;

  Scale.train(scales.x, flat.x1, { default: true, name: false });
  Scale.train(scales.y, flat.y1, { default: true, ratio: true });
  Scale.freeze(scales.y, [`zero`]);

  Reactive.removeAll(rectangles.coordinates[1] as any, `changed`);
  Reactive.listen(coordinates[1] as any, `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, ratio: true });
  });

  Meta.copy(data[1].breaks, scales.x, [`name`]);
  Meta.copy(flat.y1, scales.y, [`name`]);

  Geom.setCoordinates(rectangles, coordinates as any);

  plot.representation = `absolute`;
  Plot.render(plot);
  Plot.renderAxes(plot);
}

function spinogram(plot: Histogram) {
  const { data, rectangles } = plot;

  const coordinates = Summaries.translate(data, [
    (d) => d,
    (d) => ({
      x0: Reduced.shiftLeft(Reduced.stack(d.stat)),
      y0: zero,
      x1: Reduced.stack(d.stat),
      y1: one,
    }),
    (d) => ({
      x0: Reduced.shiftLeft(Reduced.stack(Reduced.parent(d.stat))),
      y0: zero,
      x1: Reduced.stack(Reduced.parent(d.stat)),
      y1: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
      query1: d.binMin,
      query2: d.binMax,
    }),
  ]);

  const { scales } = plot;
  const [, flat] = coordinates;

  Scale.train(scales.x, [0, ...flat.x1], { default: true, name: false });
  Scale.train(scales.y, [0, 1], { default: true, ratio: true });
  Scale.freeze(scales.y, [`zero`]);

  Reactive.removeAll(rectangles.coordinates[1] as any, `changed`);
  Reactive.listen(coordinates[1] as any, `changed`, () => {
    Scale.train(scales.x, [0, ...flat.x1], { default: true, name: false });
  });

  Meta.set(scales.x, { name: `cumulative count` });
  Meta.set(scales.y, { name: `proportion` });

  Geom.setCoordinates(rectangles, coordinates as any);
  plot.representation = `propotion`;
  Plot.render(plot);
  Plot.renderAxes(plot);
}
