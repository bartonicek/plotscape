import {
  React,
  ExpansePoint,
  ExpanseContinuous,
  Scale,
  Frame,
  Factor,
  Aggregator,
  isCanvas,
  Plot,
  Expanse,
  Scene,
  Plots,
  Mtcars,
  ReactiveData,
} from "../lib/main";
import { Points } from "../lib/geoms/Points";
import {
  fetchJSON,
  makeGetter,
  minmax,
  timeExecution,
} from "../lib/utils/funs";
import { LAYER, PARENT } from "../lib/utils/symbols";
import { Group, Marker } from "../lib/scene/Marker";

const app = document.querySelector<HTMLDivElement>("#app")!;

// Frame.append(frame1, app);
// Frame.resize(frame1);

// for (let i = 0; i < 10; i++) {
//   Frame.point(frame1, 10 * (i + 1), 10 * (i + 1));
// }

// frame1.context.fillRect(100, 100, 10, 10);

// frame1.context.fillRect(100, 620, 100, 100);

// window.addEventListener("resize", () => {
//   Frame.resize(frame1);
// });

// const sumReducer = {
//   name: `sum`,
//   initialfn: () => 0,
//   reducefn: (x: number, y: number) => x + y,
// };

// const mtcars = await fetchJSON(`../datasets/mtcars.json`);

// console.log(mtcars);

// const factor1 = Factor.from(mtcars.cyl);
// const factor2 = Factor.bin(mtcars.mpg, { width: 5 });
// const factor3 = Factor.product(factor1, factor2);

// const agg1 = Aggregator.aggregate(mtcars.mpg, sumReducer, factor1);
// const agg2 = Aggregator.aggregate(mtcars.mpg, sumReducer, factor3);
// const agg3 = Aggregator.stack(agg2, sumReducer, factor3);

// const agg4 = Aggregator.normalize(agg3, agg1, factor3, (x, y) => x / y);

// console.log(mtcars.mpg);
// console.log(factor3.indices);

const mtcars = (await fetchJSON(`../datasets/mtcars.json`)) as Mtcars;
const scene = Scene.of(mtcars);
Scene.append(app, scene);

const plot1 = Plots.scatter(scene, (d) => [d.wt, d.mpg]);
const plot2 = Plots.scatter(scene, (d) => [d.cyl, d.disp]);

Scene.addPlot(scene, plot1);
Scene.addPlot(scene, plot2);
Marker.update(scene.marker, [0, 1, 2, 3], { group: Group.First });

const foo = Plots.bar([mtcars.cyl]);

// const plot1 = Plot.of();
// const plot2 = Plot.of();
// Scene.addPlot(scene, plot1);
// Scene.addPlot(scene, plot2);

// Expanse.set(
//   plot1.scales.x.domain,
//   (e) => {
//     const [min, max] = minmax(mtcars.wt);
//     e.min = min;
//     e.max = max;
//     e.zero = 0.1;
//     e.one = 0.9;
//   },
//   { default: true }
// );

// Expanse.set(
//   plot1.scales.y.domain,
//   (e) => {
//     const [min, max] = minmax(mtcars.mpg);
//     e.min = min;
//     e.max = max;
//     e.zero = 0.1;
//     e.one = 0.9;
//   },
//   { default: true }
// );

// Plot.addGeom(
//   plot1,
//   Points.of(
//     { x: mtcars.wt, y: mtcars.mpg, [LAYER]: Array(mtcars.mpg.length).fill(7) },
//     plot1.scales
//   )
// );

// const foo = ExpansePoint.of(["a"]);
// const bar = Expanse.unnormalize(foo, 1);

// const f1 = Factor.bin(mtcars.wt);

// const reactiveData = ReactiveData.of(
//   mtcars,
//   { width: 5 },
//   (d, p) => Factor.bin(d.mpg, p),
//   (d, f) => ({ sum: Aggregator.aggregate(d.mpg, f, Aggregator.sum) })
// );

// // console.log(reactiveData.data);
// ReactiveData.set(reactiveData, (p) => (p.width = 1));

// console.log(reactiveData.data);

// console.log(Scale.pushforward(plot1.scales.area, 76));
// console.log(Scale.pushforward(plot1.scales.area, 400));
