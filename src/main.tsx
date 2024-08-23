import {
  fetchJSON,
  formatText,
  MtcarsUntyped,
  Plot,
  Reducer,
  Scene,
} from "../lib/main";

async function mtcarsScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const mtcars = (await fetchJSON(`../datasets/mtcars.json`)) as MtcarsUntyped;
  mtcars.cyl = mtcars.cyl.map((x) => x.toString());
  mtcars.am = mtcars.am.map((x) => x.toString());

  const scene = Scene.of(mtcars);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.wt, d.mpg]);
  const plot2 = Plot.histo(scene, (d) => [d.mpg]);
  const plot3 = Plot.bar(scene, (d) => [d.cyl, d.mpg], {
    reducer: Reducer.sum,
    queries: (d) => [[d.wt, Reducer.max]],
  });

  const plot4 = Plot.fluct(scene, (d) => [d.cyl, d.am]);
  const plot5 = Plot.pcoords(scene, (d) => [d.wt, d.disp, d.drat, d.mpg]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);

  // Scene.handleMessage(scene, {
  //   sender: `session`,
  //   target: `scene`,
  //   type: `assign`,
  //   data: { cases: [0, 1, 2, 3, 5], group: 1 },
  // });

  // Scene.handleMessage(scene, {
  //   sender: `session`,
  //   target: `scatterplot1`,
  //   type: `set-scale`,
  //   data: { scale: `size`, mult: 1 },
  // });

  // Scene.handleMessage(scene, {
  //   sender: `session`,
  //   target: `scatterplot1`,
  //   type: `zoom`,
  //   data: { coords: [0.25, 0.25, 0.75, 0.75], units: `pct` },
  // });

  // Scene.handleMessage(scene, {
  //   sender: `session`,
  //   target: `scene`,
  //   type: `add-plot`,
  //   data: {
  //     type: `bar`,
  //     variables: [`carb`, `mpg`],
  //     reducer: `sum`,
  //     queries: [[`mpg`, `max`]],
  //   },
  // });
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
  const plot5 = Plot.pcoords(scene, (d) => [d.runtime, d.votes, d.rating]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);
}

async function diamondsScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const diamonds = await fetchJSON(`../datasets/diamonds.json`);

  const scene = await Scene.ofAsync(
    `https://raw.githubusercontent.com/bartonicek/ps-dop/master/datasets/diamonds.json?token=GHSAT0AAAAAACWONCCBNNKPPLVIBHQPTDMWZWHJ66A`,
  );
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.carat, d.price]);
  const plot2 = Plot.bar(scene, (d) => [d.color]);
  const plot3 = Plot.histo(scene, (d) => [d.price]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
}

async function sacramentoScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const sacramento = await fetchJSON(`../datasets/sacramento.json`);
  sacramento.city = sacramento.city.map((x) => formatText(x));

  const scene = Scene.of(sacramento);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.longitude, d.latitude], {
    ratio: 1,
  });

  const plot2 = Plot.bar(scene, (d) => [d.city]);
  const plot3 = Plot.histo(scene, (d) => [d.sqft]);
  const plot4 = Plot.fluct(scene, (d) => [d.beds, d.baths]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
}

sacramentoScene();
