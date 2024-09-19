import { Reducer } from "../main";
import { Frame } from "../plot/Frame";
import { Plot } from "../plot/Plot";
import { DOM } from "../utils/DOM";
import {
  fetchJSON,
  filterIndices,
  isStringArray,
  keysToSelectors,
  last,
  remove,
  seq,
  splitNumericSuffix,
  throttle,
  tw,
} from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Columns } from "../utils/types";
import {
  defaultOptions,
  GraphicalOptions,
  updateOptions,
} from "./defaultOptions";
import { KeybindingsMenu } from "./KeybindingsMenu";
import { Group, Marker, Transient } from "./Marker";

export interface Scene<T extends Columns = Columns>
  extends Reactive<Scene.Event> {
  data: T;
  container: HTMLDivElement;
  plotsContainer: HTMLDivElement;
  client?: WebSocket;

  rows: number;
  cols: number;

  marker: Marker;

  activePlot?: Plot;
  plots: Plot[];
  plotsByType: Record<Plot.Type, number[]>;

  keybindings: Record<string, Scene.Event | Plot.Event>;
  options: GraphicalOptions;
}

export namespace Scene {
  export type Event =
    | `reset`
    | `resize`
    | `set-layout`
    | `clear-layout`
    | `connected`
    | `set-dims`
    | `add-plot`
    | `pop-plot`
    | `remove-plot`
    | `set-selected`
    | `set-assigned`
    | `get-selected`
    | `get-assigned`
    | `clear-selection`
    | `set-scale`
    | `zoom`
    | `query-mode`
    | `group-1`
    | `group-2`
    | `group-3`
    | (string & {});

  export function of<T extends Columns>(
    data: T,
    options?: {
      id?: string;
      websocketURL?: string;
    } & Partial<GraphicalOptions>,
  ): Scene<T> {
    const container = DOM.element(`div`, { id: `scene-container` });
    const plotsContainer = DOM.element(`div`, { id: `plots-container` });

    DOM.addClasses(
      container,
      tw(
        "tailwind tw-pr-15 tw-relative tw-flex tw-h-full tw-w-full tw-content-center tw-items-center tw-justify-center tw-bg-[#deded9] tw-p-10 tw-text-[max(min(2vmin,16px),8px)]",
      ),
    );

    DOM.addClasses(
      plotsContainer,
      tw("tw-grid tw-h-full tw-w-full tw-grid-cols-1 tw-grid-rows-1 tw-gap-5 "),
    );

    const keybindings = { ...Scene.keybindings, ...Plot.keybindings };
    const keybindingsMenu = KeybindingsMenu.of(keybindings);

    DOM.append(container, plotsContainer);
    DOM.append(container, keybindingsMenu);

    const [rows, cols] = [1, 1];
    const marker = Marker.of(Object.values(data)[0].length);
    const plots = [] as Plot[];
    const plotsByType = {} as Record<Plot.Type, number[]>;

    const opts = Object.assign(defaultOptions, options);
    updateOptions(opts);

    for (const [k, v] of Object.entries(data)) {
      if (!Meta.has(v, `name`)) Meta.set(v, `name`, k);
    }

    // Mock for just echoing messages back if websocket URL is not provided
    const client = { send: console.log } as WebSocket;

    const scene = Reactive.of()({
      data,
      container,
      plotsContainer,
      rows,
      cols,
      marker,
      client,
      plots,
      plotsByType,
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
    const { plotsContainer: plotContainer, marker, plots, plotsByType } = scene;

    Reactive.listen(plot, `activated`, () => {
      for (const p of plots) if (p != plot) Reactive.dispatch(p, `deactivate`);
      scene.activePlot = plot;
    });

    Reactive.listen(plot, `lock-others`, () => {
      for (const p of plots) if (p !== plot) Reactive.dispatch(p, `lock`);
    });

    Reactive.listen(plot, `set-selected`, (data) => {
      Marker.update(marker, data!.cases);
    });

    Reactive.listen(plot, `clear-transient`, () => {
      for (const p of plots) Plot.clearUserFrame(p);
      Marker.clearTransient(marker);
    });

    const { type } = plot;
    if (!plotsByType[type]) plotsByType[type] = [];
    plotsByType[type].push(plots.length);
    plots.push(plot);

    Plot.append(plotContainer, plot);

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

    const opts = {} as any;

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
    const { plots, plotsByType, plotsContainer: plotContainer } = scene;

    const index = plots.indexOf(plot);
    for (const ps of Object.values(plotsByType)) {
      if (ps.indexOf(index) !== -1) {
        remove(ps, index);
        break;
      }
    }

    remove(plots, plot);

    plotContainer.removeChild(plot.container);
    Reactive.removeAllListeners(plot);

    updatePlotIds(scene);
    autoUpdateDimensions(scene);

    Scene.resize(scene);
  }

  export function getTarget(scene: Scene, id: TargetId) {
    if (id === `scene`) return scene;
    else return getPlot(scene, id as PlotId);
  }

  export function getPlot(scene: Scene, id: PlotId) {
    const { plots, plotsByType } = scene;
    let [type, idString] = splitNumericSuffix(id);
    const index = parseInt(idString, 10) - 1; // 0 based indexing;

    if (type === `plot` || type === `p`) return plots[index];

    // Remove to match e.g. 'barplot' or 'histogram' with 'bar' and 'histo'
    type = type.replace(`plot`, ``).replace(`gram`, ``);

    // Match short plot id
    if (type in Object.keys(plotIdShort)) {
      type = plotIdShort[type as keyof typeof plotIdShort];
    }

    if (type in plotsByType) {
      return plots[plotsByType[type as Plot.Type][index]];
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
    const { plotsContainer: pc } = scene;
    scene.rows = rows;
    scene.cols = cols;
    pc.style.gridTemplateRows = Array(rows).fill(`1fr`).join(` `);
    pc.style.gridTemplateColumns = Array(cols).fill(`1fr`).join(` `);
    Scene.resize(scene);
  }

  export function setLayout(scene: Scene, layout: number[][]) {
    const { plotsContainer: plotContainer, plots } = scene;

    const s1 = new Set(layout.flat());
    const s2 = new Set(seq(0, plots.length - 1));
    for (const e of s1) s2.delete(e);

    if (s2.size > 0) {
      alert(
        `Warning: Some plots are not included in the layout and will be hidden.`,
      );
    }

    for (let i = 0; i < plots.length; i++) {
      plots[i].container.style.gridArea = `plot${i}`;
    }

    let layoutString = ``;
    for (const line of layout) {
      layoutString += `"${line.map((x) => `plot${x}`).join(` `)}" `;
    }

    const [nrow, ncol] = [layout.length, layout[0].length];

    plotContainer.style.gridTemplateAreas = layoutString;
    plotContainer.style.gridTemplateRows = Array(nrow).fill(`1fr`).join(` `);
    plotContainer.style.gridTemplateColumns = Array(ncol).fill(`1fr`).join(` `);

    Scene.resize(scene);
  }

  export function clearLayout(scene: Scene) {
    scene.plotsContainer.style.gridTemplateAreas = ``;
    for (const plot of scene.plots) plot.container.style.gridArea = `auto`;
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
    if (!scene.client) return;

    const { type, target: targetId, data } = message;
    const target = getTarget(scene, targetId);

    if (target) Reactive.dispatch(target, type, data);
  }

  export function sendMessage(
    scene: Scene,
    type: Event,
    data: Record<string, any>,
  ) {
    const [sender, target] = [`scene`, `server`];
    const message = JSON.stringify({ sender, target, type, data });
    scene.client!.send(message);
  }

  export function resize(scene: Scene) {
    for (const plot of scene.plots) Reactive.dispatch(plot, `resize`);
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
}

function setupEvents(scene: Scene) {
  const { marker, plots, container, keybindings } = scene;

  container.addEventListener(`mousedown`, () => {
    for (const plot of plots) Reactive.dispatch(plot, `deactivate`);
  });

  container.addEventListener(`dblclick`, () => {
    for (const plot of plots) {
      Reactive.dispatch(plot, `deactivate`);
      Frame.clear(plot.frames.user);
    }
    Marker.clearAll(scene.marker);
    scene.activePlot = undefined;
  });

  window.addEventListener(`keydown`, (e) => {
    const event = keybindings[e.key];
    if (!event) return;
    if (scene.activePlot) Reactive.dispatch(scene.activePlot, event);
    Reactive.dispatch(scene, event);
  });

  window.addEventListener(`keyup`, () => {
    Marker.setGroup(marker, Transient);
    for (const p of scene.plots) {
      p.parameters.mode = Plot.Mode.Select;
      p.queryTable.style.display = `none`;
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

  Reactive.listen(scene, `add-plot`, (data) => {
    if (!data) return;
    Scene.addPlotBySpec(scene, data);
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
    const group = 7 - Math.min(data.group, 3);
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
    if (!data || !data.id) return;
    const plot = Scene.getPlot(scene, data.id);
    if (plot) Reactive.dispatch(plot, `get-scale`, data);
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
  h: `histo`,
  f: `fluct`,
  hh: `histo2d`,
  pc: `pcoords`,
};
