import { one, zero } from "../constants";
import { Dataframe } from "../dataframe/Dataframe";
import { factorBin } from "../factors/factorBin";
import { newObservableValue } from "../mixins/ObservableValue";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { Reducer, sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesXY, newRectanglesXY } from "../representations/RectanglesXY";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
import { Continuous } from "../variables/Continuous";

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

export namespace Histogram {
  export const from = newHistogram;
}

/**
 * Creates a new histogram and embeds it in a scene. Can switch representation into a spinogram.
 * @param scene A scene object
 * @param selectfn A function which selects the variables to plot
 * @returns The newly created histogram
 */
export function newHistogram<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings,
  options?: { reducer?: Reducer<number, number> }
): Histogram {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const [min, range] = [data.col(`v1`).min(), data.col(`v1`).range()];
  const anchor = newObservableValue(min).setName(`Anchor: `);
  const width = newObservableValue(range / 15).setName(`Binwidth: `);

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

  self.addGraphicObject(bars);

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.addKeyAction(`Minus`, () => width.set((w) => w * (9 / 10)));
  self.addKeyAction(`Equal`, () => width.set((w) => w * (10 / 9)));

  const inc = data.col(`v1`).range() / 20;
  self.addKeyAction(`Quote`, () => anchor.set((a) => a - inc));
  self.addKeyAction(`Semicolon`, () => anchor.set((a) => a + inc));

  self.addKeyAction(`KeyR`, () => (width.defaultize(), anchor.defaultize()));

  self.addWidgetSource(width);
  self.addWidgetSource(anchor);

  partition1Data.listen(() => {
    self.trainScales(bars.boundaryData!, (d) => ({ x: d.x0, y: d.y1 }));
    self.scales.x.setName(partition1Data.col(`binMid`).name());
    self.scales.y.setMin(0).freezeZero();
  });

  partition2Data.listen(self.render.bind(self));
  self.render();

  return self;
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
  self.scales.y.setMin(0).freezeZero();

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

  const reducerName = self.scales.y.name();
  let yName = `proportion`;
  if (reducerName != `count`) yName += `of ${reducerName}`;

  self.scales.y.setMin(0).freezeZero().setName(yName);

  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return {
    x0: d.binStart.setQueryable(true),
    x1: d.binEnd.setQueryable(true),
    y0: zero,
    y1: d.stat1,
  };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return {
    x0: d.binStart,
    x1: d.binEnd,
    y0: zero,
    y1: d.stat1.stack(),
    q1: d.stat1.setQueryable(true),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x0: d.stat1.stack().shiftLeft(),
    x1: d.stat1.stack(),
    y0: zero,
    y1: one,
    q1: d.binStart.setQueryable(true), // For query purposes only
    q2: d.binEnd.setQueryable(true), // Ditto
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x0: d.stat1.parent().stack().shiftLeft(),
    x1: d.stat1.parent().stack(),
    y0: zero,
    y1: d.stat1.stack!().normalizeByParent(),
    q1: d.stat1.setQueryable(true),
  };
};
