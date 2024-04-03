import { element, rep } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { getMargins } from "../funs";
// @ts-ignore
import helpHTMLString from "../help.html?raw";
import { Plot } from "../plot/Plot";
import { PlotKey, PlotMap, plotMap } from "../plots/plotMap";
import { Group, KeyActions, Variables } from "../types";
import { Marker, newMarker } from "./Marker";

/* -------------------------------- Interface ------------------------------- */

/** Provides a graphical/state context into which plots get placed.
 * Orchestrates resizing, layout, and between-plot interaction.
 */
export interface Scene<T extends Variables = any> {
  data: Dataframe<T>;
  container: HTMLDivElement;

  marker: Marker;
  plots: Plot[];

  hasLayout: boolean;
  keyActions: KeyActions;

  addPlot(plot: Plot): this;
  addPlotByKey<K extends PlotKey>(
    key: K,
    selectfn: Parameters<PlotMap[K]>[1]
  ): this;

  setDimensions(rows: number, cols: number): this;
  setLayout(layour: number[][]): this;
  setGroup(group: Group): this;

  deactivateAll(): this;
  deactivateAllExcept(keepActive: Plot): this;
}

/* ------------------------------- Constructor ------------------------------ */
const parser = new DOMParser();
const helpHTML = parser.parseFromString(
  helpHTMLString.replace(/(\r\n|\n|\r)/gm, ""),
  "text/html"
).body;

/**
 * Creates a new scene object that provides a graphical/state context
 * into which plots get placed.
 *
 * @param app A `<div>` element that the figure will be mounted to.
 * @param data A dataframe
 * @returns The scene object
 */
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
  const hasLayout = false;

  const props = { container, data, marker, hasLayout, plots, keyActions };
  const methods = {
    addPlot,
    addPlotByKey,
    setGroup,
    setLayout,
    setDimensions,
    deactivateAll,
    deactivateAllExcept,
  };

  const self = { ...props, ...methods };

  keyActions[`Digit1`] = () => self.setGroup(Group.Group2);
  keyActions[`Digit2`] = () => self.setGroup(Group.Group3);
  keyActions[`Digit3`] = () => self.setGroup(Group.Group4);

  container.addEventListener("mousedown", onMousedown.bind(self));
  window.addEventListener("keydown", onKeydown.bind(self));
  window.addEventListener("keyup", onKeyup.bind(self));

  const helpModal = element(`dialog`)
    .appendTo(container)
    .append(helpHTML)
    .addClass(`ps-help-modal`)
    .get();

  const helpButton = element(`button`)
    .appendTo(container)
    .addClass(`ps-help-button`)
    .text(`?`)
    .get();

  helpButton.onclick = () => helpModal.showModal();
  helpModal.onclick = () => helpModal.close();

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function setDimensions(this: Scene, rows: number, cols: number) {
  document.documentElement.style.setProperty("--ncols", cols.toString());
  document.documentElement.style.setProperty("--nrows", rows.toString());
  for (const plot of this.plots) plot.resize();
  return this;
}

function setLayout(this: Scene, layout: number[][]) {
  const { container, plots } = this;

  let layoutString = ``;
  for (const row of layout) {
    const rowString = `"${row.map((x) => `p${x}`).join(` `)}"`;
    layoutString += rowString;
  }

  for (let i = 0; i < plots.length; i++) {
    plots[i].container.style.gridArea = `p${i + 1}`;
  }

  container.style.gridTemplateRows = rep(`1fr`, layout.length).join(` `);
  container.style.gridTemplateColumns = rep(`1fr`, layout[0].length).join(` `);
  container.style.gridTemplateAreas = layoutString;
  for (const plot of this.plots) plot.resize();

  this.hasLayout = true;
  return this;
}

function addPlot(this: Scene, plot: Plot) {
  this.container.append(plot.container);
  this.plots.push(plot);

  if (this.hasLayout) plot.container.style.gridArea = `p${this.plots.length}`;

  const nCols = Math.ceil(Math.sqrt(this.plots.length));
  const nRows = Math.ceil(this.plots.length / nCols);
  this.setDimensions(nRows, nCols);
  return this;
}

function addPlotByKey<K extends PlotKey>(
  this: Scene,
  key: K,
  selectfn: Parameters<PlotMap[K]>[1]
) {
  const constructor = plotMap[key];
  constructor(this, selectfn as any);
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
