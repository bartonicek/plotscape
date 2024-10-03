import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Meta } from "../utils/Meta";
import { Frame } from "./Frame";
import { Plot } from "./Plot";

export function renderAxisLabels(plot: Plot) {
  renderSingleAxisLabels(plot, `x`);
  renderSingleAxisLabels(plot, `y`);
}

function renderSingleAxisLabels(plot: Plot, axis: `x` | `y`) {
  const { frames, scales, options } = plot;
  const { margins, marginLines } = options;

  const scale = scales[axis];
  const other = axis === `x` ? scales.y : scales.x;
  const frame = frames[`${axis}Axis`];

  const { context } = frame;

  const { labels, positions } = Scale.breaks(scale);
  const [bottom, left, top, right] = margins;
  const fontsize = parseInt(context.font.match(/^[0-9]*/)![0], 10);
  const base = other!.codomain.props.min - fontsize / 2;

  const { width, height } = frame;
  Frame.clear(frame);

  if (axis === "x") {
    let [lastX, lastW] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const x = positions[i];
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
      const y = positions[i];
      const w = Frame.textWidth(frame, label) + 1;
      const h = Frame.textHeight(frame, label) + 1;

      if (outside(y, bottom, height - top)) continue;
      if (overlap(lastY, y, lastH, h)) continue;

      // Enforce a gap between y-axis labels and title
      while (margins[1] / 2 < w + h) {
        marginLines[1] *= 1.05;
        Plot.resize(plot);
      }

      [lastY, lastH] = [y, h];

      Frame.text(frame, base, y, label);
    }
  }
}

export function renderAxisTitles(plot: Plot) {
  renderSingleAxisTitle(plot, `x`);
  renderSingleAxisTitle(plot, `y`);
}

function renderSingleAxisTitle(plot: Plot, axis: `x` | `y`) {
  const { scales, frames, options } = plot;
  const { margins } = options;
  const scale = scales[axis];
  const other = axis === `x` ? plot.scales.y : plot.scales.x;

  const frame = frames.base;
  const name = Meta.get(scale, `name`) as string;
  const offset = axis === `x` ? margins[0] : margins[1];

  const dim1 = Expanse.unnormalize(scale.codomain, 0.5);
  const dim2 = Expanse.unnormalize(other!.codomain, 0) - (offset * 2) / 3;

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
