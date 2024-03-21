import { Scene } from "../Scene";
import { newValueEmitter } from "../ValueEmitter";
import { factorBin } from "../factors/factorBin";
import { newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { newRectanglesXY } from "../representations/RectanglesXY";
import { Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { one, zero } from "../variables/constants";

type DataBindings = {
  v1: Continuous;
  v2?: Continuous;
};

type ReducedBindings = {
  binStart: Continuous;
  binEnd: Continuous;
  stat1: Continuous;
};

export function newHistogram<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const anchor = newValueEmitter(data.col(`v1`).min());
  const width = newValueEmitter(data.col(`v1`).range() / 15);

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const factor = factorBin(data.col(`v1`), width, anchor);

  const partition1 = newPartition(reducers).refine(factor);
  const partition2 = partition1.refine(scene.marker.factor);

  const boundaryData = partition1.data().select(encodeBoundaryAbs);
  const renderData = partition2.data().select(encodeRenderAbs);

  const bars = newRectanglesXY(plot, boundaryData, renderData);
  plot.pushGraphicObject(bars);

  plot.trainScales(boundaryData, (d) => ({ x: d.x0, y: d.y1 }));
  plot.scales.y.setMin(0).freezeMin();

  plot.addKeyAction(`Minus`, () => width.setValue(width.value * (10 / 11)));
  plot.addKeyAction(`Equal`, () => width.setValue(width.value * (11 / 10)));
  plot.addKeyAction(`Quote`, () => anchor.setValue(anchor.value - 0.1));
  plot.addKeyAction(`Semicolon`, () => anchor.setValue(anchor.value + 0.1));
  plot.addKeyAction(`KeyR`, () => {
    width.defaultize();
    anchor.defaultize();
  });

  boundaryData.listen(`changed`, () => {
    plot.trainScales(boundaryData, (d) => ({ x: d.x0, y: d.y1 }));
    plot.scales.y.setMin(0).freezeMin();
    plot.render();
  });

  renderData.listen(`changed`, plot.render.bind(plot));
  plot.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return { x0: d.binStart, y0: zero, x1: d.binEnd, y1: d.stat1 };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return { x0: d.binStart, y0: zero, x1: d.binEnd, y1: d.stat1.stack!() };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x0: d.binStart,
    y0: zero,
    x1: d.binEnd,
    y1: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x0: d.binStart,
    y0: zero,
    x1: d.binEnd,
    y1: d.stat1.stack!().normalizeByParent!(),
  };
};
