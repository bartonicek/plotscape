import { Rectangles } from "../geoms/Rectangles";
import { Expanse } from "../main";
import { Plot } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { minmax, zero } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";

export function Histogram<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [number[]] | [number[], number[]],
  options?: {
    reducer?: Reducer<number, number>;
    queries?: [(data: T) => any[], Reducer][];
  },
) {
  const { data, marker } = scene;
  const plot = Plot.of({ type: Plot.Type.Histo });

  let [binned, vals] = selectfn(data);
  const reducer = vals && options?.reducer ? options.reducer : Reducer.sum;
  const values = vals ? [...vals] : () => 1;

  if (!Meta.hasName(values)) Meta.setName(values, `count`);
  else Meta.setName(values, `${reducer.name} of ${Meta.getName(values)}`);

  const [min, max] = minmax(binned);
  const range = max - min;
  const pars = Reactive.of({ anchor: min, width: range / 15 });
  Plot.listen(plot, `=`, () => Reactive.set(pars, (p) => (p.width *= 10 / 9)));
  Plot.listen(plot, `-`, () => Reactive.set(pars, (p) => (p.width *= 9 / 10)));
  Plot.listen(plot, `'`, () =>
    Reactive.set(pars, (p) => (p.anchor += range / 10)),
  );
  Plot.listen(plot, `;`, () =>
    Reactive.set(pars, (p) => (p.anchor -= range / 10)),
  );

  Plot.listen(plot, `r`, () => {
    Reactive.set(pars, (p) => {
      p.anchor = min;
      p.width = range / 15;
    });
    Plot.dispatch(plot, `render`);
  });

  const factor1 = Factor.bin(binned, pars);
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const qs = Summaries.formatQueries(options?.queries ?? [], data);

  const summaries = Summaries.of({ stat: [values, reducer], ...qs }, factors);
  const coordinates = Summaries.translate(summaries, [
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
  const [flat, grouped] = coordinates;

  Scale.train(scales.x, flat.x1, { default: true, name: false });
  Scale.train(scales.y, flat.y1, { default: true, ratio: true });

  Reactive.listen(flat as any, `changed`, () => {
    Scale.train(scales.x, flat.x1, { default: true, name: false });
    Scale.train(scales.y, flat.y1, { default: true, ratio: true });
  });

  Expanse.freeze(scales.y.domain, [`zero`]);

  Meta.setName(scales.x, Meta.getName(binned));
  Meta.setName(scales.y, Meta.getName(values));

  const rectangles = Rectangles.of({ flat, grouped });
  Plot.addGeom(plot, rectangles);

  const histogram = { ...plot, summaries, coordinates };
  return histogram;
}
