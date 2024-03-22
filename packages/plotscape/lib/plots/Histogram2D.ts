import { identity, square, squareRoot } from "utils";
import { Scene } from "../Scene";
import { newValueEmitter } from "../ValueEmitter";
import { Dataframe } from "../dataframe/Dataframe";
import { factorBin } from "../factors/factorBin";
import { factorProduct } from "../factors/factorProduct";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesWH, newRectanglesWH } from "../representations/RectanglesWH";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { Derived } from "../variables/Derived";
import { one } from "../variables/constants";

type DataBindings = {
  v1: Continuous;
  v2: Continuous;
};

type ReducedBindings = {
  binMid: Derived<number>;
  binMid$: Derived<number>;
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

  console.log(factor1.data.rows());

  const partition1 = newPartition(reducers).refine(factor3);
  const partition2 = partition1.refine(scene.marker.factor);

  const partition1Data = partition1.data();
  const partition2Data = partition2.data();

  const type = Type.Absolute;
  const squares = newRectanglesWH(plot);
  squares.mapEncodingToScale(`width`, `area`);
  squares.mapEncodingToScale(`height`, `area`);

  const self = { ...plot, type, squares, partition1Data, partition2Data };
  encodeAbs(self);

  self.pushGraphicObject(squares);

  const nMax = Math.max(factor1.cardinality, factor2.cardinality) + 2;
  self.trainScales(squares.boundaryData!, identity);
  self.scales.area.codomain
    .setScale(1 / nMax ** 2)
    .setTransform(square, squareRoot);

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.addKeyAction(`Minus`, () => {
    width1.setValue(width1.value * (10 / 11));
    width2.setValue(width2.value * (10 / 11));
  });

  self.addKeyAction(`Equal`, () => {
    width1.setValue(width1.value * (11 / 10));
    width2.setValue(width2.value * (11 / 10));
  });

  self.addKeyAction(`KeyR`, () => {
    width1.defaultize();
    width2.defaultize();
  });

  partition1Data.listen(`changed`, () => {
    self.trainScales(squares.boundaryData!, identity);
    const nMax = Math.max(factor1.cardinality, factor2.cardinality) + 2;
    self.trainScales(squares.boundaryData!, identity);
    self.scales.area.codomain
      .setScale(1 / nMax ** 2)
      .setTransform(square, squareRoot);
    self.render();
  });

  partition2Data.listen(`changed`, self.render.bind(self));

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
  return { x: d.binMid, y: d.binMid$, width: d.stat1, height: d.stat1 };
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
