import { identity, square, squareRoot, times } from "utils";
import { newObservableValue } from "../ObservableValue";
import { one } from "../constants";
import { Dataframe } from "../dataframe/Dataframe";
import { factorBin } from "../factors/factorBin";
import { factorProduct } from "../factors/factorProduct";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesXY, newRectanglesXY } from "../representations/RectanglesXY";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
import { Continuous } from "../variables/Continuous";

type DataBindings = {
  v1: Continuous;
  v2: Continuous;
};

type ReducedBindings = {
  binStart: Continuous;
  binEnd: Continuous;
  binStart$: Continuous;
  binEnd$: Continuous;
  binMid: Continuous;
  binMid$: Continuous;
  stat1: Continuous;
};

export interface Histogram2D extends Plot {
  type: Type;
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  squares: RectanglesXY;
}

/**
 * Creates a new 2D histogram and embeds it in a scene.
 * @param scene A scene object
 * @param selectfn A function which selects the variables to plot
 * @returns The newly created 2D histogram
 */
export function newHistogram2D<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const [v1, v2] = [data.col(`v1`), data.col(`v2`)];
  const [range1, range2] = [v1.range(), v2.range()];
  const [min1, min2] = [v1.min(), v2.min()];

  const width1 = newObservableValue(range1 / 30).setName(binName(v1.name()));
  const width2 = newObservableValue(range2 / 30).setName(binName(v1.name()));
  const anchor1 = newObservableValue(min1).setName(anchorName(v1.name()));
  const anchor2 = newObservableValue(min2).setName(anchorName(v2.name()));

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const factor1 = factorBin(v1, width1, anchor1);
  const factor2 = factorBin(v2, width2, anchor2);
  const factor3 = factorProduct(factor1, factor2);

  const partition1 = newPartition(reducers).refine(factor3);
  const partition2 = partition1.refine(scene.marker.factor);

  const partition1Data = partition1.data();
  const partition2Data = partition2.data();

  const type = Type.Absolute;
  const squares = newRectanglesXY(plot);

  const self = { ...plot, type, squares, partition1Data, partition2Data };
  encodeAbs(self);

  self.addGraphicObject(squares);
  self.scales.area.codomain
    .setDefaultMinMax(0, 1)
    .setTransform(square, squareRoot)
    .freeze();

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.addKeyAction(`Minus`, () => {
    width1.set(times(9 / 10));
    width2.set(times(9 / 10));
  });

  self.addKeyAction(`Equal`, () => {
    width1.set(times(10 / 9));
    width2.set(times(10 / 9));
  });

  self.addKeyAction(`KeyR`, () => {
    width1.defaultize();
    width2.defaultize();
  });

  self.addWidgetSource(width1);
  self.addWidgetSource(width2);
  self.addWidgetSource(anchor1);
  self.addWidgetSource(anchor2);

  partition1Data.listen(() => {
    self.trainScales(squares.boundaryData!, (d) => ({
      x: d.x0,
      y: d.y0,
      area: d.area!,
    }));
    self.scales.x.setName(partition1Data.col(`binMid`).name());
    self.scales.area.codomain
      .setDefaultMinMax(0, 1)
      .setTransform(square, squareRoot)
      .freeze();
    self.render();
  });

  partition2Data.listen(self.render.bind(self));

  self.render();
}

function encodeAbs(self: Histogram2D) {
  const { partition1Data, partition2Data, squares } = self;

  const boundaryData = partition1Data.select(encodeBoundaryAbs);
  const renderData = partition2Data.select(encodeRenderAbs);

  squares.setBoundaryData(boundaryData);
  squares.setRenderData(renderData);

  self.type = Type.Absolute;
  self.trainScales(boundaryData, (d) => ({
    x: d.x0,
    y: d.y1,
    area: d.area,
  }));
  self.scales.x.setName(partition1Data.col(`binMid`).name());
  self.scales.y.setName(partition1Data.col(`binMid$`).name());

  self.render();
}

function encodePct(self: Histogram2D) {
  const { partition1Data, partition2Data, squares } = self;

  const boundaryData = partition1Data.select(encodeBoundaryPct);
  const renderData = partition2Data.select(encodeRenderPct);

  squares.setBoundaryData(boundaryData);
  squares.setRenderData(renderData);

  self.type = Type.Absolute;
  self.trainScales(boundaryData, (d) => ({
    x: d.x0,
    y: d.y1,
    area: d.area,
  }));
  self.scales.x.setName(partition1Data.col(`binMid`).name());
  self.scales.y.setName(partition1Data.col(`binMid$`).name());

  self.type = Type.Proportion;
  self.trainScales(boundaryData, identity);
  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return {
    x0: d.binStart.setQueryable(true),
    x1: d.binEnd.setQueryable(true),
    y0: d.binStart$.setQueryable(true),
    y1: d.binEnd$.setQueryable(true),
    area: d.stat1.setQueryable(true),
  };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return {
    x0: d.binStart,
    x1: d.binEnd,
    y0: d.binStart$,
    y1: d.binEnd$,
    area: d.stat1.stack(),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x0: d.binStart.setQueryable(true),
    x1: d.binEnd.setQueryable(true),
    y0: d.binStart$.setQueryable(true),
    y1: d.binEnd$.setQueryable(true),
    area: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x0: d.binStart,
    x1: d.binEnd,
    y0: d.binStart$,
    y1: d.binEnd$,
    area: d.stat1.stack().normalizeByParent(),
  };
};

function binName(name: string) {
  return `Binwidth of ${name}: `;
}

function anchorName(name: string) {
  return `Anchor of ${name}: `;
}
