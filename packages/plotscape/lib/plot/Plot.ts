import { element, entries, inOrder, mergeSetIntoAnother, values } from "utils";
import { Context, newContext } from "../Context";
import { Scale, newScale } from "../Scale";
import { Scene } from "../Scene";
import { Dataframe } from "../dataframe/Dataframe";
import { newAxisLabels } from "../decorations/AxisLabels";
import { getMargins } from "../funs";
import graphicParameters from "../graphicParameters.json";
import { ActionKey, GraphicObject, KeyActions, Variables } from "../types";
import { SelectionRect, newSelectionRect } from "./SelectionRect";

export const layers = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const baseLayers = [4, 5, 6, 7] as const;

type OtherContexts = `base` | `user` | `under` | `over` | "xAxis" | "yAxis";
export type ContextId = (typeof layers)[number];
export type ContextName = ContextId | OtherContexts;
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

export type Scales = {
  x: Scale;
  y: Scale;
  size: Scale;
  width: Scale;
  height: Scale;
  area: Scale;
};

/* -------------------------------- Interface ------------------------------- */

export interface Plot {
  scene: Scene;
  container: HTMLDivElement;
  contexts: Contexts;

  scales: Scales;
  graphicObjects: GraphicObject[];

  selectionRect: SelectionRect;
  //   zoomStack: TODO;
  //   queryRenderer: TODO;

  active: boolean;
  mousedown: boolean;
  mode: Mode;
  mousebutton: MouseButton;

  lastX: number;
  lastY: number;
  lastKey: string;

  localKeyActions: KeyActions;
  globalKeyActions: KeyActions;

  deactivate(): this;
  activate(): this;

  trainScales<T extends Variables>(
    data: Dataframe<T>,
    selectfn: (cols: T) => Variables
  ): this;

  resize(): this;
  render(): this;
  reset(): this;
  pushGraphicObject(object: GraphicObject): this;
  addKeyAction(key: ActionKey, action: (event: Event) => void): void;
}

/* ------------------------------- Constructor ------------------------------ */

export function newPlot(scene: Scene) {
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
      .setProps({
        fillStyle: colors[id],
        strokeStyle: colors[id],
        font: `${axisLabelFontsize}px sans`,
      })
      .setMargins(margins);
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

  contexts.under = newContext(container)
    .addClass(`ps-plot-context`)
    .addClass(`inner`);

  contexts.user = newContext(container)
    .addClass(`ps-plot-context`)
    .addClass(`user`)
    .setStyles({ zIndex: `10` })
    .setProps({ fillStyle: `#99999933`, strokeStyle: `#00000000` })
    .setMargins(margins);

  contexts.xAxis = newContext(container)
    .addClass(`ps-plot-context`)
    .setProps({
      textBaseline: "top",
      textAlign: "center",
      font: `${axisLabelFontsize}px serif`,
      fillStyle: "#3B4854",
    });

  contexts.yAxis = newContext(container)
    .addClass(`ps-plot-context`)
    .setProps({
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
    height: newScale(),
    area: newScale(),
  };

  const { defaultNormX: dnx, defaultNormY: dny } = graphicParameters;

  scales.x.setOther(scales.y).setAes(`x`);
  scales.x.norm.setDefaultMin(dnx).setDefaultMax(1 - dnx);
  scales.x.norm.defaultize();

  scales.y.setOther(scales.x).setAes(`y`);
  scales.y.norm.setDefaultMin(dny).setDefaultMax(1 - dny);
  scales.y.norm.defaultize();

  scales.size.codomain.setDefaultMin(1).setDefaultMax(10).defaultize();
  scales.width.norm.setDefaultMax(1 - 2 * dnx).defaultize();
  scales.height.norm.setDefaultMax(1 - 2 * dny).defaultize();

  scales.width.freezeMin();
  scales.height.freezeMin();

  const graphicObjects = [] as GraphicObject[];

  const active = false;
  const mousedown = false;
  const mousebutton = MouseButton.Left;
  const mode = Mode.Select;
  const lastX = 0;
  const lastY = 0;
  const lastKey = ``;

  const selectionRect = newSelectionRect();

  const localKeyActions = {} as KeyActions;
  const globalKeyActions = {} as KeyActions;

  const pars = { active, mousedown, mousebutton, mode, lastX, lastY, lastKey };
  const props = {
    scene,
    container,
    contexts,
    scales,
    graphicObjects,
    selectionRect,
    localKeyActions,
    globalKeyActions,
  };

  const methods = {
    activate,
    deactivate,
    render,
    resize,
    reset,
    trainScales,
    pushGraphicObject,
    addKeyAction,
  };

  const self: Plot = { ...pars, ...props, ...methods };

  window.addEventListener("resize", resize.bind(self));
  window.addEventListener("keydown", onKeydown.bind(self));
  container.addEventListener("mousedown", onMousedown.bind(self));
  container.addEventListener("mousemove", onMousemove.bind(self));
  container.addEventListener("mouseup", onMouseup.bind(self));
  container.addEventListener("dblclick", onDoubleclick.bind(self));
  container.addEventListener("contextmenu", onContextmenu.bind(self));

  localKeyActions[`KeyR`] = () => {
    self.reset();
    self.render();
  };

  selectionRect.listen(`changed`, () => {
    const { coords } = selectionRect;
    const selected = new Set<number>();
    for (const s of self.graphicObjects) {
      if (s.check) mergeSetIntoAnother(selected, s.check(coords));
    }
    scene.marker.update(selected);
  });

  self.pushGraphicObject(newAxisLabels(scales.x));
  self.pushGraphicObject(newAxisLabels(scales.y));
  self.pushGraphicObject(selectionRect);
  scene.addPlot(self);

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function resize(this: Plot) {
  const { contexts, scales, container } = this;

  for (const context of Object.values(contexts)) context.resize();
  const { clientWidth: width, clientHeight: height } = container;
  const [bottom, left, top, right] = getMargins();

  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  scales.x.codomain.setMin(left).setMax(Math.max(left, width - right));
  scales.y.codomain.setMin(bottom).setMax(Math.max(bottom, height - top));
  scales.width.codomain.setMax(innerWidth);
  scales.height.codomain.setMax(innerHeight);
  scales.area.codomain.setMax(Math.min(innerWidth, innerHeight));

  this.render();
  return this;
}

function activate(this: Plot) {
  this.active = true;
  this.container.classList.add(`active`);
  return this;
}

function deactivate(this: Plot) {
  this.active = false;
  this.container.classList.remove(`active`);
  this.selectionRect.clear();
  return this;
}

function trainScales<T extends Variables>(
  this: Plot,
  data: Dataframe<T>,
  selectfn: (cols: T) => Variables
) {
  const trainers = selectfn(data.columns);
  const { scales } = this;

  for (const [k, v] of entries(trainers) as [keyof Scales, any][]) {
    const scale = scales[k];

    if (!scale) continue;
    if (v.retrain) v.retrain(v.array);
    if (v.domain) scale.setDomain(v.domain);
  }

  this.render();
  return this;
}

function render(this: Plot) {
  for (const c of Object.values(this.contexts)) c.clear();
  for (const o of this.graphicObjects) if (o.render) o.render(this.contexts);
  return this;
}

function reset(this: Plot) {
  const { container, scales, contexts, selectionRect } = this;
  const { clientWidth: width, clientHeight: height } = container;
  const [bottom, left, top, right] = getMargins();

  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  for (const v of values(scales)) v.norm.defaultize();
  scales.size.codomain.defaultize();
  scales.width.codomain.setMax(innerWidth);
  scales.area.codomain.setMax(Math.min(innerWidth, innerHeight));
  selectionRect.clear();

  // zoomStack.clear();

  for (const context of values(contexts)) context.setProps({ globalAlpha: 1 });
  this.render();

  return this;
}

function pushGraphicObject(this: Plot, object: GraphicObject) {
  this.graphicObjects.push(object);
  this.render();
  return this;
}

function addKeyAction(
  this: Plot,
  key: ActionKey,
  action: (event: Event) => void
) {
  if (!this.localKeyActions[key]) this.localKeyActions[key] = action;
  else this.localKeyActions[key] = inOrder(this.localKeyActions[key]!, action);
}

/* ----------------------------- Event Handlers ----------------------------- */

function onMousedown(this: Plot, event: MouseEvent) {
  const { scene, container, selectionRect } = this;

  scene.deactivateAllExcept(this);

  this.activate();
  this.mousedown = true;
  this.mousebutton = event.button;

  if (event.button === MouseButton.Left) this.mode = Mode.Select;
  if (event.button === MouseButton.Right) this.mode = Mode.Pan;

  if (this.mode === Mode.Select) {
    const { clientHeight } = container;
    const x = event.offsetX;
    const y = clientHeight - event.offsetY;

    selectionRect.setCoords([x, y, x, y]);
  }
}

function onMouseup(this: Plot) {
  this.mousedown = false;
}

function onMousemove(this: Plot, event: MouseEvent) {
  switch (this.mode) {
    case Mode.Select:
      onMousemoveSelect(this, event);
      break;
    case Mode.Pan:
      onMousemovePan(this, event);
      break;
    case Mode.Query:
      onMousemoveQuery(this, event);
  }
}

function onMousemoveSelect(self: Plot, event: MouseEvent) {
  if (!self.active || !self.mousedown) return self;

  const { container, selectionRect } = self;
  const { clientHeight } = container;

  const x = event.offsetX;
  const y = clientHeight - event.offsetY;

  const { coords } = selectionRect;
  selectionRect.setCoords([coords[0], coords[1], x, y]);

  self.render();
  return self;
}

function onMousemovePan(self: Plot, event: MouseEvent) {
  if (!self.active || !self.mousedown) return self;

  const { scales, lastX, lastY } = self;
  const { clientWidth, clientHeight } = self.container;

  const x = event.offsetX;
  const y = clientHeight - event.offsetY;
  const xMove = (x - lastX) / clientWidth;
  const yMove = (y - lastY) / clientHeight;

  scales.x.move(xMove);
  scales.y.move(yMove);

  self.lastX = x;
  self.lastY = y;

  self.render();
  return self;
}

function onMousemoveQuery(self: Plot, event: MouseEvent) {
  const { offsetX, offsetY } = event;
  const { clientHeight } = self.container;

  const x = offsetX;
  const y = clientHeight - offsetY;

  let result;

  // for (const q of this.queryables) {
  //   result = q.query(x, y);
  //   if (result) break;
  // }

  // if (!result) this.queryRenderer.clear();
  // else this.queryRenderer.renderQuery(x, y, result);

  return self;
}

function onContextmenu(this: Plot, event: MouseEvent) {
  event.preventDefault();
  this.selectionRect.clear();
  this.mousebutton = MouseButton.Right;
  this.lastX = event.offsetX;
  this.lastY = this.container.clientHeight - event.offsetY;
}

function onDoubleclick(this: Plot) {
  this.deactivate();
  this.scene.marker.clearAll();
}

function onKeydown(this: Plot, event: KeyboardEvent) {
  if (event.code === "KeyQ" && event.code === this.lastKey) return;
  // this.queryRenderer.clear();
  this.globalKeyActions[event.code as ActionKey]?.(event);
  if (this.active) this.localKeyActions[event.code as ActionKey]?.(event);

  this.lastKey = event.code;
}
