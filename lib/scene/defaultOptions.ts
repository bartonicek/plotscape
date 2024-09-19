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
  marginLines: [3.5, 3.5, 1, 1] as Margins,
  colors: [
    `#FF7F00`,
    `#E31A1C`,
    `#33A02C`,
    `#1F78B4`,
    `#FDBF6F`,
    `#FB9A99`,
    `#B2DF8A`,
    `#A6CEE3`,
  ],
  plotBackground: `#fefffe`,
};

updateOptions(defaultOptions);

export type GraphicalOptions = typeof defaultOptions;

export function updateOptions(options: GraphicalOptions) {
  // Check if we really are in the browser
  // E.g. to avoid accidentally breaking tests by importing from ./main
  if (!globalThis.window) return;

  const { marginLines, axisTitleSize: ts } = options;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  options.margins = marginLines.map((x) => x * rem * ts) as Margins;
}
