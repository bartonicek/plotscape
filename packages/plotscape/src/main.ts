import { exp10, fetchJSON, log10 } from "utils";
import { col } from "../lib/dataframe/ColumnParser.ts";
import { parseColumns } from "../lib/dataframe/parseColumns.ts";
import { newHistogram2D, newNoteplot, newPCoordsplot } from "../lib/main.ts";
import { newBarplot } from "../lib/plots/Barplot.ts";
import { newFluctplot } from "../lib/plots/Fluctplot.ts";
import { newHistogram } from "../lib/plots/Histogram.ts";
import { newScatter } from "../lib/plots/Scatterplot.ts";
import { newScene } from "../lib/scene/Scene.ts";
import "../lib/style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

async function mpgScene() {
  const mpgJSON = await fetchJSON("../datasets/mpg.json");

  const spec = {
    year: col(`discrete`),
    manufacturer: col(`discrete`),
    displ: col(`continuous`),
    hwy: col(`continuous`),
    fl: col(`discrete`),
    drv: col(`discrete`),
  };

  const mpgData = parseColumns(mpgJSON, spec);
  const scene = newScene(app, mpgData);

  const plot1 = newScatter(scene, (d) => ({ v1: d.displ, v2: d.hwy }));
  const plot2 = newBarplot(scene, (d) => ({ v1: d.manufacturer }));
  const plot3 = newHistogram(scene, (d) => ({ v1: d.displ }));
  const plot4 = newFluctplot(scene, (d) => ({ v1: d.year, v2: d.drv }));
}

async function diamondsScene() {
  const diamondsJSON = await fetchJSON(`../datasets/diamonds.json`);

  const spec = {
    carat: col(`continuous`),
    price: col(`continuous`),
    color: col(`discrete`),
    cut: col(`discrete`),
  };

  const diamondsData = parseColumns(diamondsJSON, spec);
  const scene = newScene(app, diamondsData);

  const plot1 = newScatter(scene, (d) => ({ v1: d.carat, v2: d.price }));
  const plot2 = newBarplot(scene, (d) => ({ v1: d.color }));

  plot1.scales.x.setTransform(log10, exp10);
  plot1.scales.y.setTransform(log10, exp10);
}

async function sacrametoScene() {
  const URL = `https://raw.githubusercontent.com/bartonicek/plotscape/master/packages/plotscape/datasets/sacramento.json`;
  const sacramentoJSON = await fetchJSON(URL);

  const spec = {
    city: col(`discrete`).toLowerCase().capitalize(),
    beds: col(`discrete`),
    baths: col(`discrete`),
    sqft: col(`continuous`),
    price: col(`continuous`),
    latitude: col(`continuous`),
    longitude: col(`continuous`),
    type: col(`discrete`),
  };

  const sacramentoData = parseColumns(sacramentoJSON, spec);
  const scene = newScene(app, sacramentoData);

  const plot1 = newScatter(scene, (d) => ({ v1: d.longitude, v2: d.latitude }));
  const plot2 = newFluctplot(scene, (d) => ({ v1: d.beds, v2: d.baths }));
  const plot3 = newBarplot(scene, (d) => ({ v1: d.city }));
  const plot4 = newHistogram(scene, (d) => ({ v1: d.sqft }));
  const plot5 = newHistogram2D(scene, (d) => ({ v1: d.sqft, v2: d.price }));
  const plot6 = newNoteplot(scene);

  const plot7 = newPCoordsplot(scene, (d) => ({
    v1: d.latitude,
    v2: d.longitude,
    v3: d.price,
  }));

  scene.setLayout([
    [1, 1, 2, 3],
    [1, 1, 4, 5],
    [6, 7, 7, 7],
  ]);
}

// diamondsScene();
sacrametoScene();
// mpgScene();
