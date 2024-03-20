import { Scene } from "../Scene";
import { factorFrom } from "../factors/factorFrom";
import { factorProduct } from "../factors/factorProduct";
import { Plot, newPlot } from "../plot/Plot";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { newReducerSet } from "../reducers/ReducerSet";
import { newBars } from "../representations/Bars";
import { Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";
import { one, zero } from "../variables/constants";

type DataBindings = {
  v1: Discrete;
  v2?: Continuous;
};

export interface Barplot extends Plot {}

export function newBarplot<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);

  const data = scene.data.select(selectfn);

  const factor1 = factorFrom(data.col(`v1`));
  const factor2 = factorProduct(factor1, scene.marker.factor);

  const encodefn1 = (d: { label: Discrete; stat1: Continuous }) => {
    return { x: d.label, y0: zero, y1: d.stat1 };
  };

  const encodefn2 = (d: { label: Discrete; stat1: Continuous }) => {
    return { x: d.label, y0: zero, y1: d.stat1.stack!() };
  };

  const reducers = { stat1: newReducerHandler(one, sumReducer) };

  const partition1 = newReducerSet(reducers).refine(factor1);
  const partition2 = partition1.refine(scene.marker.factor);

  const boundaryData = partition1.data().select(encodefn1);
  const renderData = partition2.data().select(encodefn2);

  const bars = newBars(boundaryData, renderData, plot.scales);

  plot.trainScales(boundaryData);
  plot.scales.y.domain.setMin!(0);
  plot.pushGraphicObject(bars);

  boundaryData.listen(`changed`, plot.render.bind(plot));
  renderData.listen(`changed`, plot.render.bind(plot));

  renderData.listen(`changed`, () => {
    // console.log(renderData.col(`y1`).reducer);
  });
}
