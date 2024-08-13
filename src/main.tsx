import { MtcarsUntyped, Plot, Reducer, Scene } from "../lib/main";
import { fetchJSON } from "../lib/utils/funs";

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

// const arr = [1, 2, 3, 4];

// const r1 = Reactive.of({});
// const r2 = Reactive.of({});

// Reactive.listen(r1, `changed`, () => Reactive.dispatch(r2, `changed`), {
//   deferred: true,
// });

// Reactive.listen(r1, `changed`, () => console.log(`foo`));
// Reactive.listen(r2, `changed`, () => console.log(r1));

// Reactive.set(r1, () => {});

// const r1 = Reactive.of({ width: 5 });

// const mtcars = (await fetchJSON(`../datasets/mtcars.json`)) as MtcarsUntyped;
// const f1 = Factor.bin(mtcars.wt, r1);
// const f2 = Factor.product(f1, Factor.from(mtcars.cyl));

// const factors = [f1, f2] as const;
// const summaries = Summaries.of({ stat: [mtcars.mpg, Reducer.sum] }, factors);

// Reactive.listen(f1, `changed`, () => console.log(`f1`));
// Reactive.listen(f2, `changed`, () => console.log(`f2`));

// Reactive.listen(summaries[0], `changed`, () =>
//   console.log(`f1 dispatch`, JSON.stringify(summaries[0].stat)),
// );

// Reactive.listen(summaries[1], `changed`, () =>
//   console.log(`f2 dispatch`, JSON.stringify(summaries[0].stat)),
// );

// Reactive.set(r1, (e) => (e.width = 1));
