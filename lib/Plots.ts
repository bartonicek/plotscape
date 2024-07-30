import { Points } from "./geoms/Points";
import { Getter } from "./Getter";
import { Aggregator, Expanse, Factor, ReactiveData, Scale } from "./main";
import { Plot } from "./Plot";
import { Scene } from "./scene/Scene";
import { LAYER, POSITIONS } from "./utils/symbols";
import { Dataframe, DataLayer } from "./utils/types";

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

    const [x, y, area] = selectfn(scene.data);
    const { scales } = plot;

    Scale.train(scales.x, x, { default: true });
    Scale.train(scales.y, y, { default: true });
    if (area) Scale.train(scales.area, area, { default: true });

    const layer = scene.marker.indices;
    const pos = Getter.computed((i) => [i], x.length);

    const points = Points.of({ x, y, area, [LAYER]: layer, [POSITIONS]: pos });
    Plot.addGeom(plot, points);

    return plot;
  }

  export function bar(data: [any[]] | [any[], number[]]) {
    const category = data[0];
    const value = data[1] ?? Getter.constant(1, category.length);

    const flat = ReactiveData.of(
      { category, value },
      {},
      (d) => Factor.from(d.category),
      (d, f) => ({ sum: Aggregator.aggregate(d.value, f, Aggregator.sum) })
    );

    return flat;
  }
}
