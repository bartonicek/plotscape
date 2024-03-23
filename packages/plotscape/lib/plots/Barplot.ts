import { rep, sum } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { factorFrom } from "../factors/factorFrom";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesWH, newRectanglesWH } from "../representations/RectanglesWH";
import { Scene } from "../scene/Scene";
import {
  BoundaryCols,
  RenderCols,
  Type,
  Variables,
  VerticalAnchor,
} from "../types";
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
  type: Type;
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  bars: RectanglesWH;
}

export function newBarplot<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
): Barplot {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const factor = factorFrom(data.col(`v1`));

  const partition1 = newPartition(reducers).refine(factor);
  const partition2 = partition1.refine(scene.marker.factor);

  const partition1Data = partition1.data();
  const partition2Data = partition2.data();

  const type = Type.Absolute;
  const bars = newRectanglesWH(plot);
  bars.setVAnchor(VerticalAnchor.Bottom);

  const self = { ...plot, bars, type, partition1Data, partition2Data };
  encodeAbs(self);

  self.pushGraphicObject(self.bars);
  self.partition1Data.listen(`changed`, self.render.bind(self));
  self.partition2Data.listen(`changed`, self.render.bind(self));

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  return self;
}

function encodeAbs(self: Barplot) {
  const { partition1Data, partition2Data, bars } = self;
  const boundaryData = partition1Data.select(encodeBoundaryAbs);
  const renderData = partition2Data.select(encodeRenderAbs);

  bars.setBoundaryData(boundaryData);
  bars.setRenderData(renderData);
  bars.setWidthPct(0.8).setWidthGapPx(0);

  self.type = Type.Absolute;
  self.trainScales(boundaryData, (d) => ({ ...d, y: d.height }));
  self.scales.x.setWeights(rep(1, boundaryData.n()));
  self.scales.y.setMin(0).freezeMin().link(self.scales.height);
  self.render();
}

function encodePct(self: Barplot) {
  const { partition1Data, partition2Data, bars } = self;
  const boundaryData = partition1Data.select(encodeBoundaryPct);
  const renderData = partition2Data.select(encodeRenderPct);

  bars.setBoundaryData(boundaryData);
  bars.setRenderData(renderData);
  bars.setWidthPct(1).setWidthGapPx(1);

  self.type = Type.Proportion;
  self.trainScales(boundaryData, (d) => ({ ...d, y: d.height }));
  self.scales.y.setMin(0).freezeMin().link(self.scales.height);

  const values = partition1Data.col(`stat1`).values();
  self.scales.x.setWeights(values);
  self.scales.width.setMax(values.reduce(sum));

  self.render();
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
    height: d.stat1.stack(),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.stat1,
    height: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.stat1.parent(),
    height: d.stat1.stack().normalizeByParent!(),
  };
};
