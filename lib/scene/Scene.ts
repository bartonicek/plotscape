import { CanvasFrame } from "../plot/CanvasFrame";
import { Plot } from "../plot/Plot";
import { Reducer } from "../transformation/Reducer";
import { Dataframe } from "../utils/Dataframe";
import { DOM } from "../utils/DOM";
import {
  deepModifyProp,
  fetchJSON,
  filterIndices,
  isStringArray,
  keysToSelectors,
  last,
  remove,
  seq,
  splitNumericSuffix,
  stringifyFunction,
  throttle,
  tw,
} from "../utils/funs";
import { Metadata } from "../utils/Metadata";
import { Reactive } from "../utils/Reactive";
import { Columns, KeyboardKey } from "../utils/types";
import { defaultOptions, GraphicalOptions } from "./defaultOptions";
import { KeybindingsMenu } from "./KeybindingsMenu";
import { Group, GroupId, Marker, Transient } from "./Marker";

export interface Scene<T extends Columns = Columns>
  extends Reactive<Scene.Event> {
  data: T;

  container: HTMLDivElement;
  plotsContainer: HTMLDivElement;
  queryTable: HTMLTableElement;

  echo: boolean;
  client?: WebSocket;

  active: boolean;
  rows: number;
  cols: number;

  marker: Marker;

  plots: Plot[];
  activePlotIndex?: number;
  plotIndicesByType: Record<Plot.Type, number[]>;

  keybindings: Record<string, Scene.Event | Plot.Event>;
  options: GraphicalOptions;
}

export namespace Scene {
  export type Event =
    | `changed`
    | `activate`
    | `reset`
    | `resize`
    | `set-layout`
    | `clear-layout`
    | `connected`
    | `set-dims`
    | `get-plot-ids`
    | `get-plot`
    | `add-plot`
    | `pop-plot`
    | `render`
    | `remove-plot`
    | `set-selected`
    | `set-assigned`
    | `set-parameters`
    | `get-selected`
    | `get-assigned`
    | `get-scale`
    | `normalize`
    | `clear-selection`
    | `set-scale`
    | `zoom`
    | `query-mode`
    | `group-1`
    | `group-2`
    | `group-3`
    | KeyboardKey;

  export function of<T extends Columns>(
    data: T,
    options?: {
      id?: string;
      echo?: boolean;
      websocketURL?: string;
    } & Partial<GraphicalOptions>,
  ): Scene<T> {
    Dataframe.checkLength(data);

    const container = DOM.element(`div`, { id: `scene-container` });
    const plotsContainer = DOM.element(`div`, { id: `plots-container` });

    DOM.addClasses(
      container,
      tw(
        "tailwind tw-pr-15 tw-relative tw-flex tw-h-full tw-w-full tw-content-center tw-items-center tw-justify-center tw-bg-[#deded9] tw-p-10",
      ),
    );

    DOM.addClasses(
      plotsContainer,
      tw(
        "tw-grid tw-h-full tw-w-full tw-grid-cols-1 tw-grid-rows-1 tw-gap-[1em]",
      ),
    );

    const queryTable = DOM.element(`table`, {
      classes: tw(
        "tw-absolute [&]:tw-w-fit [&]:tw-h-fit tw-z-30 tw-bg-gray-100 tw-shadow-md",
      ),
    });
    DOM.setStyles(queryTable, { pointerEvents: `none` });

    const keybindings = { ...Scene.keybindings, ...Plot.keybindings };
    const keybindingsMenu = KeybindingsMenu.of(keybindings);

    DOM.append(container, plotsContainer);
    DOM.append(container, keybindingsMenu);
    DOM.append(container, queryTable);

    const [rows, cols, active] = [1, 1, false];
    const marker = Marker.of(Object.values(data)[0].length);
    const plots = [] as Plot[];
    const plotIndicesByType = {} as Record<Plot.Type, number[]>;
    const client = undefined as WebSocket | undefined;
    const echo = options?.echo ?? false;
    const opts = Object.assign(defaultOptions, options);

    for (const [k, v] of Object.entries(data)) {
      if (!Metadata.hasMetadata(v)) (data as any)[k] = Metadata.of(v);
      if (!Metadata.has(v, `name`)) Metadata.set(v, { name: k });
    }

    const scene = Reactive.of()({
      data,
      container,
      plotsContainer,
      queryTable,
      rows,
      cols,
      active,
      echo,
      marker,
      client,
      plots,
      plotIndicesByType,
      options: opts,
      keybindings,
    });

    if (options?.websocketURL) {
      const client = new WebSocket(options.websocketURL);

      const msg = { sender: `scene`, target: `server`, type: `connected` };
      client.addEventListener(`open`, () => client.send(JSON.stringify(msg)));
      client.addEventListener(`message`, (msg) => {
        handleMessage(scene, JSON.parse(msg.data));
      });

      window.addEventListener(`beforeunload`, () => client.close());
      scene.client = client;
    }

    setupEvents(scene);
    return scene;
  }

  export async function ofAsync(
    url: string,
    options?: {
      websocketURL?: string;
    } & Partial<GraphicalOptions>,
  ) {
    const data = await fetchJSON(url);
    return Scene.of(data, options);
  }

  export function append(parent: HTMLElement, scene: Scene) {
    parent.appendChild(scene.container);
    Scene.resize(scene);
  }

  export function addPlot(scene: Scene, plot: Plot) {
    const { plotsContainer, marker, plots, plotIndicesByType } = scene;

    Reactive.listen(plot, `activated`, () => {
      for (const p of plots) if (p != plot) Reactive.dispatch(p, `deactivate`);
      const plotIndex = plots.indexOf(plot);
      scene.activePlotIndex = plotIndex;
    });

    Reactive.listen(plot, `lock-others`, () => {
      for (const p of plots) {
        if (p !== plot) {
          Plot.clearUserFrame(p);
          Reactive.dispatch(p, `lock`);
        }
      }
    });

    Reactive.listen(plot, `set-selected`, (data) => {
      Marker.update(marker, data!.cases);
    });

    Reactive.listen(plot, `clear-transient`, () => {
      for (const p of plots) Plot.clearUserFrame(p);
      Marker.clearTransient(marker);
    });

    Reactive.listen(plot, `render-all`, () => {
      for (const p of plots) Reactive.dispatch(p, `render`);
    });

    const { type } = plot;
    if (!plotIndicesByType[type]) plotIndicesByType[type] = [];
    plotIndicesByType[type].push(plots.length);
    plots.push(plot);

    Plot.append(plotsContainer, plot);
    plot.queryTable = scene.queryTable;

    updatePlotIds(scene);
    autoUpdateDimensions(scene);

    Scene.resize(scene);
  }

  export function addPlotBySpec<T extends Columns>(
    scene: Scene<T>,
    spec?: {
      type?: Plot.Type;
      variables?: (keyof T)[];
      ratio?: number;
      reducer?: Reducer.Name | Reducer | Reducer.Stringified;
      queries?: string[] | [string, Reducer.Name | Reducer][];
    },
  ) {
    const { type, variables, reducer: r, queries: q } = spec ?? {};
    if (!type || type === `unknown` || !variables) return;

    for (const v of variables as string[]) {
      if (!Object.keys(scene.data).includes(v)) {
        throw new Error(`Variable '${v}' is not present in the data`);
      }
    }

    const selectfn = keysToSelectors(variables as string[]);

    const opts = {} as Record<string, any>;
    opts.ratio = spec?.ratio;

    if (r) opts.reducer = Reducer.parse(r);
    if (q) {
      if (isStringArray(q)) opts.queries = keysToSelectors(q);
      else {
        const queryfn = (data: any) => {
          return q.map(([s, r]) => [data[s], Reducer.parse(r)]);
        };
        opts.queries = queryfn;
      }
    }

    const plot = Plot[type](scene, selectfn as any, opts);
    Scene.addPlot(scene, plot);
  }

  function updatePlotIds(scene: Scene) {
    for (let i = 0; i < scene.plots.length; i++) {
      scene.plots[i].container.id = `plot${i + 1}`;
    }
  }

  export function popPlot(scene: Scene) {
    const plot = last(scene.plots);
    if (plot) removeSpecificPlot(scene, plot);
  }

  export function removePlot(scene: Scene, id: PlotId) {
    const plot = getPlot(scene, id);
    if (plot) removeSpecificPlot(scene, plot);
  }

  function removeSpecificPlot(scene: Scene, plot: Plot) {
    const { plots, plotIndicesByType, plotsContainer } = scene;

    const index = plots.indexOf(plot);
    for (const ps of Object.values(plotIndicesByType)) {
      if (ps.indexOf(index) !== -1) {
        remove(ps, index);
        break;
      }
    }

    remove(plots, plot);

    plotsContainer.removeChild(plot.container);
    Reactive.removeAllListeners(plot);

    updatePlotIds(scene);
    autoUpdateDimensions(scene);

    Scene.resize(scene);
  }

  export function getTarget(scene: Scene, id: TargetId) {
    if (id === `scene`) return scene;
    else return getPlot(scene, id as PlotId);
  }

  export function getPlotIds(scene: Scene) {
    const counts = {} as Record<Plot.Type, number>;
    const result = [] as `${Plot.Type}${number}`[];

    for (const plot of scene.plots) {
      const { type } = plot;
      if (counts[type] === undefined) counts[type] = 0;

      result.push(`${type}${counts[type]}`);
      counts[type]++;
    }

    return result;
  }

  export function getPlot(scene: Scene, id: PlotId) {
    const { plots, plotIndicesByType } = scene;
    let [type, idString] = splitNumericSuffix(id);
    const index = parseInt(idString, 10) - 1; // 0 based indexing;

    if (type === `plot` || type === `p`) return plots[index];

    // Remove to match e.g. 'barplot' or 'histogram' with 'bar' and 'histo'
    type = type.replace(`plot`, ``).replace(`gram`, ``);

    // Match short plot id
    if (type in Object.keys(plotIdShort)) {
      type = plotIdShort[type as keyof typeof plotIdShort];
    }

    if (type in plotIndicesByType) {
      return plots[plotIndicesByType[type as Plot.Type][index]];
    }
  }

  function autoUpdateDimensions(scene: Scene) {
    const { plots } = scene;
    if (plots.length === 0) return;
    const cols = Math.ceil(Math.sqrt(plots.length));
    const rows = Math.ceil(plots.length / cols);
    Scene.setDimensions(scene, rows, cols);
  }

  export function setDimensions(scene: Scene, rows: number, cols: number) {
    const { plotsContainer } = scene;
    scene.rows = rows;
    scene.cols = cols;
    const gridTemplateRows = Array(rows).fill(`1fr`).join(` `);
    const gridTemplateColumns = Array(cols).fill(`1fr`).join(` `);
    DOM.setStyles(plotsContainer, { gridTemplateRows, gridTemplateColumns });
    Scene.resize(scene);
  }

  export function setLayout(scene: Scene, layout: number[][]) {
    const { plotsContainer: plotContainer, plots } = scene;

    const s1 = new Set(layout.flat());
    const s2 = new Set(seq(0, plots.length - 1));
    for (const e of s1) s2.delete(e);

    const hiddenWarning = `Warning: Some plots are not included in the layout and will be hidden.`;
    if (s2.size > 0) alert(hiddenWarning);

    for (let i = 0; i < plots.length; i++) {
      DOM.setStyles(plots[i].container, { gridArea: `plot${i}` });
    }

    let gridTemplateAreas = ``;
    for (const line of layout) {
      gridTemplateAreas += `"${line.map((x) => `plot${x}`).join(` `)}" `;
    }

    const [nrow, ncol] = [layout.length, layout[0].length];
    const gridTemplateRows = Array(nrow).fill(`1fr`).join(` `);
    const gridTemplateColumns = Array(ncol).fill(`1fr`).join(` `);

    DOM.setStyles(plotContainer, {
      gridTemplateAreas,
      gridTemplateRows,
      gridTemplateColumns,
    });

    Scene.resize(scene);
  }

  export function clearLayout(scene: Scene) {
    const { plotsContainer, plots } = scene;
    DOM.setStyles(plotsContainer, { gridTemplateAreas: `` });
    for (const plot of plots) {
      DOM.setStyles(plot.container, { gridArea: `auto` });
    }
    autoUpdateDimensions(scene);
  }

  export type TargetId = `server` | `scene` | PlotId;
  export type PlotId =
    | `plot${number}`
    | `${Plot.Type}${number}`
    | `${Plot.Type}plot${number}`
    | `${Plot.Type}gram${number}`;

  export interface Message {
    sender: `server` | `scene`;
    target: TargetId;
    type: string;
    data?: Record<string, any>;
  }

  export function handleMessage(scene: Scene, message: Message) {
    const { echo } = scene;

    if (echo) {
      console.log(`Scene recieved message: "${JSON.stringify(message)}"`);
    }

    const { target, data } = message;
    const type = message.type as Event;
    const messageTarget = getTarget(scene, target);

    if (messageTarget && type) Reactive.dispatch(messageTarget, type, data);
  }

  export function sendMessage(
    scene: Scene,
    type: Event,
    data: Record<string, any>,
  ) {
    const [sender, target] = [`scene`, `server`];
    const message = JSON.stringify({ sender, target, type, data });

    const { client, echo } = scene;

    if (!client) return;
    if (echo) {
      console.log(`Scene sent message: "${message}"`);
    }

    client.send(message);
  }

  export function resize(scene: Scene, options?: { fontSize?: number }) {
    const { container } = scene;
    let { fontSize } = options ?? {};

    if (!fontSize) {
      const { clientWidth, clientHeight } = container;
      const unit = Math.min(clientWidth, clientHeight) / 100;
      fontSize = Math.min(Math.max(8, 3 * unit), 16);
    }

    DOM.setStyles(container, { fontSize: fontSize + `px` });

    for (const plot of scene.plots) Reactive.dispatch(plot, `resize`);
  }

  export function render(scene: Scene) {
    for (const plot of scene.plots) Plot.render(plot);
  }

  export function reset(scene: Scene) {
    for (const plot of scene.plots) Reactive.dispatch(plot, `reset`);
    Marker.clearTransient(scene.marker);
  }

  export function setQueryMode(scene: Scene) {
    for (const plot of scene.plots) Reactive.dispatch(plot, `query-mode`);
  }

  export function setGroupFirst(scene: Scene) {
    Marker.setGroup(scene.marker, Group.First);
  }

  export function setGroupSecond(scene: Scene) {
    Marker.setGroup(scene.marker, Group.Second);
  }

  export function setGroupThird(scene: Scene) {
    Marker.setGroup(scene.marker, Group.Third);
  }

  export const keybindings: Record<string, Event> = {
    r: `reset`,
    q: `query-mode`,
    1: `group-1`,
    2: `group-2`,
    3: `group-3`,
  };

  export function registerReducer(_scene: Scene, reducer: Reducer) {
    Reducer.registerReducer(reducer);
  }
}

function setupEvents(scene: Scene) {
  const { marker, plots, container, plotsContainer, keybindings, queryTable } =
    scene;

  document.addEventListener(`load`, () => {
    Scene.resize(scene);
    Scene.render(scene);
  });

  document.addEventListener(`visibilitychange`, () => {
    if (!document.hidden) {
      Scene.resize(scene);
      Scene.render(scene);
    }
  });

  window.addEventListener(`mousedown`, (event) => {
    if (container.contains(event.target as Node)) scene.active = true;
    else scene.active = false;
  });

  container.addEventListener(`mousedown`, (event) => {
    if (event.target === container) {
      for (const plot of plots) Reactive.dispatch(plot, `deactivate`);
    }
  });

  container.addEventListener(`dblclick`, () => {
    for (const plot of plots) {
      Reactive.dispatch(plot, `deactivate`);
      CanvasFrame.clear(plot.frames.user);
    }
    Marker.clearAll(scene.marker);
    scene.activePlotIndex = undefined;
  });

  plotsContainer.addEventListener(
    `mousemove`,
    throttle((event) => {
      const { clientWidth: appWidth, clientHeight: appHeight } = plotsContainer;
      const { clientWidth: tableWidth, clientHeight: tableHeight } = queryTable;

      let { offsetX, offsetY } = event;
      let element = event.target;

      while (element !== plotsContainer) {
        if (element === null) return;
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
        element = element.parentElement;
      }

      let [left, top] = [offsetX + 2, offsetY + 2];
      if (offsetX + tableWidth > appWidth) left = left - tableWidth - 4;
      if (offsetY + tableHeight > appHeight) top = top - tableHeight - 4;

      DOM.setStyles(queryTable, { left: left + `px`, top: top + `px` });
    }, 20),
  );

  window.addEventListener(`keydown`, (e) => {
    const event = keybindings[e.key];
    const { active, activePlotIndex } = scene;
    if (!event || !active) return;
    if (activePlotIndex !== undefined) {
      const plot = plots[activePlotIndex];
      Reactive.dispatch(plot, event as Plot.Event);
    }
    Reactive.dispatch(scene, event as Scene.Event);
  });

  window.addEventListener(`keyup`, () => {
    Marker.setGroup(marker, Transient);
    for (const p of scene.plots) {
      p.parameters.mode = `select`;
      DOM.setStyles(queryTable, { display: `none` });
    }
  });

  window.addEventListener(
    `resize`,
    throttle(() => Scene.resize(scene), 10),
  );

  Reactive.listen(marker, `cleared`, () => {
    for (const plot of plots) Reactive.dispatch(plot, `unlock`);
  });

  Reactive.listen(scene, `resize`, () => Scene.resize(scene));
  Reactive.listen(scene, `reset`, () => Scene.reset(scene));
  Reactive.listen(scene, `query-mode`, () => Scene.setQueryMode(scene));
  Reactive.listen(scene, `group-1`, () => Scene.setGroupFirst(scene));
  Reactive.listen(scene, `group-2`, () => Scene.setGroupSecond(scene));
  Reactive.listen(scene, `group-3`, () => Scene.setGroupThird(scene));

  Reactive.listen(scene, `connected`, () =>
    console.log(`Connected to Websocket server on: ${scene.client?.url}`),
  );

  Reactive.listen(scene, `set-dims`, (data) => {
    if (!data || !data.rows || !data.columns) return;
    Scene.setDimensions(scene, data!.rows, data!.cols);
  });

  Reactive.listen(scene, `get-plot-ids`, () => {
    const ids = Scene.getPlotIds(scene);
    Scene.sendMessage(scene, `get-plot-ids`, { ids });
  });

  Reactive.listen(scene, `add-plot`, (data) => {
    if (!data) return;
    Scene.addPlotBySpec(scene, data);
  });

  Reactive.listen(scene, `get-plot`, (data) => {
    if (!data || !data.id) return;
  });

  Reactive.listen(scene, `pop-plot`, () => Scene.popPlot(scene));

  Reactive.listen(scene, `remove-plot`, (data) => {
    if (!data || !data.id) return;
    Scene.removePlot(scene, data!.id);
  });

  Reactive.listen(scene, `set-selected`, (data) => {
    if (!data || !data.cases) return;
    Marker.update(marker, data.cases);
  });

  Reactive.listen(scene, `set-assigned`, (data) => {
    if (!data || !data.group) return;
    const group = (7 - Math.min(data.group, 3)) as GroupId;
    Marker.update(marker, data.cases, { group });
  });

  Reactive.listen(scene, `get-selected`, () => {
    const cases = filterIndices(Array.from(marker.indices), Marker.isTransient);
    Scene.sendMessage(scene, `get-selected`, { cases });
  });

  Reactive.listen(scene, `get-assigned`, (data) => {
    if (!data || !data.group) return;
    const isGroup = (x: number) => (x | 4) === 7 - Math.min(data.group, 3);
    const cases = filterIndices(Array.from(marker.indices), isGroup);
    Scene.sendMessage(scene, `get-assigned`, { cases, group: data.group });
  });

  Reactive.listen(scene, `clear-selection`, () => Marker.clearAll(marker));

  Reactive.listen(scene, `get-scale`, (data) => {
    if (!data || !data.id || !data.scale) return;

    const plot = Scene.getPlot(scene, data.id);
    if (!plot) return;

    const scale = { ...Plot.getScale(plot, data.scale) };
    deepModifyProp(scale, `trans`, stringifyFunction);
    deepModifyProp(scale, `inv`, stringifyFunction);

    Scene.sendMessage(scene, `get-scale`, { scale });
  });

  Reactive.listen(scene, `set-scale`, (data) => {
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Reactive.dispatch(plot, `set-scale`, data);
  });

  Reactive.listen(scene, `normalize`, (data) => {
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Reactive.dispatch(plot, `normalize`);
  });

  Reactive.listen(scene, `zoom`, (data) => {
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Reactive.dispatch(plot, `zoom`, data);
  });

  Reactive.listen(scene, `set-layout`, (data) => {
    if (!data || !data.layout) return;
    Scene.setLayout(scene, data.layout);
  });

  Reactive.listen(scene, `set-parameters`, (data) => {
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Reactive.dispatch(plot, `set-parameters`, data);
  });

  Reactive.listen(scene, `clear-layout`, () => Scene.clearLayout(scene));
}

const plotIdShort = {
  s: `scatter`,
  b: `bar`,
  bb: `bibar`,
  h: `histo`,
  f: `fluct`,
  hh: `histo2d`,
  pc: `pcoords`,
};
