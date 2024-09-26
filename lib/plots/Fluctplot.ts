import { Bars } from "../geoms/Bars";
import { Geom } from "../geoms/Geom";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { max, one } from "../utils/funs";
import { Reactive } from "../utils/Reactive";
import { Columns, Indexable, VAnchor } from "../utils/types";

interface Summaries {
  label: string[];
  label$: string[];
  stat: Reduced<number>;
}

interface Coordinates extends Reactive {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
}

interface Fluctplot extends Plot {
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
  options?: {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
) {
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

  const props = { type: `fluct`, representation: `absolute` } as const;
  const bars = Bars.of([] as Coordinates[], scales, {
    vAnchor: VAnchor.Middle,
  });
  const plot = Object.assign(Plot.of(plotData, scales, props), { bars });

  Scale.shareCodomain(scales.area, scales.width);
  Scale.shareCodomain(scales.area, scales.height);

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

  const widthProps = { scale: 1 / k, mult: 0.9, offset: 0 };
  Expanse.set(scales.area.codomain, () => widthProps, { default: true });

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

  const widthProps = { scale: 1 / k, mult: 0.9, offset: -1 };
  Expanse.set(scales.area.codomain, () => widthProps, { default: true });

  Geom.setCoordinates(bars, coordinates);
  plot.representation = `propotion`;

  Plot.render(plot);
}
