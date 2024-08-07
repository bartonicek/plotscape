import { Dict, diff, element, rep } from "utils";
import { Dataframe } from "../dataframe/Dataframe";
import { getMargins, processBaseColor } from "../funs";
// @ts-ignore
import { graphicParameters } from "../graphicParameters";
import { helpHTMLString } from "../helpHTMLString";
import { Plot } from "../plot/Plot";
import { PlotKey, PlotMap, plotMap } from "../plots/plotMap";
import { HexColour, KeyActions, Variables } from "../types";
import { Group, GroupOrder, Transient, newGroupOrderer } from "./GroupOrder";
import { Marker, newMarker } from "./Marker";

/* -------------------------------- Interface ------------------------------- */

/** Provides a graphical/state context into which plots get placed.
 * Orchestrates resizing, layout, and between-plot interaction.
 */
export interface Scene<T extends Variables = any> {
  data: Dataframe<T>;
  container: HTMLDivElement;

  groupOrder: GroupOrder;
  marker: Marker;
  plots: Plot[];

  hasLayout: boolean;
  keyActions: KeyActions;

  socket?: WebSocket;

  addPlot(plot: Plot): this;
  addPlotByKey<K extends PlotKey>(
    key: K,
    selectfn: Parameters<PlotMap[K]>[1],
    options: Dict
  ): this;

  updateMargins(): void;
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

export namespace Scene {
  export const from = newScene;
}

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
  data: Dataframe<T>,
  options?: { websocketURL?: string; pointQueries?: keyof T | (keyof T)[] }
): Scene<T> {
  const container = element(`div`)
    .addClass(`ps-scene-container`)
    .appendTo(app)
    .get();

  const plots = [] as Plot[];

  if (options?.pointQueries) {
    if (!Array.isArray(options.pointQueries)) {
      options.pointQueries = [options.pointQueries];
    }
    for (const q of options.pointQueries) data.col(q).setQueryable(true);
  }

  const groupOrder = newGroupOrderer();
  const marker = newMarker(data.n(), groupOrder);
  const keyActions: KeyActions = {};
  const hasLayout = false;

  const props = {
    container,
    data,
    groupOrder,
    marker,
    hasLayout,
    plots,
    keyActions,
  };

  const methods = {
    addPlot,
    addPlotByKey,
    setGroup,
    setLayout,
    updateMargins,
    setDimensions,
    deactivateAll,
    deactivateAllExcept,
  };

  const self = { ...props, ...methods };
  self.updateMargins();

  keyActions[`Digit1`] = () => self.setGroup(Group.Group2);
  keyActions[`Digit2`] = () => self.setGroup(Group.Group3);
  keyActions[`Digit3`] = () => self.setGroup(Group.Group4);
  keyActions[`KeyC`] = () => {
    self.groupOrder.cycle();
    self.marker.cycleGroups();
    for (const p of self.plots) p.cycleGroups();
  };

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

  // Set up a websocket connection
  if (options?.websocketURL) {
    const socket = new WebSocket(options.websocketURL);

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ sender: "figure", type: "connected" }));
    });

    socket.addEventListener("message", (message) => {
      message = JSON.parse(message.data);

      if (message?.type === "mark") {
        let { indices, group } = message.data;
        if (!Array.isArray(indices) && typeof group != "number") {
          throw new Error(`Invalid data for message mark: ${message.data}`);
        }

        const currentGroup = self.marker.group;
        indices = new Set(indices);

        self.marker.setGroup(group).update(indices).setGroup(currentGroup);
      } else if (message?.type === "selected") {
        const group = message.data.group as number[];
        const { positions } = marker;

        const data = {} as Record<number, number[]>;
        for (const g of group) {
          if (positions[g].size) data[g] = Array.from(positions[g]).sort(diff);
        }

        socket.send(
          JSON.stringify({ sender: "figure", type: "selected", data })
        );
      }
    });

    (self as Scene).socket = socket;
  }

  return self;
}

/* --------------------------------- Methods -------------------------------- */

function updateMargins(this: Scene) {
  const margins = getMargins();
  const docStyle = document.documentElement.style;

  for (const [i, e] of [`b`, `l`, `t`, `r`].entries()) {
    docStyle.setProperty(`--${e}margin`, `${margins[i]}px`);
  }
}

function setDimensions(this: Scene, rows: number, cols: number) {
  this.container.style.gridTemplateColumns = Array(cols).fill(`1fr`).join(" ");
  this.container.style.gridTemplateRows = Array(rows).fill(`1fr`).join(" ");
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
  selectfn: Parameters<PlotMap[K]>[1],
  options: Dict
) {
  const constructor = plotMap[key];
  constructor(this, selectfn as any, options);
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
  this.setGroup(Transient);
}

const { groupColors } = graphicParameters;
export const colors = groupColors.slice() as HexColour[];
const n = colors.length;
for (let i = 0; i < n; i++) colors.push(processBaseColor(colors[i]));
