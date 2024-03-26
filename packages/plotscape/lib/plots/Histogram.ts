import { newValueEmitter } from "../ValueEmitter";
import { Dataframe } from "../dataframe/Dataframe";
import { factorBin } from "../factors/factorBin";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { Reducer, sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesXY, newRectanglesXY } from "../representations/RectanglesXY";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { one, zero } from "../variables/constants";

type DataBindings = {
  v1: Continuous;
  v2?: Continuous;
};

type ReducedBindings = {
  binStart: Continuous;
  binMid: Continuous;
  binEnd: Continuous;
  stat1: Continuous;
};

export interface Histogram extends Plot {
  type: Type;
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  bars: RectanglesXY;
}

export function newHistogram<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings,
  options?: { reducer?: Reducer<number, number> }
) {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const anchor = newValueEmitter(data.col(`v1`).min());
  const width = newValueEmitter(data.col(`v1`).range() / 15);

  const toReduce = data.col(`v2`) ?? one;
  const reducer = options?.reducer ?? sumReducer;
  const reducers = { stat1: newReducerHandler(toReduce, reducer) };
  const factor = factorBin(data.col(`v1`), width, anchor);

  const partition1 = newPartition(reducers).refine(factor);
  const partition2 = partition1.refine(scene.marker.factor);

  const partition1Data = partition1.data();
  const partition2Data = partition2.data();

  const type = Type.Absolute;
  const bars = newRectanglesXY(plot);
  const self = { ...plot, type, bars, partition1Data, partition2Data };
  encodeAbs(self);

  self.pushGraphicObject(bars);
  self.scales.y.freezeMin();

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.addKeyAction(`Minus`, () => width.setValue(width.value * (9 / 10)));
  self.addKeyAction(`Equal`, () => width.setValue(width.value * (10 / 9)));

  const inc = data.col(`v1`).range() / 20;
  self.addKeyAction(`Quote`, () => anchor.setValue(anchor.value - inc));
  self.addKeyAction(`Semicolon`, () => anchor.setValue(anchor.value + inc));

  self.addKeyAction(`KeyR`, () => {
    width.defaultize();
    anchor.defaultize();
  });

  partition1Data.listen(`changed`, () => {
    self.trainScales(bars.boundaryData!, (d) => ({ x: d.x0, y: d.y1 }));
    self.scales.x.setName(partition1Data.col(`binMid`).name());
    self.scales.y.setMin(0);
  });

  partition2Data.listen(`changed`, self.render.bind(self));
}

function encodeAbs(self: Histogram) {
  const { partition1Data, partition2Data, bars } = self;

  const boundaryData = partition1Data.select(encodeBoundaryAbs);
  const renderData = partition2Data.select(encodeRenderAbs);

  bars.setBoundaryData(boundaryData);
  bars.setRenderData(renderData);

  self.type = Type.Absolute;
  self.trainScales(boundaryData, (d) => ({ x: d.x0, y: d.y1 }));
  self.scales.x.setName(partition1Data.col(`binMid`).name());
  self.scales.y.setMin(0);
  self.render();
}

function encodePct(self: Histogram) {
  const { partition1Data, partition2Data, bars } = self;

  const boundaryData = partition1Data.select(encodeBoundaryPct);
  const renderData = partition2Data.select(encodeRenderPct);

  boundaryData.col(`x0`).setName(undefined);
  boundaryData.col(`x1`).setName(undefined);

  bars.setBoundaryData(boundaryData);
  bars.setRenderData(renderData);

  self.type = Type.Proportion;
  self.trainScales(boundaryData, (d) => ({ x: d.x0, y: d.y1 }));
  self.scales.x.setName(`cumulative count`);
  self.scales.y.setMin(0);
  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return { x0: d.binStart, y0: zero, x1: d.binEnd, y1: d.stat1 };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return { x0: d.binStart, y0: zero, x1: d.binEnd, y1: d.stat1.stack() };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    aux1: d.binStart, // For query purposes only
    aux2: d.binEnd, // Ditto
    aux3: d.stat1, // Ditto
    x0: d.stat1.stack().shiftLeft(),
    x1: d.stat1.stack(),
    y0: zero,
    y1: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x0: d.stat1.parent().stack().shiftLeft(),
    x1: d.stat1.parent().stack(),
    y0: zero,
    y1: d.stat1.stack!().normalizeByParent(),
  };
};
