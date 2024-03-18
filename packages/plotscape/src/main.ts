import { fetchJSON } from "utils";
import { newValueEmitter } from "../lib/ValueEmitter.ts";
import { col } from "../lib/dataframe/ColumnParser.ts";
import { parseColumns } from "../lib/dataframe/Dataframe.ts";
import { factorBin } from "../lib/factors/factorBin.ts";
import { factorFrom } from "../lib/factors/factorFrom.ts";
import { factorProduct } from "../lib/factors/factorProduct.ts";
import { newReducedDataframe } from "../lib/reducers/ReducedDataframe.ts";
import { sumReducer } from "../lib/reducers/Reducer.ts";
import { newReducerHandler } from "../lib/reducers/ReducerHandler.ts";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const mpgJSON = await fetchJSON("../datasets/mpg.json");

const spec = {
  manufacturer: col(`discrete`),
  displ: col(`continuous`),
  hwy: col(`continuous`),
};

const mpgData = parseColumns(mpgJSON, spec);

const width = newValueEmitter(5);

const f1 = factorFrom(mpgData.col(`manufacturer`));
const f2 = factorBin(mpgData.col(`hwy`), width);

const f3 = factorProduct(f1, f2);

f3.listen(`changed`, () => {
  console.log(f3.parent!.levels);
});

const reducers = {
  stat1: newReducerHandler(mpgData.col(`displ`), sumReducer),
};

const rd = newReducedDataframe(f1, reducers);
const rd2 = rd.refine(f2);

rd2.listen(`changed`, () => {
  console.log(
    rd2
      .select((d) => ({
        var0: d.label,
        var1: d.stat1.stack().normalizeByParent(),
      }))
      .rows()
  );
});

rd2.emit(`changed`);
width.setValue(2);

// rd2.reducers.stat1 = rd2.reducers.stat1.stack().normalizeByParent();
// rd2.columns.stat1 = rd2.reducers.stat1.result;

// console.log(rd2.rows());

// const x = mpgData.select((d) => ({ var1: d.displ }));
