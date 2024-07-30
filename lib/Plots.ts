import { Points } from "./geoms/Points";
import { Getter } from "./Getter";
import { Aggregator, Factor, ReactiveData, Scale, Scene } from "./main";
import { Plot, PlotType } from "./plot/Plot";
import { LAYER, POSITIONS } from "./utils/symbols";
import { Dataframe } from "./utils/types";

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

    const layer = scene.marker.indices;
    const pos = Getter.computed((i) => [i], x.length);

    const points = Points.of({ x, y, area, [LAYER]: layer, [POSITIONS]: pos });
    Plot.addGeom(plot, points);

    return plot;
  }

  export function bar<T extends Dataframe>(
    scene: Scene<T>,
    selectfn: (data: T) => [any[]] | [any[], number[]]
  ) {
    const { data, marker } = scene;
    const [category, _values] = selectfn(data);
    const values = _values ?? Array(category.length).fill(1);

    const factor1 = Factor.from(category);
    const factor2 = Factor.product(factor1, marker.factor);
    const factors = [factor1, factor2];

    function aggregatefn(data: { values: number[] }, factor: Factor) {
      return {
        stat1: Aggregator.aggregate(data.values, factor, Aggregator.sum),
      };
    }

    const reactiveData = ReactiveData.of({ values }, aggregatefn, ...factors);

    return reactiveData;
  }
}
