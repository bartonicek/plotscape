import { fetchJSON } from "utils";
import { newScene } from "../lib/Scene.ts";
import { newValueEmitter } from "../lib/ValueEmitter.ts";
import { col } from "../lib/dataframe/ColumnParser.ts";
import { parseColumns } from "../lib/dataframe/Dataframe.ts";
import { newBarplot } from "../lib/plots/Barplot.ts";
import { newHistogram } from "../lib/plots/Histogram.ts";
import { newScatter } from "../lib/plots/Scatterplot.ts";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const mpgJSON = await fetchJSON("../datasets/mpg.json");

const spec = {
  year: col(`discrete`),
  manufacturer: col(`discrete`),
  displ: col(`continuous`),
  hwy: col(`continuous`),
};

const mpgData = parseColumns(mpgJSON, spec);
const width = newValueEmitter(5);

const scene = newScene(app, mpgData);

const plot1 = newScatter(scene, (d) => ({ v1: d.displ, v2: d.hwy }));
const plot3 = newBarplot(scene, (d) => ({ v1: d.manufacturer }));
const plot4 = newHistogram(scene, (d) => ({ v1: d.displ }));
