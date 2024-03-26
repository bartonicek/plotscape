import { values } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { Plot, newPlot } from "../plot/Plot";
import { Lines, newLines } from "../representations/Lines";
import { newExpanseDiscreteAbsolute } from "../scales/ExpanseDiscreteAbsolute";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Variables } from "../types";
import { newDerived } from "../variables/Derived";
import { Tuple, newTuple } from "../variables/Tuple";
import { Variable } from "../variables/Variable";

type DataBindings = {
  [key in `v${number}`]: Variable;
};

type ReducedBindings = {
  names: Tuple;
  values: Tuple;
};

export interface PCoordsplot extends Plot {
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  lines: Lines;
}

export function newPCoordsplot<T extends Variables>(
  scene: Scene<T>,
  selecfn: (cols: T) => DataBindings
) {
  const data = scene.data.select(selecfn);
  const plot = newPlot(scene);

  const boundaryData = data.select(encodefn).join(scene.marker.data());
  const renderData = boundaryData;

  const lines = newLines(plot, boundaryData, renderData);

  plot.pushGraphicObject(lines);
  plot.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y }));

  boundaryData.listen(`changed`, plot.render.bind(plot));
}

const encodefn = (d: DataBindings) => {
  const vals = newTuple(values(d));
  const names = newTuple(
    values(d).map((x) => newDerived((_, y) => y!.name(), x))
  );

  const domain = newExpanseDiscreteAbsolute(names.valueAt(0));
  // @ts-ignore
  for (const k of names.variables) k.setDomain(domain);
  names.domain = domain as any;
  names.n = () => vals.n();

  names.setName(`variable`);
  vals.setName(`scaled value`);

  return { x: names, y: vals };
};
