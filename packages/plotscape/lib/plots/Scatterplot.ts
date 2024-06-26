import { oneRowOneCase } from "../constants";
import { Plot, newPlot } from "../plot/Plot";
import { newPoints } from "../representations/Points";
import { Scene } from "../scene/Scene";
import { Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";

type DataBindings = {
  v1: Continuous | Discrete;
  v2: Continuous | Discrete;
  v3?: Continuous;
};

export interface Scatterplot extends Plot {}

export namespace Scatterplot {
  export const from = newScatter;
}

/**
 * Creates a new scatterplot and embeds it in a scene.
 * @param scene A scene object
 * @param selectfn A function which selects variables to plot
 * @returns The newly created scatterplot
 */
export function newScatter<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
): Scatterplot {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn).clone();

  const boundaryData = data.select(encodefn).join(oneRowOneCase);
  const renderData = data.select(encodefn).join(scene.marker.data());
  const points = newPoints(plot, boundaryData, renderData);

  plot.addGraphicObject(points);
  plot.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y, size: d.size }));

  renderData.listen(plot.render.bind(plot));

  const self = { ...plot, ...{ data, points, renderData, boundaryData } };
  return self;
}

const encodefn = (d: DataBindings) => ({
  x: d.v1.setQueryable(true),
  y: d.v2.setQueryable(true),
  size: d.v3?.setQueryable(true),
});
