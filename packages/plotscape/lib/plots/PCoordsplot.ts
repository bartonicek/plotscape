import { TODO, values } from "utils";
import { oneRowOneCase } from "../constants";
import { Dataframe } from "../dataframe/Dataframe";
import { Plot, newPlot } from "../plot/Plot";
import { Lines, newLines } from "../representations/Lines";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { newExpanseDiscreteAbsolute } from "../scales/ExpanseDiscreteAbsolute";
import { Scene } from "../scene/Scene";
import { BoundaryCols, RenderCols, Type, Variables } from "../types";
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
  type: Type;
  partition1Data: Dataframe<ReducedBindings & BoundaryCols>;
  partition2Data: Dataframe<ReducedBindings & RenderCols>;
  lines: Lines;
}

/**
 * Creates a new parallel coordinates plot and embeds it in a scene.
 * @param scene A scene object
 * @param selectfn A function which selects the variables to plot
 * @returns The newly created parallel coordinates plot
 */
export function newPCoordsplot<T extends Variables>(
  scene: Scene<T>,
  selecfn: (cols: T) => DataBindings
): PCoordsplot {
  const data = scene.data.select(selecfn);
  const plot = newPlot(scene);

  const partition1Data = data.select(reducefn).join(scene.marker.data());
  const partition2Data = partition1Data;

  const boundaryData = partition1Data.select(encodefn).join(oneRowOneCase);
  const renderData = partition2Data.select(encodefn).join(scene.marker.data());

  const type = Type.Proportion;
  const lines = newLines(plot, boundaryData, renderData);

  plot.addGraphicObject(lines);
  plot.trainScales(boundaryData, (d) => ({ x: d.x, y: d.y }));

  const self = { ...plot, type, lines, partition1Data, partition2Data };
  self.addKeyAction(`KeyN`, switchEncoding.bind(self));
  self.addKeyAction(`KeyR`, () => self.scales.x.setDefaultOrder());

  boundaryData.listen(plot.render.bind(plot));
  return self;
}

const reducefn = (d: DataBindings) => {
  const vals = newTuple(values(d));
  const names = newTuple(
    values(d).map((x) => {
      const variable = newDerived((_, y) => y!.name(), x);
      variable.setName(x.name());
      return variable;
    })
  );

  const domain = newExpanseDiscreteAbsolute(names.valueAt(0));

  for (const k of names.variables) (k as TODO).setDomain(domain);
  names.domain = domain as TODO;
  names.n = () => vals.n();

  names.setName(`variable`);
  vals.setName(`scaled value`);

  return { names, values: vals };
};

const encodefn = (d: ReducedBindings) => {
  return { x: d.names, y: d.values };
};

function switchEncoding(this: PCoordsplot) {
  if (this.type === Type.Proportion) {
    this.partition1Data.col(`values`).setCommonDomain();
    this.scales.y.setDomain(this.partition1Data.col(`values`).domain as TODO);
    this.scales.y.setName(`value`);
    this.type = Type.Absolute;
    this.render();
  } else {
    this.partition1Data.col(`values`).unsetCommonDomain();
    this.scales.y.setDomain(newExpanseContinuous());
    this.scales.y.setName(`scaled value`);
    this.type = Type.Proportion;
    this.render();
  }
}
