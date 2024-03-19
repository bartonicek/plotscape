import { TODO, element } from "utils";
import { Context, newContext } from "./Context";
import { Scale, newScale } from "./Scale";
import { Dataframe } from "./dataframe/Dataframe";
import { getMargins } from "./funs";
import graphicParameters from "./graphicParameters.json";
import { GraphicObject } from "./types";

export const layers = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const baseLayers = [4, 5, 6, 7] as const;

type OtherContexts = `base` | `user` | `under` | `over` | "xAxis" | "yAxis";
export type ContextName = (typeof layers)[number] | OtherContexts;
export type Contexts = Record<ContextName, Context>;

enum MouseButton {
  Left = 0,
  Right = 2,
}

enum Mode {
  Select,
  Pan,
  Query,
}

export interface Plot {
  scene: TODO;
  container: HTMLDivElement;
  contexts: Contexts;

  scales: Record<string, Scale>;
  graphicObjects: GraphicObject[];

  //   selectionRect: TODO;
  //   zoomStack: TODO;
  //   queryRenderer: TODO;

  active: boolean;
  mousedown: boolean;
  mode: Mode;
  mousebutton: MouseButton;

  lastX: number;
  lastY: number;
  lastKey: string;

  //   localKeyActions: KeyActions;
  //   globalKeyActions: KeyActions;

  resize(): this;
  deactivate(): this;
  activate(): this;
}

export function newPlot(scene: TODO) {
  const container = element(`div`).addClass(`ps-plot-container`).get();
  const contexts = {} as Contexts;

  const {
    groupColors: colors,
    axisTitleFontsize,
    axisLabelFontsize,
  } = graphicParameters;

  const margins = getMargins();

  for (const id of layers) {
    contexts[id] = newContext(container)
      .setAttribute(`id`, `data-layer${id}`)
      .addClass(`ps-plot-context`)
      .setStyles({ zIndex: `${7 - id + 1}` })
      .setProps({ fillStyle: colors[id], strokeStyle: colors[id] });
  }

  contexts.base = newContext(container)
    .addClass(`ps-plot-context`)
    .addClass(`base`)
    .setStyles({ backgroundColor: `whitesmoke` })
    .setProps({
      textAlign: `center`,
      textBaseline: `middle`,
      font: `${axisTitleFontsize}px sans`,
    });

  // contexts.under = newContext(container).addClass(`inner`);
  // contexts.over = newContext(container).setStyles({ zIndex: `10` });
  contexts.user = newContext(container)
    .addClass(`ps-plot-context`)
    .addClass(`user`)
    .setStyles({ zIndex: `10` })
    .setProps({ fillStyle: `#99999933`, strokeStyle: `#00000000` })
    .setMargins(margins);

  contexts.xAxis = newContext(container).setProps({
    textBaseline: "top",
    textAlign: "center",
    font: `${axisLabelFontsize}px serif`,
    fillStyle: "#3B4854",
  });

  contexts.yAxis = newContext(container).setProps({
    textBaseline: "middle",
    textAlign: "right",
    font: `${axisLabelFontsize}px serif`,
    fillStyle: "#3B4854",
  });

  const scales = {
    x: newScale(),
    y: newScale(),
    size: newScale(),
    width: newScale(),
    area: newScale(),
  };

  const { defaultNormX: dnx, defaultNormY: dny } = graphicParameters;

  scales.x.norm.setDefaultMin(dnx).setDefaultMax(1 - dnx);
  scales.x.norm.defaultize();

  scales.y.norm.setDefaultMin(dny).setDefaultMax(1 - dny);
  scales.y.norm.defaultize();

  // @ts-ignore
  scales.size.codomain.setDefaultMin(1).setDefaultMax(10).defaultize();
  scales.width.norm.setDefaultMin(0).setDefaultMax(1 - 2 * dnx);
  scales.width.norm.defaultize();

  const graphicObjects = [] as GraphicObject[];

  const pars = {
    active: false,
    mousedown: false,
    mousebutton: MouseButton.Left,
    mode: Mode.Select,
    lastX: 0,
    lastY: 0,
    lastKey: ``,
  };

  const props = { scene, container, contexts, scales, graphicObjects };
  const methods = { resize, activate, deactivate };

  const self: Plot = { ...pars, ...props, ...methods };
  scene.addPlot(self);

  return self;
}

function resize(this: Plot) {
  const { contexts, scales, container } = this;

  for (const context of Object.values(contexts)) context.resize();
  const { clientWidth: width, clientHeight: height } = container;
  const [bottom, left, top, right] = getMargins();

  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  scales.x.codomain.setMin(left).setMax(width - right);
  scales.y.codomain.setMin(bottom).setMax(height - top);
  scales.width.codomain.setMin(0).setMax(innerWidth);
  scales.area.codomain.setMax(Math.min(innerWidth, innerHeight));

  return this;
}

function activate(this: Plot) {
  this.active = true;
  return this;
}

function deactivate(this: Plot) {
  this.active = false;
  return this;
}

function trainScales(this: Plot, data: () => Dataframe) {
  const { columns } = data();
  const { scales } = this;

  for (const [k, v] of Object.entries(columns)) {
    // if (v) v.retrain();

    let scale: Scale | undefined = undefined;
    if (k.startsWith(`x`)) scale = scales.x;
    if (k.startsWith(`y`)) scale = scales.y;
    else if ([`area`, `size`, `width`].includes(k)) scale = scales[k];

    if (!scale) continue;

    scale.setDomain(v.domain as any);
  }

  this.render();
}

function render(this: Plot) {
  for (const c of Object.values(this.contexts)) c.clear();
  for (const o of this.graphicObjects) o.render(this.contexts);
}
