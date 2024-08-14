import { Rectangles } from "../geoms/Rectangles";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { minmax, one, zero } from "../utils/funs";
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
  breaks: number[];
  stat: Reduced<number>;
};

interface Histogram extends Plot {
  representation: Representation;
  summaries: readonly [Dataframe, Summary, Summary];
  coordinates: Dataframe[];
  rectangles?: Rectangles;
}

export function Histogram<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [number[]] | [number[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
) {
  const { data, marker } = scene;

  let [binned, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? [...vals] : () => 1;

  const [min, max] = minmax(binned);
  const range = max - min;

  const pars = Reactive.of({ anchor: min, width: range / 15 });

  const factor0 = Factor.mono(binned.length);
  const factor1 = Factor.product(factor0, Factor.bin(binned, pars));
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor0, factor1, factor2] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const summaries = Summaries.of(
    { stat: [values, reducer], ...queries },
    factors,
  );

  const representation = Representation.Absolute;
  const coordinates = [] as (Dataframe & Reactive)[];
  const opts = { type: Plot.Type.Histo } as const;
  const plot = { representation, ...Plot.of(opts), summaries, coordinates };

  Plot.listen(plot, `n`, () => switchRepresentation(plot));

  const inc = range / 10;
  Plot.listen(plot, `=`, () => Reactive.set(pars, (p) => (p.width *= 10 / 9)));
  Plot.listen(plot, `-`, () => Reactive.set(pars, (p) => (p.width *= 9 / 10)));
  Plot.listen(plot, `'`, () => Reactive.set(pars, (p) => (p.anchor += inc)));
  Plot.listen(plot, `;`, () => Reactive.set(pars, (p) => (p.anchor -= inc)));

  Plot.listen(plot, `r`, () => {
    Reactive.set(pars, (p) => ((p.anchor = min), (p.width = range / 15)));
  });

  histogram(plot);
  Plot.addGeom(plot, Rectangles.of());

  return plot;
}

function switchRepresentation(plot: Histogram) {
  if (plot.representation === Representation.Absolute) spinogram(plot);
  else histogram(plot);
}

function histogram(plot: Histogram) {
  const { summaries } = plot;
  const coordinates = Summaries.translate(summaries, [
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

  for (const c of plot.data) {
    Reactive.removeListeners(c as any, `changed`);
  }

  Reactive.listen(flat as any, `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, ratio: true });
  });

  Expanse.freeze(scales.y.domain, [`zero`]);

  Meta.setName(scales.x, Meta.getName(summaries[1].breaks));
  Meta.setName(scales.y, Meta.getName(flat.y1));

  plot.representation = Representation.Absolute;
  Plot.setData(plot, coordinates);

  Plot.dispatch(plot, `render`);
  Plot.dispatch(plot, `render-axes`);
}

function spinogram(plot: Histogram) {
  const { summaries } = plot;

  const coordinates = Summaries.translate(summaries, [
    (d) => d,
    (d) => ({
      x0: Reduced.shiftLeft(Reduced.stack(d.stat)),
      y0: zero,
      x1: Reduced.stack(d.stat),
      y1: one,
      query1: d.binMin,
      query2: d.binMax,
    }),
    (d) => {
      return {
        x0: Reduced.shiftLeft(Reduced.stack(Reduced.parent(d.stat))),
        y0: zero,
        x1: Reduced.stack(Reduced.parent(d.stat)),
        y1: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
      };
    },
  ]);

  const { scales } = plot;
  const [, flat] = coordinates;

  Scale.train(scales.x, [0, ...flat.x1], { default: true, name: false });
  Scale.train(scales.y, [0, 1], { default: true, ratio: true });

  Reactive.listen(flat as any, `changed`, () => {
    Scale.train(scales.x, [0, ...flat.x1], { default: true, name: false });
  });

  Expanse.freeze(scales.y.domain, [`zero`]);

  Meta.setName(scales.x, `cumulative count`);
  Meta.setName(scales.y, `proportion`);

  Plot.setData(plot, coordinates);
  plot.representation = Representation.Proportion;

  Plot.dispatch(plot, `render`);
  Plot.dispatch(plot, `render-axes`);
}
