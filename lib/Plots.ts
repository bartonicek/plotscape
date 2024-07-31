import { Reduced } from "./aggregation/Reduced";
import { Summaries } from "./aggregation/Summaries";
import { Points } from "./geoms/Points";
import { Getter } from "./Getter";
import { Factor, Reducer, Scale, Scene } from "./main";
import { Plot, PlotType } from "./plot/Plot";
import { Marker } from "./scene/Marker";
import { LAYER, POSITIONS } from "./utils/symbols";
import { Dataframe, Indexable } from "./utils/types";

export namespace Plots {
  export enum Type {
    scatter = "scatter",
    bar = "bar",
  }

  export function scatter<T extends Dataframe>(
    scene: Scene<T>,
    selectfn: (data: T) => [any[], any[]] | [any[], any[], any[]]
  ) {
    const plot = Plot.of();
    plot.type = PlotType.scatter;

    const [x, y, area] = selectfn(scene.data);
    const { scales } = plot;

    Scale.train(scales.x, x, { default: true });
    Scale.train(scales.y, y, { default: true });
    if (area) Scale.train(scales.area, area, { default: true });

    const { marker } = scene;

    const layer = Marker.getLayer(marker);
    const pos = Getter.computed((i) => [i]);

    const data = { x, y, area, [LAYER]: layer, [POSITIONS]: pos };

    const points = Points.of({ flat: data, grouped: data });
    Plot.addGeom(plot, points);

    return plot;
  }

  export function bar<T extends Dataframe>(
    scene: Scene<T>,
    selectfn: (data: T) => [any[]] | [any[], number[]]
  ) {
    const { data, marker } = scene;

    let [category, values] = selectfn(data) as [any[], Indexable<number>];
    values = values ?? Getter.constant(1);

    const factor1 = Factor.from(category);
    const factor2 = Factor.product(factor1, marker.factor);
    const factors = [factor1, factor2] as const;

    const summaries = Summaries.of({ stat: [values, Reducer.sum] }, factors);
    const coordinates = Summaries.translate(summaries, [
      (d) => ({
        x: d.label,
        y: Getter.constant(0),
        height: d.stat,
        width: Getter.constant(1),
      }),
      (d) => ({
        x: d.label,
        y: Getter.constant(0),
        height: Reduced.stack(d.stat),
        width: Getter.constant(1),
      }),
    ]);

    return coordinates;
  }
}