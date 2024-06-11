import { formatLabels, getMargins } from "../funs";
import { Contexts, Plot } from "../plot/Plot";

export interface AxisLabels {
  axis: "x" | "y";
  plot: Plot;
  render(contexts: Contexts): void;
}

export function newAxisLabels(plot: Plot, axis: "x" | "y"): AxisLabels {
  return { plot, axis, render };
}

function render(this: AxisLabels, contexts: Contexts) {
  const { plot, axis } = this;
  const scale = plot.scales[axis];
  const context = contexts[`${axis}Axis`];

  const breaks = scale.breaks() as string[] | number[];
  const labels = formatLabels(breaks);
  const [bottom, left, top, right] = getMargins();
  const base = scale.other!.codomain.min - context.fontsize / 2;

  const { width, height } = context;
  context.clear();

  if (axis === "x") {
    let [lastX, lastW] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const x = scale.pushforward(breaks[i]);
      const w = context.textWidth(label) + 1;

      if (outside(x, left, width - right)) continue;
      if (overlap(lastX, x, lastW, w)) continue;
      [lastX, lastW] = [x, w];

      context.text(x, base, label);
    }
  } else if (axis === "y") {
    let [lastY, lastH] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const y = scale.pushforward(breaks[i]);
      const w = context.textWidth(label) + 1;
      const h = context.textHeight(label) + 1;

      if (plot.margins[1] / 2 < w) {
        plot.margins[1] = 2 * w;
        plot.resize();
      }

      if (outside(y, bottom, height - top)) continue;
      if (overlap(lastY, y, lastH, h)) continue;
      [lastY, lastH] = [y, h];

      context.text(base, y, label);
    }
  }
}

function outside(pos: number, lim1: number, lim2: number) {
  return pos < lim1 || pos > lim2;
}

function overlap(pos1: number, pos2: number, dim1: number, dim2: number) {
  const [l1, u1] = [pos1 - dim1 / 2, pos1 + dim1 / 2];
  const [l2, u2] = [pos2 - dim2 / 2, pos2 + dim2 / 2];

  if (l1 < u2 && u1 >= l2) return true;
  return false;
}
