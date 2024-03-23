import { element } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { getMargins } from "../funs";
import { Plot } from "../plot/Plot";
import { Group, KeyActions, Variables } from "../types";
import { Marker, newMarker } from "./Marker";

/* -------------------------------- Interface ------------------------------- */

export interface Scene<T extends Variables = any> {
  data: Dataframe<T>;
  container: HTMLDivElement;

  marker: Marker;
  plots: Plot[];

  keyActions: KeyActions;

  addPlot(plot: Plot): this;
  setDimensions(rows: number, cols: number): this;
  deactivateAll(): this;
  deactivateAllExcept(keepActive: Plot): this;
  setGroup(group: Group): this;
}

/* ------------------------------- Constructor ------------------------------ */

export function newScene<T extends Variables>(
  app: HTMLDivElement,
  data: Dataframe<T>
): Scene<T> {
  const container = element(`div`)
    .addClass(`ps-scene-container`)
    .appendTo(app)
    .get();

  const plots = [] as Plot[];

  const margins = getMargins();
  const documentElement = document.documentElement;
  documentElement.style.setProperty("--bmargin", `${margins[0]}px`);
  documentElement.style.setProperty("--lmargin", `${margins[1]}px`);
  documentElement.style.setProperty("--tmargin", `${margins[2]}px`);
  documentElement.style.setProperty("--rmargin", `${margins[3]}px`);

  const marker = newMarker(data.n());
  const keyActions: KeyActions = {};

  const props = { container, data, marker, plots, keyActions };
  const methods = {
    addPlot,
    setDimensions,
    deactivateAll,
    deactivateAllExcept,
    setGroup,
  };

  const self = { ...props, ...methods };

  keyActions[`Digit1`] = () => self.setGroup(Group.Group2);
  keyActions[`Digit2`] = () => self.setGroup(Group.Group3);
  keyActions[`Digit3`] = () => self.setGroup(Group.Group4);

  container.addEventListener("mousedown", onMousedown.bind(self));
  window.addEventListener("keydown", onKeydown.bind(self));
  window.addEventListener("keyup", onKeyup.bind(self));

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function setDimensions(this: Scene, rows: number, cols: number) {
  document.documentElement.style.setProperty("--ncols", cols.toString());
  document.documentElement.style.setProperty("--nrows", rows.toString());
  for (const plot of this.plots) plot.resize();
  return this;
}

function addPlot(this: Scene, plot: Plot) {
  this.container.append(plot.container);
  this.plots.push(plot);

  const nCols = Math.ceil(Math.sqrt(this.plots.length));
  const nRows = Math.ceil(this.plots.length / nCols);
  this.setDimensions(nRows, nCols);
  return this;
}

function deactivateAll(this: Scene) {
  for (const plot of this.plots) plot.deactivate();
  return this;
}

function deactivateAllExcept(this: Scene, keepActive: Plot) {
  for (const plot of this.plots) {
    if (plot === keepActive) continue;
    plot.deactivate();
  }
  return this;
}

function setGroup(this: Scene, group: Group) {
  this.marker.setGroup(group);
  return this;
}

function onMousedown(this: Scene, event: MouseEvent) {
  if (event.target === this.container) this.deactivateAll();
}

function onKeydown(this: Scene, event: KeyboardEvent) {
  this.keyActions[event.code as keyof KeyActions]?.(event);
  return this;
}

function onKeyup(this: Scene) {
  this.setGroup(Group.Transient);
}
