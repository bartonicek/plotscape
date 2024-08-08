import { Expanse, MtcarsUntyped, Plot, Reducer, Scene } from "../lib/main";
import { fetchJSON, orderBy } from "../lib/utils/funs";

async function mtcarsScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const mtcars = (await fetchJSON(`../datasets/mtcars.json`)) as MtcarsUntyped;
  mtcars.cyl = mtcars.cyl.map((x) => x.toString());
  mtcars.am = mtcars.am.map((x) => x.toString());

  const scene = Scene.of(mtcars);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.wt, d.mpg]);
  const plot2 = Plot.histo(scene, (d) => [d.mpg]);
  const plot3 = Plot.bar(scene, (d) => [d.carb, d.mpg], {
    reducer: Reducer.sum,
  });
  const plot4 = Plot.fluct(scene, (d) => [d.cyl, d.am]);
  const plot5 = Plot.line(scene, (d) => [d.wt, d.mpg, d.cyl]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);

  console.log(Expanse.unnormalize(plot4.scales.height.codomain, 1));
  console.log(Expanse.unnormalize(plot4.scales.area.codomain, 1));
  console.log(plot4.scales.area.codomain);
}

async function imdbScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const imdb = await fetchJSON(`../datasets/imdb1000.json`);

  const scene = Scene.of(imdb);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.runtime, d.rating]);
  const plot2 = Plot.histo(scene, (d) => [d.votes]);
  const plot3 = Plot.bar(scene, (d) => [d.director]);
  const plot4 = Plot.fluct(scene, (d) => [d.genre1, d.genre2]);
  const plot5 = Plot.line(scene, (d) => [d.runtime, d.votes, d.rating]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);

  Scene.setDimensions(scene, 3, 2);
}

async function diamondsScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const diamonds = await fetchJSON(`../datasets/diamonds.json`);

  const scene = Scene.of(diamonds);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.carat, d.price]);
  const plot2 = Plot.bar(scene, (d) => [d.color]);
  const plot3 = Plot.histo(scene, (d) => [d.price]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
}

mtcarsScene();

// const labels = [`a`, `b`, `c`];
// const weights = [200, 100, 40];
// const exp = Expanse.band(labels);
// ExpanseBand.setWeights(exp, weights);

// console.log(labels.map((x) => Expanse.normalize(exp, x)));
// ExpanseBand.reorder(exp, [2, 1, 0]);
// console.log(labels.map((x) => Expanse.normalize(exp, x)));

const arr = [1, 2, 3, 4];
orderBy(arr, [3, 1, 2, 0]);

console.log(arr);
