import { identity, square, squareRoot } from "utils";
import { newValueEmitter } from "../ValueEmitter";
import { Dataframe } from "../dataframe/Dataframe";
import { factorBin } from "../factors/factorBin";
import { factorProduct } from "../factors/factorProduct";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesWH, newRectanglesWH } from "../representations/RectanglesWH";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { one } from "../variables/constants";

type DataBindings = {
  v1: Continuous;
  v2: Continuous;
};

type ReducedBindings = {
  binMid: Continuous;
  binMid$: Continuous;
  stat1: Continuous;
};

export interface Histogram2D extends Plot {
  type: Type;
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  squares: RectanglesWH;
}

export function newHistogram2D<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const width1 = newValueEmitter(data.col(`v1`).range() / 15);
  const width2 = newValueEmitter(data.col(`v2`).range() / 15);

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const factor1 = factorBin(data.col(`v1`), width1, data.col(`v1`).min());
  const factor2 = factorBin(data.col(`v2`), width2, data.col(`v2`).min());
  const factor3 = factorProduct(factor1, factor2);

  const partition1 = newPartition(reducers).refine(factor3);
  const partition2 = partition1.refine(scene.marker.factor);

  const partition1Data = partition1.data();
  const partition2Data = partition2.data();

  const type = Type.Absolute;
  const squares = newRectanglesWH(plot);
  squares.mapEncodingToScale(`width`, `area`);
  squares.mapEncodingToScale(`height`, `area`);
  squares.setWidthGapPx(1).setHeightGapPx(1);

  const self = { ...plot, type, squares, partition1Data, partition2Data };
  encodeAbs(self);

  self.pushGraphicObject(squares);

  const nMax = Math.max(factor1.cardinality, factor2.cardinality) + 1;
  self.scales.area.codomain.setScale(1 / nMax).setTransform(square, squareRoot);

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.addKeyAction(`Minus`, () => {
    width1.setValue(width1.value * (9 / 10));
    width2.setValue(width2.value * (9 / 10));
  });

  self.addKeyAction(`Equal`, () => {
    width1.setValue(width1.value * (10 / 9));
    width2.setValue(width2.value * (10 / 9));
  });

  self.addKeyAction(`KeyR`, () => {
    width1.defaultize();
    width2.defaultize();
  });

  partition1Data.listen(() => {
    self.trainScales(squares.boundaryData!, identity);
    const nMax = Math.max(factor1.cardinality, factor2.cardinality);
    self.trainScales(squares.boundaryData!, identity);
    self.scales.area.codomain.setScale(1 / nMax);
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
  self.trainScales(boundaryData, identity);

  self.render();
}

function encodePct(self: Histogram2D) {
  const { partition1Data, partition2Data, squares } = self;

  const boundaryData = partition1Data.select(encodeBoundaryPct);
  const renderData = partition2Data.select(encodeRenderPct);

  squares.setBoundaryData(boundaryData);
  squares.setRenderData(renderData);

  self.type = Type.Proportion;
  self.trainScales(boundaryData, identity);
  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return {
    x: d.binMid,
    y: d.binMid$,
    width: d.stat1,
    height: d.stat1,
    area: d.stat1,
  };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return {
    x: d.binMid,
    y: d.binMid$,
    width: d.stat1.stack(),
    height: d.stat1.stack(),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x: d.binMid,
    y: d.binMid$,
    width: one,
    height: one,
    area: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x: d.binMid,
    y: d.binMid$,
    width: d.stat1.stack().normalizeByParent(),
    height: d.stat1.stack().normalizeByParent(),
  };
};
