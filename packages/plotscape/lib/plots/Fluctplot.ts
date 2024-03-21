import { square, squareRoot } from "utils";
import { Scene } from "../Scene";
import { factorFrom } from "../factors/factorFrom";
import { factorProduct } from "../factors/factorProduct";
import { newPlot } from "../plot/Plot";
import { newPartition } from "../reducers/Partition";
import { sumReducer } from "../reducers/Reducer";
import { newReducerHandler } from "../reducers/ReducerHandler";
import { newRectanglesWH } from "../representations/RectanglesWH";
import { Variables } from "../types";
import { Continuous } from "../variables/Continuous";
import { Discrete } from "../variables/Discrete";
import { one } from "../variables/constants";

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

export function newFluctplot<T extends Variables>(
  scene: Scene<T>,
  selectfn: (cols: T) => DataBindings
) {
  const plot = newPlot(scene);
  const data = scene.data.select(selectfn);

  const reducers = { stat1: newReducerHandler(one, sumReducer) };
  const f1 = factorFrom(data.col(`v1`));
  const f2 = factorFrom(data.col(`v2`));
  const factor = factorProduct(f1, f2);

  const partition1 = newPartition(reducers).refine(factor);
  const partition2 = partition1.refine(scene.marker.factor);

  const boundaryData = partition1.data().select(encodeBoundaryAbs);
  const renderData = partition2.data().select(encodeRenderAbs);

  const squares = newRectanglesWH(plot, boundaryData, renderData);
  squares.mapEncodingToScale(`width`, `area`);
  squares.mapEncodingToScale(`height`, `area`);
  plot.pushGraphicObject(squares);

  const nMax = Math.max(f1.cardinality, f2.cardinality);

  plot.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y, area: d.width }));
  plot.scales.area.codomain.setScale(1 / nMax).setTransform(square, squareRoot);

  boundaryData.listen(`changed`, plot.render.bind(plot));
  renderData.listen(`changed`, plot.render.bind(plot));
  plot.render();
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
