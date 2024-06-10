import { exp10, fetchJSON, log10, seq } from "utils";
import { parseColumns } from "../lib/dataframe/parseColumns.ts";
import {
  Fluctplot,
  Histogram,
  Histogram2D,
  Noteplot,
  PCoordsplot,
  continuous,
  discrete,
  maxReducer,
} from "../lib/main.ts";
import { Barplot } from "../lib/plots/Barplot.ts";
import { Scatterplot, newScatter } from "../lib/plots/Scatterplot.ts";
import { Scene, newScene } from "../lib/scene/Scene.ts";
import "../lib/style.css";
import { newContinuous } from "../lib/variables/Continuous.ts";

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
  const scene = Scene.from(app, mpgData, {
    pointQueries: "manufacturer",
  });

  const plot1 = Scatterplot.from(scene, (d) => ({
    v1: d.displ,
    v2: d.hwy,
    v3: d.cty,
  }));
  const plot2 = Barplot.from(scene, (d) => ({ v1: d.manufacturer }));
  const plot3 = Histogram.from(scene, (d) => ({ v1: d.displ }));
  const plot4 = Fluctplot.from(scene, (d) => ({ v1: d.year, v2: d.drv }));
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
  const scene = Scene.from(app, diamondsData);

  const plot1 = Scatterplot.from(scene, (d) => ({ v1: d.carat, v2: d.price }));
  const plot2 = Barplot.from(scene, (d) => ({ v1: d.color }));

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
  const scene = Scene.from(app, sacramentoData);

  const plot1 = Scatterplot.from(scene, (d) => ({
    v1: d.longitude,
    v2: d.latitude,
    v3: d.price,
  }));

  const plot2 = Fluctplot.from(scene, (d) => ({ v1: d.beds, v2: d.baths }));
  const plot3 = Barplot.from(scene, (d) => ({ v1: d.city }));

  const opts = { reducer: maxReducer };
  const plot4 = Histogram.from(
    scene,
    (d) => ({ v1: d.sqft, v2: d.price }),
    opts
  );
  const plot5 = Histogram2D.from(scene, (d) => ({ v1: d.sqft, v2: d.price }));
  const plot6 = Noteplot.from(scene);

  const plot7 = PCoordsplot.from(scene, (d) =>
    Object.fromEntries(Object.entries(d).map(([_, v], i) => [`v${i}`, v]))
  );

  scene.setLayout([
    [1, 1, 2, 3],
    [1, 1, 4, 5],
    [6, 7, 7, 7],
  ]);
}

async function imdbScene() {
  const URL = `../datasets/imdb400.json`;
  const imdbJSON = await fetchJSON(URL);

  const spec = {
    title: discrete(),
    director: discrete(),
    genre: discrete(),
    lead: discrete(),
    certificate: discrete(),
    rating: continuous(),
    runtime: continuous(),
    votes: continuous(),
    year: continuous(),
  };

  const sacramentoData = parseColumns(imdbJSON, spec);
  const scene = Scene.from(app, sacramentoData, { pointQueries: "title" });

  const plot1 = Scatterplot.from(scene, (d) => ({ v1: d.votes, v2: d.rating }));
  const plot2 = Barplot.from(scene, (d) => ({ v1: d.director }));
  const plot3 = Barplot.from(scene, (d) => ({ v1: d.genre }));
  const plot4 = Scatterplot.from(scene, (d) => ({
    v1: d.runtime,
    v2: d.votes,
  }));
  const plot5 = Barplot.from(scene, (d) => ({ v1: d.certificate }));
  const plot6 = PCoordsplot.from(scene, (d) => ({
    v1: d.votes,
    v2: d.runtime,
    v3: d.rating,
  }));
}

// await diamondsScene();
// await sacrametoScene();
// await mpgScene();
await imdbScene();

// Take an image of the app
// html2canvas(app).then((canvas) => {
//   document.body.appendChild(canvas);
// });
