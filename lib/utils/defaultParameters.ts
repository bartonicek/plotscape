import { Margins } from "./types";
import tinycolor from "tinycolor2";

export const defaultParameters = {
  radius: 3,
  expandX: 0.05,
  expandY: 0.05,
  gapPct: 0.8,
  gapPx: 1,
  axisLabelFontsize: 12,
  axisTitleFontsize: 14,
  marginLines: [4, 4, 1, 1] as Margins,
  groupColors: ["#984ea3", "#e41a1c", "#4daf4a", "#377eb8"],
  plotBackground: `#fefffe`,
};

export const colors = [] as string[];

for (const c of defaultParameters.groupColors) {
  const color = tinycolor(c).darken(10).saturate(15).toString();
  colors.push(color);
}

for (const c of defaultParameters.groupColors) {
  const color = tinycolor(c).lighten(15).saturate(15).toString();
  colors.push(color);
}
