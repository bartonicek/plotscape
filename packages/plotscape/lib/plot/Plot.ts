import {
  diff,
  element,
  entries,
  inOrder,
  mergeInto,
  squareRoot,
  throttle,
  trunc0to1,
  values,
} from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { newAxisLabels } from "../decorations/AxisLabels";
import { newAxisTitle } from "../decorations/AxisTitle";
import { getMargins, processBaseColor } from "../funs";
import graphicParameters from "../graphicParameters.json";
import { Scale, isScaleContinuous, newScale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import {
  ActionKey,
  GraphicObject,
  HexColour,
  KeyActions,
  Variables,
} from "../types";
import { Context, newContext } from "./Context";
import { QueryDisplay, newQueryDisplay } from "./QueryDisplay";
import { SelectionRect, newSelectionRect } from "./SelectionRect";
import { WidgetDisplay, newWidgetDisplay } from "./WidgetDisplay";
import { ZoomStack, newZoomStack } from "./ZoomStack";

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
  zoomStack: ZoomStack;
  queryDisplay: QueryDisplay;
  widgetDisplay: WidgetDisplay;

  pars: {
    active: boolean;
    mousedown: boolean;
    mode: Mode;
    mousebutton: MouseButton;
    aspectRatio: number | undefined;

    lastX: number;
    lastY: number;
    lastKey: string;
  };

  localKeyActions: KeyActions;
  globalKeyActions: KeyActions;

  deactivate(): void;
  activate(): void;

  trainScales<T extends Variables>(
    data: Dataframe<T>,
    selectfn: (cols: T) => Variables
  ): void;

  resize(): void;
  render(): void;
  reset(): void;
  setAlpha(value: number): void;
  scaleAlpha(value: number): void;
  setAspectRatio(value: number): void;
  pushGraphicObject(object: GraphicObject): void;
  addKeyAction(key: ActionKey, action: (event: KeyboardEvent) => void): void;
}

/* ------------------------------- Constructor ------------------------------ */

export function newPlot(scene: Scene) {
  const container = element(`div`).addClass(`ps-plot-container`).get();
  const contexts = {} as Contexts;

  const { groupColors, axisTitleFontsize, axisLabelFontsize } =
    graphicParameters;

  const colors = groupColors.slice() as HexColour[];
  const n = colors.length;
  for (let i = 0; i < n; i++) colors.push(processBaseColor(colors[i]));

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
  const aspectRatio = undefined;

  const selectionRect = newSelectionRect();
  const zoomStack = newZoomStack();
  const queryDisplay = newQueryDisplay(container);
  const widgetDisplay = newWidgetDisplay(container);

  const localKeyActions = {} as KeyActions;
  const globalKeyActions = {} as KeyActions;

  const pars = {
    active,
    mousedown,
    mousebutton,
    mode,
    lastX,
    lastY,
    lastKey,
    aspectRatio,
  };

  const props = {
    scene,
    container,
    contexts,
    scales,
    graphicObjects,
    selectionRect,
    zoomStack,
    queryDisplay,
    widgetDisplay,
    localKeyActions,
    globalKeyActions,
  };

  const methods = {
    activate,
    deactivate,
    render,
    resize,
    reset,
    setAlpha,
    scaleAlpha,
    setAspectRatio,
    trainScales,
    pushGraphicObject,
    addKeyAction,
  };

  const self: Plot = { pars, ...props, ...methods };

  window.addEventListener(`resize`, throttle(resize.bind(self), 10));
  window.addEventListener(`keydown`, onKeydown.bind(self));
  window.addEventListener(`keyup`, onKeyup.bind(self));
  container.addEventListener(`mousedown`, onMousedown.bind(self));
  container.addEventListener(`mousemove`, throttle(onMousemove.bind(self), 20));
  container.addEventListener(`mouseup`, onMouseup.bind(self));
  container.addEventListener(`dblclick`, onDoubleclick.bind(self));
  container.addEventListener(`contextmenu`, onContextmenu.bind(self));

  self.addKeyAction(`KeyQ`, () => (self.pars.mode = Mode.Query));
  self.addKeyAction(`BracketRight`, () => self.scaleAlpha(10 / 9));
  self.addKeyAction(`BracketLeft`, () => self.scaleAlpha(9 / 10));
  self.addKeyAction(`KeyR`, () => (self.reset(), self.render()));
  self.addKeyAction(`KeyP`, showWidgetDisplay.bind(self));
  self.addKeyAction(`KeyZ`, zoom.bind(self));
  self.addKeyAction(`KeyX`, unzoom.bind(self));

  selectionRect.listen(`changed`, throttle(checkSelection.bind(self), 20));

  self.pushGraphicObject(newAxisLabels(scales.x));
  self.pushGraphicObject(newAxisLabels(scales.y));
  self.pushGraphicObject(newAxisTitle(scales.x));
  self.pushGraphicObject(newAxisTitle(scales.y));
  self.pushGraphicObject(selectionRect);
  scene.addPlot(self);

  for (const s of values(self.scales)) s.listen(`changed`, () => self.render());
  return self;
}

/* --------------------------------- Methods -------------------------------- */

function resize(this: Plot) {
  const { contexts, scales, container, pars } = this;

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

  if (pars.aspectRatio != undefined) {
    const { x, y } = scales;
    const [xRatio, yRatio] = [x, y].map((x) => x.ratio());

    const currentRatio = xRatio / yRatio;
    if (currentRatio === 0 || isNaN(currentRatio) || !isFinite(currentRatio)) {
      return;
    }

    const [width, height] = [x, y].map(
      (x) => x.codomain.range() / x.norm.range()
    );

    if (width > height) scales.x.norm.expand!(currentRatio);
    else scales.y.norm.expand!(1 / currentRatio);
  }

  this.render();
}

function activate(this: Plot) {
  this.pars.active = true;
  this.container.classList.add(`active`);
}

function deactivate(this: Plot) {
  this.pars.active = false;
  this.container.classList.remove(`active`);
  this.selectionRect.clear();
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
    if (v.domain) scale.setDomain(v.domain.clone());
    if (v.hasName()) scale.setName(v.name());
  }

  for (const v of [`height`, `width`, `area`] as (keyof Scales)[]) {
    scales[v].setMin(0);
  }

  this.render();
}

function render(this: Plot) {
  for (const c of Object.values(this.contexts)) c.clear();
  for (const o of this.graphicObjects) if (o.render) o.render(this.contexts);
  return this;
}

function reset(this: Plot) {
  const { container, scales, contexts, selectionRect, zoomStack } = this;
  const { clientWidth: width, clientHeight: height } = container;
  const [bottom, left, top, right] = getMargins();

  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  for (const v of values(scales)) v.norm.defaultize();
  scales.size.codomain.defaultize();

  scales.width.codomain.setMax(innerWidth).setScale(1);
  scales.height.codomain.setMax(innerHeight).setScale(1);
  scales.area.codomain.setMax(Math.min(innerWidth, innerHeight)).setScale(1);

  selectionRect.clear();
  zoomStack.clear();

  for (const context of values(contexts)) context.setProps({ globalAlpha: 1 });
  this.render();
}

function pushGraphicObject(this: Plot, object: GraphicObject) {
  this.graphicObjects.push(object);
  if (object.keyActions) {
    for (const [k, v] of entries(object.keyActions) as any[]) {
      this.addKeyAction(k, v);
    }
  }

  this.render();
}

function addKeyAction(
  this: Plot,
  key: ActionKey,
  action: (event: KeyboardEvent) => void
) {
  if (!this.localKeyActions[key]) this.localKeyActions[key] = action;
  else this.localKeyActions[key] = inOrder(this.localKeyActions[key]!, action);
}

function setAlpha(this: Plot, value: number) {
  const { contexts } = this;
  for (const layer of baseLayers) {
    const context = contexts[layer];
    context.setProps({ globalAlpha: value });
  }
  this.render();
}

function scaleAlpha(this: Plot, value: number) {
  const { contexts } = this;
  for (const layer of baseLayers) {
    const context = contexts[layer];
    const alpha = context.getProp(`globalAlpha`);
    context.setProps({ globalAlpha: trunc0to1(alpha * value) });
  }
  this.render();
}

function setAspectRatio(this: Plot, value: number) {
  const { x, y } = this.scales;

  if (!isScaleContinuous(x) || !isScaleContinuous(y)) return this;

  this.pars.aspectRatio = value;
  this.resize();

  return this;
}

function showWidgetDisplay(this: Plot, event: KeyboardEvent) {
  event.preventDefault();
  if (this.widgetDisplay.initialized) this.widgetDisplay.show();
  else {
    for (const key of [`x`, `y`] as const) {
      const widget = this.scales[key].widget();
      if (widget) this.widgetDisplay.addWidget(widget);
    }
    this.widgetDisplay.show();
    this.widgetDisplay.initialized = true;
  }
}

function checkSelection(this: Plot) {
  const { scene, graphicObjects, selectionRect } = this;
  const { coords } = selectionRect;
  const selected = new Set<number>();

  if (coords.every((x) => x === 0)) {
    scene.marker.update(selected);
    return;
  }

  for (const s of graphicObjects) {
    if (s.check) mergeInto(selected, s.check(coords));
  }

  this.scene.marker.update(selected);
}

function zoom(this: Plot) {
  const { scales, selectionRect, zoomStack } = this;
  let [x0, y0, x1, y1] = selectionRect.coords;

  if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) return;

  const { x, y } = scales;

  x0 = x.norm.normalize(trunc0to1(x.codomain.normalize(x0)));
  x1 = x.norm.normalize(trunc0to1(x.codomain.normalize(x1)));
  y0 = y.norm.normalize(trunc0to1(y.codomain.normalize(y0)));
  y1 = y.norm.normalize(trunc0to1(y.codomain.normalize(y1)));

  [x0, x1] = [x0, x1].sort(diff);
  [y0, y1] = [y0, y1].sort(diff);

  zoomStack.push([x0, y0, x1, y1]);
  const [ix0, iy0, ix1, iy1] = zoomStack.current();
  const [widthStretch, heightStretch, areaStretch] = zoomStack.currentStretch();

  scales.x.norm.setMin(ix0).setMax(ix1);
  scales.y.norm.setMin(iy0).setMax(iy1);
  scales.width.codomain.setScale(widthStretch);
  scales.height.codomain.setScale(heightStretch);
  scales.area.codomain.setScale(squareRoot(areaStretch));
  scales.size.codomain.setScale(squareRoot(areaStretch));

  selectionRect.clear();
  this.render();
}

function unzoom(this: Plot) {
  const { zoomStack, scales } = this;

  console.log(scales.x.norm);

  if (zoomStack.isEmpty()) return;

  zoomStack.pop();

  console.log(zoomStack.current());

  const [ix0, iy0, ix1, iy1] = zoomStack.current();
  const [widthStretch, heightStretch, areaStretch] = zoomStack.currentStretch();

  scales.x.norm.setMin(ix0).setMax(ix1);
  scales.y.norm.setMin(iy0).setMax(iy1);
  scales.width.codomain.setScale(widthStretch);
  scales.height.codomain.setScale(heightStretch);
  scales.area.codomain.setScale(squareRoot(areaStretch));
  scales.size.codomain.setScale(squareRoot(areaStretch));

  this.render();
}

/* ----------------------------- Event Handlers ----------------------------- */

function onMousedown(this: Plot, event: MouseEvent) {
  const { scene, container, selectionRect } = this;

  scene.deactivateAllExcept(this);

  this.activate();
  this.pars.mousedown = true;
  this.pars.mousebutton = event.button;

  if (event.button === MouseButton.Left) this.pars.mode = Mode.Select;
  if (event.button === MouseButton.Right) this.pars.mode = Mode.Pan;

  if (this.pars.mode === Mode.Select) {
    const { clientHeight } = container;
    const x = event.offsetX;
    const y = clientHeight - event.offsetY;

    selectionRect.setCoords([x, y, x, y]);
  }
}

function onMouseup(this: Plot) {
  this.pars.mousedown = false;
}

function onMousemove(this: Plot, event: MouseEvent) {
  switch (this.pars.mode) {
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
  if (!self.pars.active || !self.pars.mousedown) return self;

  const { container, selectionRect } = self;
  const { clientHeight } = container;

  const x = event.offsetX;
  const y = clientHeight - event.offsetY;

  const { coords } = selectionRect;
  selectionRect.setCoords([coords[0], coords[1], x, y]);

  return self;
}

function onMousemovePan(self: Plot, event: MouseEvent) {
  if (!self.pars.active || !self.pars.mousedown) return self;

  const { scales } = self;
  const { lastX, lastY } = self.pars;
  const { clientWidth, clientHeight } = self.container;

  const x = event.offsetX;
  const y = clientHeight - event.offsetY;
  const xMove = (x - lastX) / clientWidth;
  const yMove = (y - lastY) / clientHeight;

  scales.x.move(xMove);
  scales.y.move(yMove);

  self.pars.lastX = x;
  self.pars.lastY = y;

  return self;
}

function onMousemoveQuery(self: Plot, event: MouseEvent) {
  const { offsetX, offsetY } = event;
  const { clientHeight } = self.container;

  const x = offsetX;
  const y = clientHeight - offsetY;

  let result;

  for (const q of self.graphicObjects) {
    result = q.query?.([x, y]);
    if (result) break;
  }

  if (!result) self.queryDisplay.clear();
  else self.queryDisplay.renderQuery([x, y], result);

  return self;
}

function onContextmenu(this: Plot, event: MouseEvent) {
  event.preventDefault();
  this.selectionRect.clear();
  this.pars.mousebutton = MouseButton.Right;
  this.pars.lastX = event.offsetX;
  this.pars.lastY = this.container.clientHeight - event.offsetY;
}

function onDoubleclick(this: Plot) {
  this.deactivate();
  this.scene.marker.clearAll();
}

function onKeydown(this: Plot, event: KeyboardEvent) {
  if (event.code === "KeyQ" && event.code === this.pars.lastKey) return;
  this.queryDisplay.clear();

  this.globalKeyActions[event.code as ActionKey]?.(event);
  if (this.pars.active) this.localKeyActions[event.code as ActionKey]?.(event);
  this.pars.lastKey = event.code;
}

function onKeyup(this: Plot) {
  this.pars.mode = Mode.Select;
  this.pars.lastKey = "";
  this.queryDisplay.clear();
}
