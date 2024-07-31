import { Mtcars, Plots, Scene } from "../lib/main";
import { fetchJSON } from "../lib/utils/funs";

const app = document.querySelector<HTMLDivElement>("#app")!;

const mtcars = (await fetchJSON(`../datasets/mtcars.json`)) as Mtcars;
// const factor1 = Factor.from(mtcars.cyl);
// const factor2 = Factor.bin(mtcars.mpg, pars);
// const factor3 = Factor.product(factor1, factor2);

// Factor.listen(factor2, `changed`, () => console.log(factor2.data));
// Reactive.set(pars, (p) => (p.width = 10));

// const agg2 = Aggregator.aggregate(mtcars.mpg, factor3, Aggregator.sum);
// const agg3 = Aggregator.stack(agg2, factor3, Aggregator.sum);

// const agg4 = Aggregator.normalize(agg3, factor3, (x, y) => x / y);

const scene = Scene.of(mtcars);
Scene.append(app, scene);

const plot1 = Plots.scatter(scene, (d) => [d.wt, d.mpg]);
const plot2 = Plots.scatter(scene, (d) => [d.cyl, d.disp]);
const plot3 = Plots.bar(scene, (d) => [d.cyl, d.mpg]);

Scene.addPlot(scene, plot1);
Scene.addPlot(scene, plot2);
Scene.addPlot(scene, plot3);

// if (Reactive.isReactive(foo[1])) {
//   Reactive.listen(foo[1], `changed`, () => console.log(foo[1]));
// }

// Marker.update(scene.marker, [1, 2, 3, 4, 5], { group: Group.First });
