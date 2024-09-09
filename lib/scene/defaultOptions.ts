import tinycolor from "tinycolor2";
import { Margins } from "../utils/types";

export const defaultOptions = {
  size: 10,
  expandX: 0.1,
  expandY: 0.1,
  gapPct: 0.8,
  gapPx: 1,
  axisLabelSize: 1,
  axisTitleSize: 1.25,
  margins: [0, 0, 0, 0] as Margins, // Will get updated
  colors: [] as string[], // Will get updated
  marginLines: [3.5, 3.5, 1, 1] as Margins,
  groupColors: ["#984ea3", "#e41a1c", "#4daf4a", "#377eb8"],
  plotBackground: `#fefffe`,
};

updateOptions(defaultOptions);

export type GraphicalOptions = typeof defaultOptions;

export function updateOptions(options: GraphicalOptions) {
  const k = options.groupColors.length;
  options.colors.length = 2 * k;

  for (let i = 0; i < k; i++) {
    const c = options.groupColors[i];
    options.colors[i] = tinycolor(c).darken(10).saturate(20).toString();
    options.colors[k + i] = tinycolor(c).lighten(20).saturate(20).toString();
  }

  const { marginLines, axisTitleSize: ts } = options;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  options.margins = marginLines.map((x) => x * rem * ts) as Margins;
}
