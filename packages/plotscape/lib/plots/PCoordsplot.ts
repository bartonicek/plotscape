import { TODO } from "utils";
import { oneRowOneCase } from "../constants";
import { Dataframe } from "../dataframe/Dataframe";
import graphicParameters from "../graphicParameters.json";
import { Plot, newPlot } from "../plot/Plot";
import { Lines, newLines } from "../representations/Lines";
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
  plot.trainScales(boundaryData, (d) => {
    return { x: d.x, y: d.y };
  });

  plot.scales.x.domain.link(boundaryData.col(`x`).domain);
  plot.scales.y.domain.link(boundaryData.col(`y`).domain);
  for (const v of boundaryData.col(`y`).variables) {
    plot.scales.y.domain.link(v.domain);
    plot.addWidgetSource(v.domain);
  }

  const self = { ...plot, type, lines, partition1Data, partition2Data };
  self.addKeyAction(`KeyN`, switchEncoding.bind(self));
  self.addKeyAction(`KeyR`, () => self.scales.x.setDefaultOrder());

  renderData.listen(plot.render.bind(plot));

  return self;
}

const reducefn = (d: DataBindings) => {
  const { defaultNormX: dnx, defaultNormY: dny } = graphicParameters;

  const vars = [] as Variable[];
  for (const [k, v] of Object.entries(d)) {
    if (/^v\d+$/g.test(k)) {
      vars.push(v.setQueryable(true));
      v.domain.expand(-dnx, 1 + dnx, { default: true });
    }
  }

  const vals = newTuple(vars);
  const names = newTuple(
    vars.map((x) => newDerived((_, y) => y!.name(), x).setName(x.name()))
  );

  const namesDomain = newExpanseDiscreteAbsolute(names.valueAt(0));
  namesDomain.expand(-dny, 1 + dny, { default: true });

  for (const k of names.variables) (k as TODO).setDomain(namesDomain);

  names.domain = namesDomain as TODO;
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
    const { defaultNormY: dny } = graphicParameters;
    const domain = this.partition1Data.col(`values`).setCommonDomain();
    const { min, max } = domain.expand(-dny, 1 + dny);

    this.scales.y.setMinMax(min, max);
    this.scales.y.setName(`value`);
    this.type = Type.Absolute;
    this.render();
  } else {
    const { defaultNormY: dny } = graphicParameters;
    this.partition1Data.col(`values`).unsetCommonDomain();
    this.scales.y.setMinMax(-dny, 1 + dny).setName(`scaled value`);
    this.type = Type.Proportion;
    this.render();
  }
}
