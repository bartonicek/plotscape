import {
  diff,
  element,
  entries,
  inOrder,
  invertRange,
  mergeInto,
  rangeInverse,
  square,
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
import { Scale, ScaleType, isScaleContinuous, newScale } from "../scales/Scale";
import { Scene } from "../scene/Scene";
import {
  ActionKey,
  GraphicObject,
  HexColour,
  KeyActions,
  Variables,
} from "../types";
import { WidgetSource } from "../widgets/WidgetSource";
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

/** Displays data and handles interaction. */
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

  widgetSources: WidgetSource[];

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
  addGraphicObject(object: GraphicObject): void;
  addWidgetSource(source: WidgetSource): void;
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

  const def = { default: true };

  scales.x.setOther(scales.y).setAes(`x`);
  scales.y.setOther(scales.x).setAes(`y`);

  scales.size.codomain.setMax(10, def).setTransform(square, squareRoot);
  scales.size.setType(ScaleType.Ratio);

  scales.area.codomain.setTransform(square, squareRoot);
  scales.area.setType(ScaleType.Ratio);

  scales.width.setMax(1 - 2 * dnx, def);
  scales.height.setMax(1 - 2 * dny, def);

  scales.width.freezeZero();
  scales.height.freezeZero();

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
  const widgetDisplay = newWidgetDisplay(scene.container);
  const widgetSources = [] as WidgetSource[];

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
    widgetSources,
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
    addGraphicObject,
    addWidgetSource,
    addKeyAction,
  };

  const self: Plot = { pars, ...props, ...methods };

  window.addEventListener(`resize`, throttle(resize.bind(self), 10));
  window.addEventListener(`keydown`, onKeydown.bind(self));
  window.addEventListener(`keyup`, onKeyup.bind(self));

  container.addEventListener(`mousedown`, onMousedown.bind(self));
  container.addEventListener(`mouseup`, onMouseup.bind(self));
  container.addEventListener(`mousemove`, throttle(onMousemove.bind(self), 20));
  container.addEventListener(`dblclick`, onDoubleclick.bind(self));
  container.addEventListener(`contextmenu`, onContextmenu.bind(self));

  const resizeObserver = new ResizeObserver(throttle(resize.bind(self), 10));
  resizeObserver.observe(container);

  self.addKeyAction(`BracketRight`, () => self.scaleAlpha(10 / 9));
  self.addKeyAction(`BracketLeft`, () => self.scaleAlpha(9 / 10));
  self.addKeyAction(`KeyR`, () => (self.reset(), self.render()));
  self.addKeyAction(`KeyP`, showWidgetDisplay.bind(self));
  self.addKeyAction(`KeyZ`, zoom.bind(self));
  self.addKeyAction(`KeyX`, unzoom.bind(self));
  self.addKeyAction(`KeyS`, () => {
    container.style.resize = `both`;
    container.style.overflow = `hidden`;
  });
  self.addKeyAction(`KeyQ`, () => {
    for (const p of scene.plots) p.pars.mode = Mode.Query;
  });

  selectionRect.listen(throttle(checkSelection.bind(self), 20));

  self.addGraphicObject(newAxisLabels(scales.x));
  self.addGraphicObject(newAxisLabels(scales.y));
  self.addGraphicObject(newAxisTitle(scales.x));
  self.addGraphicObject(newAxisTitle(scales.y));
  self.addGraphicObject(selectionRect);
  scene.addPlot(self);

  self.addWidgetSource(self.scales.x);
  self.addWidgetSource(self.scales.y);

  for (const s of values(self.scales)) s.listen(() => self.render());
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

  // if (pars.aspectRatio != undefined) {
  //   const { x, y } = scales;
  //   const [xRatio, yRatio] = [x, y].map((x) => x.ratio());

  //   const currentRatio = xRatio / yRatio;
  //   if (currentRatio === 0 || isNaN(currentRatio) || !isFinite(currentRatio)) {
  //     return this;
  //   }

  //   const [width, height] = [x, y].map(
  //     (x) => x.codomain.range() / x.norm.range()
  //   );

  //   // if (width > height) scales.x.norm.expand(-currentRatio);
  //   // else scales.y.norm.expand(1 / currentRatio);
  // }

  this.scene.marker.clearTransient();
  this.selectionRect.clear();
  this.render();
  return this;
}

function activate(this: Plot) {
  this.pars.active = true;
  this.container.classList.add(`active`);
  return this;
}

function deactivate(this: Plot) {
  this.pars.active = false;
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
  const { scales, widgetDisplay } = this;
  const { defaultNormX: dnx, defaultNormY: dny } = graphicParameters;

  widgetDisplay.setInitialized(false);
  const def = { default: true };

  for (const [k, v] of entries(trainers) as [keyof Scales, any][]) {
    const scale = scales[k];

    if (!scale || !v) continue;
    if (v.domain) {
      if (scale.domain.matches(v.domain)) scale.domain.copyFrom(v.domain);
      else scale.setDomain(v.domain.clone());
    }

    if (v.hasName()) scale.setName(v.name());
  }

  for (const v of [`height`, `width`, `area`] as const) {
    scales[v].setMin(0);
  }

  scales.x.setZeroOne(dnx, 1 - dnx, def);
  scales.y.setZeroOne(dny, 1 - dny, def);

  scales.width.setZeroOne(0, 1 - 2 * dnx).freezeZero();
  scales.height.setZeroOne(0, 1 - 2 * dny).freezeZero();
  return this;
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

  for (const v of values(scales)) v.domain.defaultize();

  const def = { default: true };

  scales.width.codomain.setMax(innerWidth, def).defaultize();
  scales.height.codomain.setMax(innerHeight, def).defaultize();
  scales.area.codomain
    .setMax(Math.min(innerWidth, innerHeight), def)
    .defaultize();

  selectionRect.clear();
  zoomStack.clear();

  for (const context of values(contexts)) context.setProps({ globalAlpha: 1 });

  this.render();
  return this;
}

function addGraphicObject(this: Plot, object: GraphicObject) {
  this.graphicObjects.push(object);
  if (object.keyActions) {
    for (const [k, v] of entries(object.keyActions) as any[]) {
      this.addKeyAction(k, v);
    }
  }

  this.render();
  return this;
}

function addWidgetSource(this: Plot, source: WidgetSource) {
  this.widgetSources.push(source);
  return this;
}

function addKeyAction(
  this: Plot,
  key: ActionKey,
  action: (event: KeyboardEvent) => void
) {
  const { localKeyActions } = this;
  if (!localKeyActions[key]) localKeyActions[key] = action;
  else localKeyActions[key] = inOrder(localKeyActions[key]!, action);
  return this;
}

function setAlpha(this: Plot, value: number) {
  const { contexts } = this;
  for (const layer of baseLayers) {
    const context = contexts[layer];
    context.setProps({ globalAlpha: value });
  }
  this.render();
  return this;
}

function scaleAlpha(this: Plot, value: number) {
  const { contexts } = this;
  for (const layer of baseLayers) {
    const context = contexts[layer];
    const alpha = context.getProp(`globalAlpha`);
    context.setProps({ globalAlpha: trunc0to1(alpha * value) });
  }
  this.render();
  return this;
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

  const { widgetDisplay, widgetSources } = this;

  if (widgetDisplay.isInitialized()) widgetDisplay.show();
  else {
    // Delayed initialization so that e.g. scales can be trained
    widgetDisplay.clear();

    for (const source of widgetSources) {
      const widget = source.widget();
      if (widget) widgetDisplay.addWidget(widget.render());
    }

    widgetDisplay.setInitialized(true).show();
  }
  return this;
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
  return this;
}

function zoom(this: Plot) {
  const { scales, selectionRect, zoomStack } = this;
  let [x0, y0, x1, y1] = selectionRect.coords;

  // If zoom area is too small, do nothing
  if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) return;

  const { x, y } = scales;

  [x0, x1] = [x0, x1].map((e) => trunc0to1(x.codomain.normalize(e))).sort(diff);
  [y0, y1] = [y0, y1].map((e) => trunc0to1(y.codomain.normalize(e))).sort(diff);
  const xStretch = rangeInverse(x0, x1);
  const yStretch = rangeInverse(y0, y1);

  scales.x.expand(x0, x1);
  scales.y.expand(y0, y1);

  // TODO: Properly implement scale delegation
  if (scales.width != scales.area) {
    scales.width.codomain.setScale((s) => s * xStretch);
  }

  if (scales.height != scales.area) {
    scales.height.codomain.setScale((s) => s * yStretch);
  }

  scales.area.codomain.setScale((s) => {
    const c = Math.sqrt(Math.max(xStretch, yStretch));
    return s * c;
  });

  zoomStack.push([x0, y0, x1, y1]);
  selectionRect.clear();
  this.render();
  return this;
}

function unzoom(this: Plot) {
  const { zoomStack, scales, selectionRect } = this;

  if (zoomStack.isEmpty()) return;

  const [x0, y0, x1, y1] = zoomStack.current();

  const [ix0, ix1] = invertRange(x0, x1);
  const [iy0, iy1] = invertRange(y0, y1);
  const xStretch = rangeInverse(ix0, ix1);
  const yStretch = rangeInverse(iy0, iy1);

  scales.x.expand(ix0, ix1);
  scales.y.expand(iy0, iy1);

  if (scales.width != scales.area) {
    scales.width.codomain.setScale((s) => s * xStretch);
  }

  if (scales.height != scales.area) {
    scales.height.codomain.setScale((s) => s * yStretch);
  }

  scales.area.codomain.setScale((s) => {
    const c = Math.sqrt(Math.max(1 / xStretch, 1 / yStretch));
    return s / c;
  });

  zoomStack.pop();
  selectionRect.clear();
  this.render();
  return this;
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
  this.container.style.resize = `none`;
  this.container.style.overflow = `visible`;
  this.pars.mode = Mode.Select;
  this.pars.lastKey = "";
  this.queryDisplay.clear();
}
