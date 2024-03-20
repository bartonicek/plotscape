import { fetchJSON } from "utils";
import { newScene } from "../lib/Scene.ts";
import { newValueEmitter } from "../lib/ValueEmitter.ts";
import { col } from "../lib/dataframe/ColumnParser.ts";
import { parseColumns } from "../lib/dataframe/Dataframe.ts";
import { newBarplot } from "../lib/plots/Barplot.ts";
import { newScatter } from "../lib/plots/Scatterplot.ts";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const mpgJSON = await fetchJSON("../datasets/mpg.json");

const spec = {
  year: col(`discrete`),
  manufacturer: col(`discrete`),
  displ: col(`continuous`),
  hwy: col(`continuous`),
};

const mpgData = parseColumns(mpgJSON, spec);
const width = newValueEmitter(5);

const scene = newScene(app, mpgData);

const plot4 = newBarplot(scene, (d) => ({ v1: d.manufacturer }));
const plot2 = newScatter(scene, (d) => ({ v1: d.displ, v2: d.hwy }));
const plot3 = newScatter(scene, (d) => ({ v1: d.manufacturer, v2: d.displ }));

// const f1 = factorFrom(mpgData.col(`manufacturer`));
// const f2 = factorBin(mpgData.col(`hwy`), width);

// const f3 = factorProduct(f1, f2);

// const reducers = {
//   stat1: newReducerHandler(mpgData.col(`displ`), sumReducer),
// };

// const rd = newReducedDataframe(f1, reducers);
// const rd2 = rd.refine(f2);

// rd2.listen(`changed`, () => {
//   console.log(
//     rd2
//       .select((d) => ({
//         var0: d.label,
//         var1: d.stat1.stack().normalizeByParent(),
//       }))
//       .rows()
//   );
// });

// rd2.emit(`changed`);
// width.setValue(2);

// // rd2.reducers.stat1 = rd2.reducers.stat1.stack().normalizeByParent();
// // rd2.columns.stat1 = rd2.reducers.stat1.result;

// // console.log(rd2.rows());

// // const x = mpgData.select((d) => ({ var1: d.displ }));

// const ctx = newContext(app);
// ctx.setBackgroundColor(`antiquewhite`);
// ctx.drawPoint(150, 150, 20);
