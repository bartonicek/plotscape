import { Scene } from "../Scene";
import { factorFrom } from "../factors/factorFrom";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { newRectanglesWH } from "../representations/RectanglesWH";
import { Variables, VerticalAnchor } from "../types";
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

export interface Barplot extends Plot {
  boundaryData: ReducedBindings;
  renderData: ReducedBindings;
}

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

  const boundaryData = partition1.data().select(encodeBoundaryAbs);
  const renderData = partition2.data().select(encodeRenderAbs);

  const bars = newRectanglesWH(plot, boundaryData, renderData);
  bars.setVAnchor(VerticalAnchor.Bottom);
  plot.pushGraphicObject(bars);

  plot.trainScales(boundaryData, (d) => ({ ...d, y: d.height }));
  plot.scales.y.setMin(0).freezeMin().link(plot.scales.height);

  boundaryData.listen(`changed`, plot.render.bind(plot));
  renderData.listen(`changed`, plot.render.bind(plot));
  plot.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.label.width(),
    height: d.stat1,
  };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.label.width(),
    height: d.stat1.stack!(),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.label.width(),
    height: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.label.width(),
    height: d.stat1.stack!().normalizeByParent!(),
  };
};

function switchRepresentation(this: Barplot) {}
