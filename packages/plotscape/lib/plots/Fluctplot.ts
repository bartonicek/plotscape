import { Dataframe } from "@abartonicek/plotscape5";
import { square, squareRoot } from "utils";
import { one } from "../constants";
import { factorFrom } from "../factors/factorFrom";
import { factorProduct } from "../factors/factorProduct";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesWH, newRectanglesWH } from "../representations/RectanglesWH";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";

type DataBindings = {
  v1: Discrete;
  v2: Discrete;
  v3?: Continuous;
};

type ReducedBindings = {
  label: Discrete;
  label$: Discrete;
  stat1: Continuous;
};

export interface Fluctplot extends Plot {
  type: Type;
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  squares: RectanglesWH;
}

export function newFluctplot<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const factor1 = factorFrom(data.col(`v1`));
  const factor2 = factorFrom(data.col(`v2`));
  const factor3 = factorProduct(factor1, factor2);

  const partition1 = newPartition(reducers).refine(factor3);
  const partition2 = partition1.refine(scene.marker.factor);

  const partition1Data = partition1.data();
  const partition2Data = partition2.data();

  const type = Type.Absolute;
  const squares = newRectanglesWH(plot);
  squares.mapEncodingToScale(`width`, `area`);
  squares.mapEncodingToScale(`height`, `area`);

  const self = { ...plot, squares, type, partition1Data, partition2Data };
  encodeAbs(self);

  plot.pushGraphicObject(squares);
  const nMax = Math.max(factor1.cardinality, factor2.cardinality) + 1;
  plot.scales.area.codomain.setScale(1 / nMax).setTransform(square, squareRoot);

  self.partition1Data.listen(plot.render.bind(plot));
  self.partition2Data.listen(plot.render.bind(plot));

  self.addKeyAction(`KeyR`, () => {
    self.scales.x.setDefaultOrder();
    self.scales.y.setDefaultOrder();
  });

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.render();
}

function encodeAbs(self: Fluctplot) {
  const { partition1Data, partition2Data, squares } = self;

  const boundaryData = partition1Data.select(encodeBoundaryAbs);
  const renderData = partition2Data.select(encodeRenderAbs);

  squares.setBoundaryData(boundaryData);
  squares.setRenderData(renderData);

  self.type = Type.Absolute;
  self.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y, area: d.width }));
  self.render();
}

function encodePct(self: Fluctplot) {
  const { partition1Data, partition2Data, squares } = self;

  const boundaryData = partition1Data.select(encodeBoundaryPct);
  const renderData = partition2Data.select(encodeRenderPct);

  squares.setBoundaryData(boundaryData);
  squares.setRenderData(renderData);

  self.type = Type.Proportion;
  self.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y, area: d.width }));
  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return { x: d.label, y: d.label$, width: d.stat1, height: d.stat1 };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: d.label$,
    width: d.stat1.stack!(),
    height: d.stat1.stack!(),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return { x: d.label, y: d.label$, width: one, height: one };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: d.label$,
    width: d.stat1.stack!().normalizeByParent!(),
    height: d.stat1.stack!().normalizeByParent!(),
  };
};
