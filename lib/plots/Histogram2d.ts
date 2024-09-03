import { Rectangles } from "../geoms/Rectangles";
import { Expanse } from "../main";
import { Plot } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { minmax, one } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns, Dataframe } from "../utils/types";

enum Representation {
  Absolute,
  Proportion,
}

type Summary = {
  binMin: number[];
  binMax: number[];
  binMin$: number[];
  binMax$: number[];
  breaks: number[];
  breaks$: number[];
  stat: Reduced<number>;
};

interface Histogram2D extends Plot {
  representation: Representation;
  summaries: readonly [Summary, Summary];
  coordinates: Dataframe[];
  rectangles?: Rectangles;
}

export function Histogram2d<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [number[], number[]] | [number[], number[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    ratio?: number;
    queries?: (data: T) => [any[], Reducer][];
  },
) {
  const { data, marker } = scene;

  let [binned1, binned2, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? vals : () => 1;

  const [min1, max1] = minmax(binned1);
  const [min2, max2] = minmax(binned2);
  const [range1, range2] = [max1 - min1, max2 - min2];

  const pars1 = Reactive.of2()({ anchor: min1, width: range1 / 15 });
  const pars2 = Reactive.of2()({ anchor: min2, width: range2 / 15 });

  const factor1 = Factor.bin(binned1, pars1);
  const factor2 = Factor.bin(binned2, pars2);
  const factor3 = Factor.product(factor1, factor2);
  const factor4 = Factor.product(factor3, marker.factor);
  const factors = [factor3, factor4] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const summaries = Summaries.of(
    { stat: [values, reducer], ...queries },
    factors,
  );

  const representation = Representation.Absolute;
  const coordinates = [] as (Dataframe & Reactive)[];
  const opts = { type: `histo2d`, ratio: options?.ratio } as const;
  const plot = { representation, ...Plot.of(opts), summaries, coordinates };

  Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  Reactive.listen(plot, `grow`, () => {
    Reactive.set(pars1, (p) => (p.width *= 10 / 9));
    Reactive.set(pars2, (p) => (p.width *= 10 / 9));
  });

  Reactive.listen(plot, `shrink`, () => {
    Reactive.set(pars1, (p) => (p.width *= 9 / 10));
    Reactive.set(pars2, (p) => (p.width *= 9 / 10));
  });

  Reactive.listen(plot, `reset`, () => {
    Reactive.set(pars1, (p) => ((p.anchor = min1), (p.width = range1 / 15)));
    Reactive.set(pars2, (p) => ((p.anchor = min2), (p.width = range2 / 15)));
  });

  histogram2d(plot);
  Plot.addGeom(plot, Rectangles.of());

  return plot as unknown as Plot;
}

function switchRepresentation(plot: any) {
  if (plot.representation === Representation.Absolute) spinogram2d(plot);
  else histogram2d(plot);
}

function histogram2d(plot: Histogram2D) {
  const { summaries } = plot;
  const coordinates = Summaries.translate(summaries, [
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

  Scale.train(scales.x, flat.x1, { default: true });
  Scale.train(scales.y, flat.y1, { default: true });
  Scale.train(scales.area, flat.area, { default: true });

  Expanse.set(scales.area.codomain, (e) => ((e.min = 0), (e.max = 1)), {
    default: true,
  });
  Expanse.freeze(scales.area.codomain, [`min`, `max`]);

  for (const c of plot.data) {
    Reactive.removeAll(c as any, `changed`);
  }

  Reactive.listen(flat as any, `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, name: false });
    Scale.train(scales.area, flat.area, { default: true });
  });

  plot.representation = Representation.Absolute;
  Plot.setData(plot, coordinates);

  Meta.copy(scales.x, summaries[1].breaks, [`name`]);
  Meta.copy(scales.y, summaries[1].breaks$, [`name`]);

  Plot.render(plot);
  Plot.renderAxes(plot);
}

function spinogram2d(plot: Histogram2D) {
  const { summaries } = plot;
  const coordinates = Summaries.translate(summaries, [
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

  Scale.train(scales.x, flat.x1, { default: true });
  Scale.train(scales.y, flat.y1, { default: true });
  Scale.train(scales.area, [0, 1], { default: true });

  Expanse.set(scales.area.codomain, (e) => ((e.min = 0), (e.max = 1)), {
    default: true,
  });
  Expanse.freeze(scales.area.codomain, [`min`, `max`]);

  for (const c of plot.data) {
    Reactive.removeAll(c as any, `changed`);
  }

  Reactive.listen(flat as any, `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, name: false });
  });

  plot.representation = Representation.Proportion;
  Plot.setData(plot, coordinates);

  Meta.copy(scales.x, summaries[1].breaks, [`name`]);
  Meta.copy(scales.y, summaries[1].breaks$, [`name`]);

  Plot.render(plot);
  Plot.renderAxes(plot);
}
