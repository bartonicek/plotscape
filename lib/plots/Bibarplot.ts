import { Bars } from "../geoms/Bars";
import { Geom } from "../geoms/Geom";
import { Plot } from "../plot/Plot";
import { Expanse } from "../scales/Expanse";
import { ExpanseBand } from "../scales/ExpanseBand";
import { Scale } from "../scales/Scale";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Reduced } from "../transformation/Reduced";
import { Reducer } from "../transformation/Reducer";
import { Summaries } from "../transformation/Summaries";
import { identity, one, orderIndices, zero } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns, Indexable } from "../utils/types";

interface Coordinates extends Reactive {
  x: Indexable;
  y: Indexable;
  width: Indexable;
  height: Indexable;
}

export interface Bibarplot extends Plot {
  scales: InferScales<{
    x: [`band`, `continuous`];
    heightUp: [`continuous`, `continuous`];
    heightDown: [`continuous`, `continuous`];
  }>;
  data: readonly [
    { label: string[]; stat1: Reduced<number>; stat2: Reduced<number> },
    { label: string[]; stat1: Reduced<number>; stat2: Reduced<number> },
  ];
  bars1: Bars;
  bars2: Bars;
}

export function Bibarplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => [any[], number[]] | [any[], number[], number[]],
  options?: Plot.Options & {
    reducer?: Reducer<number, number>;
    queries?: (data: T) => [any[], Reducer][];
  },
): Bibarplot {
  const { data, marker } = scene;

  let [cat, vals1, vals2] = selectfn(data);
  const reducer1 = Reducer.sum;
  const reducer2 = Reducer.sum;

  const values1 = vals2 ? vals1 : () => 1;
  const values2 = vals2 ? vals2 : vals1;

  const factor1 = Factor.from(cat);
  const factor2 = Factor.product(factor1, marker.factor);
  const factors = [factor1, factor2] as const;

  const queries = options?.queries ? options.queries(data) : {};
  const stat1 = [values1, reducer1] as const;
  const stat2 = [values2, reducer2] as const;
  const plotData = Summaries.of({ stat1, stat2, ...queries }, factors);

  const scales = Scales.of({
    x: [`band`, `continuous`],
    heightUp: [`continuous`, `continuous`],
    heightDown: [`continuous`, `continuous`],
  });

  const opts = { type: `bar`, representation: `absolute` } as const;

  const bars1Scales = { ...scales, height: scales.heightUp };
  const bars2Scales = { ...scales, height: scales.heightDown };
  const bars1 = Bars.of([] as Coordinates[], bars1Scales);
  const bars2 = Bars.of([] as Coordinates[], bars2Scales);

  const bars = { bars1, bars2 };

  const plot = Object.assign(Plot.of(plotData, scales, opts), bars);
  barplot(plot);
  Plot.addGeom(plot, bars1);
  Plot.addGeom(plot, bars2);

  Scale.shareCodomain(scales.height, scales.heightUp);
  Scale.shareCodomain(scales.height, scales.heightDown);
  Scale.set(scales.heightUp, () => ({ one: 0.4 }), { default: true });
  Scale.set(scales.heightDown, () => ({ one: -0.4 }), { default: true });
  Expanse.set(scales.height.codomain, () => ({ inv: identity }), {
    default: true,
  });

  // Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  return plot;
}

function sortAxis(domain: ExpanseBand, values: number[]) {
  if (!domain.props.ordered) {
    const indices = orderIndices(values);
    ExpanseBand.reorder(domain, indices);
  } else ExpanseBand.reorder(domain);
}

// function switchRepresentation(plot: Bibarplot) {
//   //   if (plot.representation === `absolute`) spineplot(plot);
//   //   else barplot(plot);
// }

function barplot(plot: Bibarplot) {
  const { data, scales, bars1, bars2 } = plot;

  const coordinates1 = Summaries.translate(data, [
    (d) => ({ x: d.label, y: zero, height: d.stat1, width: one }),
    (d) => ({
      x: d.label,
      y: zero,
      height: Reduced.stack(d.stat1),
      width: one,
    }),
  ]);

  const coordinates2 = Summaries.translate(data, [
    (d) => ({ x: d.label, y: zero, height: d.stat2, width: one }),
    (d) => ({
      x: d.label,
      y: zero,
      height: Reduced.stack(d.stat2),
      width: one,
    }),
  ]);

  const [flat1] = coordinates1;
  const opts = { default: true, ratio: true };

  const { stat1, stat2 } = data[0];
  const max1 = Math.max(...stat1);
  const max2 = Math.max(...stat2);

  Scale.train(scales.x, flat1.x, opts);
  Scale.train(scales.y, [-1, 1], { default: true, ratio: false });
  Scale.train(scales.width, [0, 1], opts);
  Scale.train(scales.heightUp, [0, max1], opts);
  Scale.train(scales.heightDown, [0, max2], opts);

  console.log(scales.heightDown.codomain.props);
  console.log(Scale.pushforward(scales.heightDown, 1));

  ExpanseBand.setWeights(scales.x.domain);

  const [s1name, s2name] = [stat1, stat2].map((x) => Meta.get(x, `name`));
  Meta.set(scales.y, { name: `${s2name} / ${s1name}` });

  const k = 1 / new Set(flat1.x).size;
  const widthProps = { scale: k, mult: 0.9, offset: 0 };
  Expanse.set(scales.width.codomain, () => widthProps, { default: true });

  Reactive.removeAll(plot, `reorder`);
  Reactive.listen(plot, `reorder`, () =>
    sortAxis(scales.x.domain, flat1.height),
  );

  Geom.setCoordinates(bars1, coordinates1);
  Geom.setCoordinates(bars2, coordinates2);

  plot.representation = `absolute`;
  Plot.render(plot);
  Plot.renderAxes(plot);

  return plot;
}

// function spineplot(plot: Barplot) {
//   const { data, scales, bars } = plot;
//   const coordinates = Summaries.translate(data, [
//     (d) => ({ x: d.label, y: zero, height: one, width: d.stat }),
//     (d) => ({
//       x: d.label,
//       y: zero,
//       height: Reduced.normalize(Reduced.stack(d.stat), (x, y) => x / y),
//       width: Reduced.parent(d.stat),
//     }),
//   ]);

//   const [flat] = coordinates;
//   const opts = { default: true, ratio: true };

//   Scale.train(scales.x, flat.x, opts);
//   Scale.train(scales.y, [0, 1], opts);
//   Scale.train(scales.width, cumsum(flat.width), opts);
//   Scale.train(scales.height, [0, 1], opts);

//   Scale.freeze(scales.y, [`zero`]);
//   Scale.freeze(scales.height, [`zero`]);
//   ExpanseBand.setWeights(scales.x.domain, flat.width);

//   Scale.link(scales.y, scales.height);
//   const widthProps = { scale: 1, mult: 1, offset: -1 };
//   Expanse.set(scales.width.codomain, () => widthProps, { default: true });

//   Meta.set(scales.y, { name: `proportion` });

//   Reactive.removeAll(plot, `reorder`);
//   Reactive.listen(plot, `reorder`, () => sortAxis(scales.x.domain, flat.width));

//   Geom.setCoordinates(bars, coordinates);

//   plot.representation = `propotion`;
//   Plot.render(plot);
//   Plot.renderAxes(plot);
// }
