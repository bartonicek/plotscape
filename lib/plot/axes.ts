import { Expanse, Frame, Scale } from "../main";
import { formatLabels, getMargins, getName } from "../utils/funs";
import { Plot } from "./Plot";

export function renderAxisLabels(plot: Plot, axis: `x` | `y`) {
  const scale = plot.scales[axis];
  const frame = plot.frames[`${axis}Axis`];
  const { context } = frame;

  const breaks = Scale.breaks(scale) as string[] | number[];
  const labels = formatLabels(breaks);
  const [bottom, left, top, right] = getMargins();
  const fontsize = parseInt(context.font.match(/^[0-9]*/)![0], 10);

  const base = scale.other!.codomain.min - fontsize / 2;

  const { width, height } = frame;
  Frame.clear(frame);

  if (axis === "x") {
    let [lastX, lastW] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const x = Scale.pushforward(scale, breaks[i]);
      const w = Frame.textWidth(frame, label) + 1;

      if (outside(x, left, width - right)) continue;
      if (overlap(lastX, x, lastW, w)) continue;
      [lastX, lastW] = [x, w];

      Frame.text(frame, x, base, label);
    }
  } else if (axis === "y") {
    let [lastY, lastH] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const y = Scale.pushforward(scale, breaks[i]);
      const w = Frame.textWidth(frame, label) + 1;
      const h = Frame.textHeight(frame, label) + 1;

      if (plot.margins[1] / 2 < w) {
        plot.margins[1] = 2 * w;
        Plot.dispatch(plot, `resize`);
      }

      if (outside(y, bottom, height - top)) continue;
      if (overlap(lastY, y, lastH, h)) continue;
      [lastY, lastH] = [y, h];

      Frame.text(frame, base, y, label);
    }
  }
}

export function renderAxisTitle(plot: Plot, axis: `x` | `y`) {
  const { scales, frames, margins } = plot;
  const scale = scales[axis];
  const frame = frames.base;
  const name = getName(scale);
  const offset = axis === `x` ? margins[0] : margins[1];

  const dim1 = Expanse.unnormalize(scale.codomain, 0.5);
  const dim2 = Expanse.unnormalize(scale.other!.codomain, 0) - (offset * 2) / 3;

  if (axis === `x`) Frame.text(frame, dim1, dim2, name);
  if (axis === `y`) Frame.text(frame, dim2, dim1, name, { vertical: true });
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
