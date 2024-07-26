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
} from "../lib/main";
import { Points } from "../lib/Points";
import { fetchJSON, minmax } from "../lib/utils/funs";
import { PARENT } from "../lib/utils/symbols";

const app = document.querySelector<HTMLDivElement>("#app")!;
// Marker.update(m, [1, 2, 3], 4);
// Marker.update(m, [1, 2, 3, 4, 5, 6], Transient);

// console.log(m.indices);
// Marker.clearTransient(m);

// const foof = Expanse;

// const expanse1 = ExpansePoint.of(["a", "b", "c", "d"]);
// const expanse2 = ExpanseContinuous.of(1, 10);

// const scale1 = Scale.of(expanse1, expanse2);
// console.log(Scale.pushforward(scale1, "b"));

const frame1 = Frame.of(
  <canvas class="absolute top-0 right-0 w-full h-full bg-red-100 bg-opacity-50"></canvas>
);

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

const mtcars = await fetchJSON(`../datasets/mtcars.json`);

const plot = Plot.of();
Plot.append(app, plot);

Expanse.set(plot.scales.x.domain, (e) => {
  const [min, max] = minmax(mtcars.wt);
  e.min = min;
  e.max = max;
  e.zero = 0.1;
  e.one = 0.9;
});

Expanse.set(plot.scales.y.domain, (e) => {
  const [min, max] = minmax(mtcars.mpg);
  e.min = min;
  e.max = max;
  e.zero = 0.1;
  e.one = 0.9;
});

Plot.addGeom(plot, Points.of({ x: mtcars.wt, y: mtcars.mpg }, plot.scales));
