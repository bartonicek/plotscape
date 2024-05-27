import { exp10, fetchJSON, log10 } from "utils";
import { parseColumns } from "../lib/dataframe/parseColumns.ts";
import {
  continuous,
  discrete,
  maxReducer,
  newFluctplot,
  newHistogram,
  newHistogram2D,
  newNoteplot,
  newPCoordsplot,
} from "../lib/main.ts";
import { newBarplot } from "../lib/plots/Barplot.ts";
import { newScatter } from "../lib/plots/Scatterplot.ts";
import { newScene } from "../lib/scene/Scene.ts";
import "../lib/style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

async function mpgScene() {
  const mpgJSON = await fetchJSON("../datasets/mpg.json");

  const spec = {
    year: discrete(),
    manufacturer: discrete(),
    displ: continuous(),
    hwy: continuous(),
    cty: continuous(),
    fl: discrete(),
    drv: discrete(),
  };

  const mpgData = parseColumns(mpgJSON, spec);
  const scene = newScene(app, mpgData);

  const plot1 = newScatter(scene, (d) => ({
    v1: d.displ,
    v2: d.hwy,
    v3: d.cty,
  }));
  const plot2 = newBarplot(scene, (d) => ({ v1: d.manufacturer }));
  const plot3 = newHistogram(scene, (d) => ({ v1: d.displ }));
  const plot4 = newFluctplot(scene, (d) => ({ v1: d.year, v2: d.drv }));
}

async function diamondsScene() {
  const diamondsJSON = await fetchJSON(`../datasets/diamonds.json`);

  const spec = {
    carat: continuous(),
    price: continuous(),
    color: discrete(),
    cut: discrete(),
  };

  const diamondsData = parseColumns(diamondsJSON, spec);
  const scene = newScene(app, diamondsData);

  const plot1 = newScatter(scene, (d) => ({ v1: d.carat, v2: d.price }));
  const plot2 = newBarplot(scene, (d) => ({ v1: d.color }));

  plot1.scales.x.setTransform(log10, exp10);
  plot1.scales.y.setTransform(log10, exp10);
}

async function sacrametoScene() {
  const URL = `../datasets/sacramento.json`;
  const sacramentoJSON = await fetchJSON(URL);

  const spec = {
    city: discrete().toLowerCase().capitalize(),
    beds: discrete(),
    baths: discrete().setQueryable(true),
    sqft: continuous(),
    price: continuous(),
    latitude: continuous(),
    longitude: continuous(),
    type: discrete(),
  };

  const sacramentoData = parseColumns(sacramentoJSON, spec);
  const scene = newScene(app, sacramentoData);

  const plot1 = newScatter(scene, (d) => ({
    v1: d.longitude,
    v2: d.latitude,
    v3: d.price,
  }));

  const plot2 = newFluctplot(scene, (d) => ({ v1: d.beds, v2: d.baths }));
  const plot3 = newBarplot(scene, (d) => ({ v1: d.city }));

  const opts = { reducer: maxReducer };
  const plot4 = newHistogram(scene, (d) => ({ v1: d.sqft, v2: d.price }), opts);
  const plot5 = newHistogram2D(scene, (d) => ({ v1: d.sqft, v2: d.price }));
  const plot6 = newNoteplot(scene);

  const plot7 = newPCoordsplot(scene, (d) =>
    Object.fromEntries(Object.entries(d).map(([_, v], i) => [`v${i}`, v]))
  );

  // scene.setLayout([
  //   [1, 1, 2, 3],
  //   [1, 1, 4, 5],
  //   [6, 7, 7, 7],
  // ]);
}

// diamondsScene();
// sacrametoScene();
mpgScene();
