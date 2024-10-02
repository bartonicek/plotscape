import { Geom } from "../geoms/Geom";
import { Rectangles } from "../geoms/Rectangles";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { minmax, one } from "../utils/funs";
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
  binMin$: number[];
  binMax$: number[];
  breaks: number[];
  breaks$: number[];
  stat: Reduced<number>;
}

export interface Histogram2D extends Plot {
  scales: InferScales<{}>;
  data: readonly [Summaries, Summaries];
  rectangles: Rectangles;
}

export function Histogram2d<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [number[], number[]] | [number[], number[], number[]],
  options?: Plot.Options & {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
): Histogram2D {
  const { data, marker } = scene;

  let [binned1, binned2, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? vals : () => 1;

  const [min1, max1] = minmax(binned1);
  const [min2, max2] = minmax(binned2);
  const [range1, range2] = [max1 - min1, max2 - min2];

  const pars1 = Reactive.of()({ anchor: min1, width: range1 / 15 });
  const pars2 = Reactive.of()({ anchor: min2, width: range2 / 15 });

  const factor1 = Factor.bin(binned1, pars1);
  const factor2 = Factor.bin(binned2, pars2);
  const factor3 = Factor.product(factor1, factor2);
  const factor4 = Factor.product(factor3, marker.factor);
  const factors = [factor3, factor4] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const stat = [values, reducer] as const;

  const plotData = Summaries.of({ stat, ...queries }, factors);
  const scales = Scales.of();
  const [type, representation] = [`histo2d`, `absolute`] as const;
  const plotOpts: Plot.Options = { ...options, type, representation } as const;
  const rectangles = Rectangles.of([] as Coordinates[], scales);

  const plot = Object.assign(Plot.of(plotData, scales, plotOpts), {
    rectangles,
  });
  histogram2d(plot);
  Plot.addGeom(plot, rectangles);

  Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  Reactive.listen(plot, `set-parameters`, (data) => {
    if (!data) return;
    if (data.width1) Reactive.set(pars1, () => ({ width: data.width1 }));
    if (data.anchor1) Reactive.set(pars1, () => ({ anchor: data.anchor1 }));
    if (data.width2) Reactive.set(pars2, () => ({ width: data.width2 }));
    if (data.anchor2) Reactive.set(pars2, () => ({ anchor: data.anchor2 }));
  });

  Reactive.listen(plot, `grow`, () => {
    Reactive.set(pars1, (p) => ({ width: (p.width * 10) / 9 }));
    Reactive.set(pars2, (p) => ({ width: (p.width * 10) / 9 }));
  });

  Reactive.listen(plot, `shrink`, () => {
    Reactive.set(pars1, (p) => ({ width: (p.width * 9) / 10 }));
    Reactive.set(pars2, (p) => ({ width: (p.width * 9) / 10 }));
  });

  Reactive.listen(plot, `reset`, () => {
    Reactive.set(pars1, () => ({ anchor: min1, width: range1 / 15 }));
    Reactive.set(pars2, () => ({ anchor: min2, width: range2 / 15 }));
  });

  return plot;
}

function switchRepresentation(plot: any) {
  if (plot.representation === `absolute`) spinogram2d(plot);
  else histogram2d(plot);
}

function histogram2d(plot: Histogram2D) {
  const { data, rectangles } = plot;
  const coordinates = Summaries.translate(data, [
    (d) => ({
      x0: d.binMin,
      y0: d.binMin$,
      x1: d.binMax,
      y1: d.binMax$,
      area: d.stat,
    }),
    (d) => ({
      x0: d.binMin,
      y0: d.binMin$,
      x1: d.binMax,
      y1: d.binMax$,
      area: Reduced.stack(d.stat),
    }),
  ]);

  const { scales } = plot;
  const [, flat] = coordinates;

  const opts = { default: true };
  Scale.train(scales.x, flat.x1, opts);
  Scale.train(scales.y, flat.y1, opts);
  Scale.train(scales.areaPct, flat.area, opts);

  Expanse.set(scales.area.codomain, () => ({ min: 0, max: 1 }), opts);
  Expanse.freeze(scales.area.codomain, [`min`, `max`]);

  Reactive.removeAll(rectangles.coordinates[0], `changed`);
  Reactive.listen(coordinates[0], `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, name: false });
    Scale.train(scales.areaPct, flat.area, opts);
  });

  plot.representation = `absolute`;
  Geom.setCoordinates(rectangles, coordinates);

  Meta.copy(data[1].breaks, scales.x, [`name`]);
  Meta.copy(data[1].breaks$, scales.y, [`name`]);

  Plot.render(plot);
  Plot.renderAxes(plot);
}

function spinogram2d(plot: Histogram2D) {
  const { data, rectangles } = plot;
  const coordinates = Summaries.translate(data, [
    (d) => ({
      x0: d.binMin,
      y0: d.binMin$,
      x1: d.binMax,
      y1: d.binMax$,
      area: one,
    }),
    (d) => ({
      x0: d.binMin,
      y0: d.binMin$,
      x1: d.binMax,
      y1: d.binMax$,
      area: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
    }),
  ]);

  const { scales } = plot;
  const [, flat] = coordinates;

  const opts = { default: true };
  Scale.train(scales.x, flat.x1, opts);
  Scale.train(scales.y, flat.y1, opts);
  Scale.train(scales.areaPct, [0, 1], opts);

  Expanse.set(scales.area.codomain, () => ({ min: 0, max: 1 }), opts);
  Expanse.freeze(scales.area.codomain, [`min`, `max`]);

  Reactive.removeAll(rectangles.coordinates[0], `changed`);
  Reactive.listen(coordinates[0], `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, name: false });
  });

  plot.representation = `propotion`;
  Geom.setCoordinates(rectangles, coordinates);

  Meta.copy(data[1].breaks, scales.x, [`name`]);
  Meta.copy(data[1].breaks$, scales.y, [`name`]);

  Plot.render(plot);
  Plot.renderAxes(plot);
}
