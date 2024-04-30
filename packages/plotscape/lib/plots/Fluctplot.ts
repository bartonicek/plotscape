import { Dataframe } from "@abartonicek/plotscape5";
import { square, squareRoot } from "utils";
import { GapType } from "../GapHandler";
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

/**
 * Creates a new fluctuation diagram and embeds it in a scene.
 * @param scene A scene object
 * @param selectfn A function which selects the variables to plot
 * @returns The newly created fluctuation diagram
 */
export function newFluctplot<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
): Fluctplot {
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
  const squares = newRectanglesWH(plot).setDefaultGap(1, 0);
  squares.remap(`width`, `area`);
  squares.remap(`height`, `area`);

  const self = { ...plot, squares, type, partition1Data, partition2Data };
  encodeAbs(self);

  plot.addGraphicObject(squares);
  const nMax = Math.max(factor1.cardinality, factor2.cardinality) + 1;
  self.scales.area.codomain.setScale(1 / nMax, { default: true });
  self.scales.area.codomain.setTransform(square, squareRoot);

  self.partition1Data.listen(self.render.bind(self));
  self.partition2Data.listen(self.render.bind(self));

  self.addKeyAction(`KeyR`, () => {
    self.scales.x.setDefaultOrder();
    self.scales.y.setDefaultOrder();
  });

  self.addKeyAction(`KeyN`, () =>
    self.type === Type.Absolute ? encodePct(self) : encodeAbs(self)
  );

  self.render();
  return self;
}

function encodeAbs(self: Fluctplot) {
  const { partition1Data, partition2Data, squares } = self;

  const boundaryData = partition1Data.select(encodeBoundaryAbs);
  const renderData = partition2Data.select(encodeRenderAbs);

  squares.setBoundaryData(boundaryData);
  squares.setRenderData(renderData);
  squares.setGapType(GapType.Pct);

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
  squares.setGapType(GapType.Px);

  self.type = Type.Proportion;
  self.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y, area: d.width }));
  self.render();
}

const encodeBoundaryAbs = (d: ReducedBindings) => {
  return {
    x: d.label.setQueryable(true),
    y: d.label$.setQueryable(true),
    width: d.stat1,
    height: d.stat1,
  };
};

const encodeRenderAbs = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: d.label$,
    width: d.stat1.stack(),
    height: d.stat1.stack(),
    q1: d.stat1.setQueryable(true),
  };
};

const encodeBoundaryPct = (d: ReducedBindings) => {
  return {
    x: d.label.setQueryable(true),
    y: d.label$.setQueryable(true),
    width: one,
    height: one,
  };
};

const encodeRenderPct = (d: ReducedBindings) => {
  return {
    x: d.label,
    y: d.label$,
    width: d.stat1.stack().normalizeByParent!(),
    height: d.stat1.stack().normalizeByParent!(),
    q1: d.stat1.setQueryable(true),
  };
};
