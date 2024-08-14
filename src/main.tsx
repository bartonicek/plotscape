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

  const plot1 = Plot.scatter(scene, (d) => [d.wt, d.mpg], {
    queries: (d) => [d.cyl],
  });

  const plot2 = Plot.histo(scene, (d) => [d.mpg]);
  const plot3 = Plot.bar(scene, (d) => [d.carb, d.mpg], {
    reducer: Reducer.sum,
    queries: (d) => [[d.wt, Reducer.sum]],
  });

  const plot4 = Plot.fluct(scene, (d) => [d.cyl, d.am]);
  const plot5 = Plot.line(scene, (d) => [d.wt, d.disp, d.drat, d.mpg], {
    queries: (d) => [d.cyl],
  });

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);

  Scene.addplotByType(scene, `line`, (d) => [d.drat, d.disp, d.gear]);
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

  Scene.addPlot(scene, plot1);
  Scene.addPlot(scene, plot2);
  Scene.addPlot(scene, plot3);
  Scene.addPlot(scene, plot4);

  // Plot.setRatio(plot1, 1);
}

mtcarsScene();

// const s = Scale.of(Expanse.continuous(1, 10), Expanse.continuous(0, 500));

// Expanse.set(s.domain, (e) => ((e.zero = 0.1), (e.one = 0.9)));
// Expanse.set(s.codomain, (e) => ((e.zero = 0.1), (e.one = 0.9)));

// console.log(Scale.unitRatio(s), (500 * 0.8) / (9 / 0.8));
