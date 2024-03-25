import { sum } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { factorFrom } from "../factors/factorFrom";
import { getOrderIndices } from "../funs";
import { Plot, newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { RectanglesWH, newRectanglesWH } from "../representations/RectanglesWH";
import { Scene } from "../scene/Scene";
import {
  BoundaryCols,
  Order,
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
  order: Order;
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

  const [type, order] = [Type.Absolute, Order.Alphanumeric];
  const bars = newRectanglesWH(plot);
  bars.setVAnchor(VerticalAnchor.Bottom);

  const self = { ...plot, bars, type, order, partition1Data, partition2Data };
  encodeAbs(self);

  self.pushGraphicObject(self.bars);
  self.scales.y.freezeMin().link(self.scales.height);

  self.addKeyAction(`KeyR`, defaultize.bind(self));
  self.addKeyAction(`KeyO`, switchOrder.bind(self));
  self.addKeyAction(`KeyN`, switchEncoding.bind(self));

  partition2Data.listen(`changed`, self.render.bind(self));
  return self;
}

function defaultize(this: Barplot) {
  this.scales.x.setDefaultOrder();
  this.order = Order.Alphanumeric;
  encodeAbs(this);
}

function switchEncoding(this: Barplot) {
  this.type === Type.Absolute ? encodePct(this) : encodeAbs(this);
}

function switchOrder(this: Barplot) {
  if (this.order === Order.Alphanumeric) {
    const indices = getOrderIndices(this.partition1Data.col(`stat1`).values());
    this.scales.x.setOrder(indices);
    this.order = Order.Custom;
  } else {
    this.scales.x.setDefaultOrder();
    this.order = Order.Alphanumeric;
  }
  this.render();
}

function encodeAbs(self: Barplot) {
  const { partition1Data, partition2Data, bars } = self;
  const boundaryData = partition1Data.select(encodeBoundaryAbs);
  const renderData = partition2Data.select(encodeRenderAbs);

  bars.setBoundaryData(boundaryData);
  bars.setRenderData(renderData);
  bars.setWidthPct(0.8);

  self.type = Type.Absolute;
  self.trainScales(boundaryData, (d) => ({
    ...d,
    y: d.height,
    width: d.x.width(),
  }));

  const order = self.scales.x.getOrder();

  self.scales.x.setDefaultWeights();
  if (order) self.scales.x.setOrder(order);
  self.scales.y.setMin(0);
  self.render();
}

function encodePct(self: Barplot) {
  const { partition1Data, partition2Data, bars } = self;
  const boundaryData = partition1Data.select(encodeBoundaryPct);
  const renderData = partition2Data.select(encodeRenderPct);

  bars.setBoundaryData(boundaryData);
  bars.setRenderData(renderData);
  bars.setWidthGapPx(1);

  self.type = Type.Proportion;
  self.trainScales(boundaryData, (d) => ({
    ...d,
    y: d.height,
    width: d.x.width(),
  }));

  const order = self.scales.x.getOrder();
  const weights = partition1Data.col(`stat1`).values();

  self.scales.x.setWeights(weights);
  if (order) self.scales.x.setOrder(order);
  self.scales.width.setMax(weights.reduce(sum));
  self.scales.y.setMin(0);
  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return { x: d.label, y: zero, width: d.label, height: d.stat1 };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return { x: d.label, y: zero, width: d.label, height: d.stat1.stack() };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return { x: d.label, y: zero, width: d.label, height: one };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: zero,
    width: d.label,
    height: d.stat1.stack().normalizeByParent(),
  };
};
