import { Lines } from "../geoms/Lines";
import { Scale } from "../main";
import { Plot } from "../plot/Plot";
import { ExpanseCompound } from "../scales/ExpanseCompound";
import { ExpansePoint } from "../scales/ExpansePoint";
import { ExpanseSplit } from "../scales/ExpanseSplit";
import { inferExpanse } from "../scales/inferExpanse";
import { InferScales, Scales } from "../scales/Scales";
import { Scene } from "../scene/Scene";
import { Factor } from "../transformation/Factor";
import { Summaries } from "../transformation/Summaries";
import { Getter } from "../utils/Getter";
import { Metadata } from "../utils/Metadata";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";

export interface Pcoordsplot extends Plot {
  scales: InferScales<{
    x: [`split`, `split`];
    y: [`compound`, `split`];
  }>;
  data: readonly [any, any];
  lines: Lines;
}

export function Pcoordsplot<T extends Columns>(
  scene: Scene<T>,
  selectfn: (data: T) => number[][],
  options?: Plot.Options & { queries?: (data: T) => any[][] },
): Pcoordsplot {
  const { data, marker } = scene;

  const vars = selectfn(data);
  const names = vars.map((x) => Metadata.get(x, `name`)) as string[];

  const x = Getter.constant(names);
  const y = Getter.multi(vars);
  const queries = options?.queries ? options.queries(data) : {};

  const factor1 = Factor.bijection(vars[0].length, { x, y, ...queries });
  const factor2 = Factor.product(factor1, marker.factor);
  const plotData = Summaries.of({}, [factor1, factor2] as const);

  const scales = Scales.of({
    x: [`split`, `split`],
    y: [`compound`, `split`],
  });
  const coordinates = Summaries.translate(plotData, [(d) => d, (d) => d]);
  const lines = Lines.of(coordinates, scales);
  const [type, representation] = [`pcoords`, `proportion`] as const;
  const plotOpts: Plot.Options = { ...options, type, representation };

  const plot = Object.assign(Plot.of(plotData, scales, plotOpts), { lines });
  Plot.addGeom(plot, lines);

  const domains = vars.map((x) => inferExpanse(x));
  Scale.setDomain(scales.x, ExpanseSplit.of(ExpansePoint.of(names)));
  Scale.setDomain(scales.y, ExpanseCompound.of(domains));

  Metadata.set(scales.x, { name: `variable` });
  Metadata.set(scales.y, { name: `value` });

  Reactive.listen(plot, `normalize`, () => switchRepresentation(plot));

  return plot;
}

function switchRepresentation(plot: Pcoordsplot) {
  if (plot.representation === `proportion`) {
    ExpanseCompound.setCommonScale(plot.scales.y.domain, true);
    plot.representation = `absolute`;
  } else {
    ExpanseCompound.setCommonScale(plot.scales.y.domain, false);
    plot.representation = `proportion`;
  }

  Plot.renderAxes(plot); // For some reason one render doesn't work
}
