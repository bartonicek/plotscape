import { MtcarsUntyped, Plot, Reducer, Scene } from "../lib/main";
import { fetchJSON } from "../lib/utils/funs";

async function mtcarsScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const mtcars = (await fetchJSON(`../datasets/mtcars.json`)) as MtcarsUntyped;
  mtcars.cyl = mtcars.cyl.map((x) => x.toString());

  const scene = Scene.of(mtcars);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.wt, d.mpg]);
  const plot2 = Plot.scatter(scene, (d) => [d.cyl, d.disp]);
  const plot3 = Plot.bar(scene, (d) => [d.cyl], {
    reducer: Reducer.sum,
    queries: [[(d) => d.am, Reducer.table]],
  });

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
}

async function diamondsScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const diamonds = await fetchJSON(`../datasets/diamonds.json`);

  const scene = Scene.of(diamonds);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.carat, d.price]);
  const plot2 = Plot.bar(scene, (d) => [d.color]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
}

mtcarsScene();
