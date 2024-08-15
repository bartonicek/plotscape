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

  const scene = Scene.of(mtcars, {}); //  websocketURL: "ws://localhost:8080"
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.wt, d.mpg]);
  const plot2 = Plot.histo(scene, (d) => [d.mpg]);
  const plot3 = Plot.bar(scene, (d) => [d.cyl, d.mpg], {
    reducer: Reducer.sum,
    queries: (d) => [[d.wt, Reducer.sum]],
  });

  const plot4 = Plot.fluct(scene, (d) => [d.cyl, d.am]);
  const plot5 = Plot.line(scene, (d) => [d.wt, d.disp, d.drat, d.mpg]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);

  scene.client!.send = console.log;

  // Scene.handleMessage(scene, {
  //   sender: `session`,
  //   target: `scene`,
  //   type: `assign`,
  //   data: { cases: [0, 1, 2, 3, 5], group: 1 },
  // });

  Scene.handleMessage(scene, {
    sender: `session`,
    target: `barplot1`,
    type: `set-scale`,
    data: { scale: `y`, max: 400 },
  });

  // WebSocketClient.handleMessage(scene.client!, {
  //   sender: `session`,
  //   target: `scene`,
  //   type: `get-selected`,
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
  const plot5 = Plot.line(scene, (d) => [d.runtime, d.votes, d.rating]);

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);
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

async function sacramentoScene() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const sacramento = await fetchJSON(`../datasets/sacramento.json`);
  sacramento.city = sacramento.city.map((x) => formatText(x));

  const scene = Scene.of(sacramento);
  Scene.append(app, scene);

  const plot1 = Plot.scatter(scene, (d) => [d.longitude, d.latitude], {
    ratio: 1,
    queries: (d) => [d.beds],
  });

  const plot2 = Plot.bar(scene, (d) => [d.city]);
  const plot3 = Plot.histo(scene, (d) => [d.price]);
  const plot4 = Plot.fluct(scene, (d) => [d.beds, d.baths]);
  const plot5 = Plot.histo2d(scene, (d) => [d.longitude, d.latitude], {});

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);
  Scene.addPlot(scene, plot5);

  Plot.setRatio(plot1, 1);
  Plot.setRatio(plot5, 1);
}

mtcarsScene();

console.log((4).toString(2));
