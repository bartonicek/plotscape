import tinycolor from "tinycolor2";
import { Margins } from "./types";

export const defaultParameters = {
  radius: 5,
  expandX: 0.1,
  expandY: 0.1,
  gapPct: 0.8,
  gapPx: 1,
  axisLabelFontsize: 1,
  axisTitleFontsize: 1.5,
  marginLines: [3.5, 3.5, 1, 1] as Margins,
  groupColors: ["#984ea3", "#e41a1c", "#4daf4a", "#377eb8"],
  plotBackground: `#fefffe`,
};

export const colors = [] as string[];

for (const c of defaultParameters.groupColors) {
  const color = tinycolor(c).darken(10).saturate(20).toString();
  colors.push(color);
}

for (const c of defaultParameters.groupColors) {
  const color = tinycolor(c).lighten(20).saturate(20).toString();
  colors.push(color);
}
