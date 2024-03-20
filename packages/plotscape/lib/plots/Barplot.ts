import { noopThis } from "utils";
import { Scene } from "../Scene";
import { factorFrom } from "../factors/factorFrom";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { newBars } from "../representations/Bars";
import { Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";
import { one, zero } from "../variables/constants";

type DataBindings = {
  v1: Discrete;
  v2?: Continuous;
};

type ReducedBindings = {
  label: Discrete;
  stat1: Continuous;
};

export interface Barplot extends Plot {}

export function newBarplot<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);

  const data = scene.data.select(selectfn);

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const factor = factorFrom(data.col(`v1`));

  const partition1 = newPartition(reducers).refine(factor);
  const partition2 = partition1.refine(scene.marker.factor);

  const boundaryData = partition1.data().select(encodefn1);
  const renderData = partition2.data().select(encodefn2);

  const bars = newBars(boundaryData, renderData, plot.scales);

  plot.trainScales(boundaryData);
  plot.scales.y.domain.setMin!(0);
  plot.scales.y.norm.setMin = noopThis;
  plot.pushGraphicObject(bars);

  boundaryData.listen(`changed`, plot.render.bind(plot));
  renderData.listen(`changed`, plot.render.bind(plot));
}

const encodefn1 = (d: ReducedBindings) => {
  return { x: d.label, y0: zero, y1: one };
};

const encodefn2 = (d: ReducedBindings) => {
  return { x: d.label, y0: zero, y1: d.stat1.stack!().normalizeByParent!() };
};
