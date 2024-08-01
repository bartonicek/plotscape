import { Expanse, Plots, Scene } from "../lib/main";
import { fetchJSON } from "../lib/utils/funs";

const app = document.querySelector<HTMLDivElement>("#app")!;

const mtcars = await fetchJSON(`../datasets/mtcars.json`);
mtcars.cyl = mtcars.cyl.map((x) => x.toString());

const scene = Scene.of(mtcars);
Scene.append(app, scene);

const plot1 = Plots.scatter(scene, (d) => [d.wt, d.mpg]);
const plot2 = Plots.scatter(scene, (d) => [d.cyl, d.disp]);
const plot3 = Plots.bar(scene, (d) => [d.cyl, d.mpg]);

Scene.addPlot(scene, plot1);
Scene.addPlot(scene, plot2);
Scene.addPlot(scene, plot3);

// Reactive.listen(plot3.geoms[0].data.grouped, `changed`, () =>
//   console.log(plot3.geoms[0].data.grouped)
// );

// Marker.update(scene.marker, [1, 2, 3, 4, 5], { group: Group.First });

const d = plot3.scales.y.codomain;
Expanse.listen(d, `changed`, (e) => console.log(d, e));
