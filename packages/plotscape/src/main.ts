import { fetchJSON } from "utils";
import { col } from "../lib/dataframe/ColumnParser.ts";
import { parseColumns } from "../lib/dataframe/Dataframe.ts";
import { newBarplot } from "../lib/plots/Barplot.ts";
import { newFluctplot } from "../lib/plots/Fluctplot.ts";
import { newHistogram } from "../lib/plots/Histogram.ts";
import { newHistogram2D } from "../lib/plots/Histogram2D.ts";
import { newNoteplot } from "../lib/plots/Noteplot.ts";
import { newScatter } from "../lib/plots/Scatterplot.ts";
import { newScene } from "../lib/scene/Scene.ts";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

async function mpgScene() {
  const mpgJSON = await fetchJSON("../datasets/mpg.json");

  console.log(mpgJSON);

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

async function sacrametoScene() {
  const sacramentoJSON = await fetchJSON("../datasets/sacramento.json");

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
  // plot1.setAspectRatio(1);

  const plot2 = newFluctplot(scene, (d) => ({ v1: d.beds, v2: d.baths }));
  const plot3 = newBarplot(scene, (d) => ({ v1: d.city }));
  const plot4 = newHistogram(scene, (d) => ({ v1: d.price }));
  const plot5 = newHistogram2D(scene, (d) => ({ v1: d.sqft, v2: d.price }));
  const plot6 = newNoteplot(scene);
}

sacrametoScene();
// mpgScene();

// const foo = newDragList(["hello", "world", "bye"]);
// foo.listen(`changed`, () => console.log(foo.values));

// app.appendChild(foo.container);
