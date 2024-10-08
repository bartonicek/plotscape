import { Expanse } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Metadata } from "../utils/Metadata";
import { Frame } from "./Frame";
import { Plot } from "./Plot";

export namespace Axes {
  export function renderLabels(plot: Plot) {
    renderXAxisLabels(plot);
    renderYAxisLabels(plot);
  }

  function renderXAxisLabels(plot: Plot) {
    const { frames, scales, options } = plot;
    const { margins } = options;

    const scale = scales.x;
    const other = scales.y;
    const frame = frames.xAxis;

    const { context, width } = frame;
    const fontsize = parseInt(context.font.match(/^[0-9]*/)![0], 10);
    const base = other.codomain.props.min - fontsize / 2;

    const [, left, , right] = margins;
    const { labels, positions } = Scale.breaks(scale);
    Frame.clear(frame);

    let [lastX, lastW] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const x = positions[i];
      const w = Frame.textWidth(frame, label) + 1;

      if (isOutside(x, left, width - right)) continue;
      if (overlaps(lastX, x, lastW, w)) continue;

      [lastX, lastW] = [x, w];
      Frame.text(frame, x, base, label);
    }
  }

  function renderYAxisLabels(plot: Plot) {
    const { frames, scales, options } = plot;
    const { margins, marginLines } = options;

    const scale = scales.y;
    const other = scales.x;
    const frame = frames.yAxis;

    const { context, height } = frame;
    const fontsize = parseInt(context.font.match(/^[0-9]*/)![0], 10);
    const base = other.codomain.props.min - fontsize / 2;

    const [bottom, , top] = margins;
    const { labels, positions } = Scale.breaks(scale);
    Frame.clear(frame);

    let [lastY, lastH] = [0, 0];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const y = positions[i];
      const w = Frame.textWidth(frame, label) + 1;
      const h = Frame.textHeight(frame, label) + 1;

      if (isOutside(y, bottom, height - top)) continue;
      if (overlaps(lastY, y, lastH, h)) continue;

      // Enforce a gap between y-axis labels and title
      while (margins[1] / 2 < w + h) {
        marginLines[1] *= 1.05;
        Plot.resize(plot);
      }

      [lastY, lastH] = [y, h];
      Frame.text(frame, base, y, label);
    }
  }

  export function renderTitles(plot: Plot) {
    renderXAxisTitle(plot);
    renderYAxisTitle(plot);
  }

  function renderXAxisTitle(plot: Plot) {
    const { scales, frames, options } = plot;
    const { margins } = options;
    const scale = scales.x;
    const other = scales.y;

    const frame = frames.base;
    const name = Metadata.get(scale, `name`);
    const offset = margins[0];

    const x = Expanse.unnormalize(scale.codomain, 0.5);
    const y = Expanse.unnormalize(other.codomain, 0) - (offset * 2) / 3;

    Frame.text(frame, x, y, name);
  }

  function renderYAxisTitle(plot: Plot) {
    const { scales, frames, options } = plot;
    const { margins } = options;
    const scale = scales.y;
    const other = scales.x;

    const frame = frames.base;
    const name = Metadata.get(scale, `name`);
    const offset = margins[1];

    const y = Expanse.unnormalize(scale.codomain, 0.5);
    const x = Expanse.unnormalize(other.codomain, 0) - (offset * 2) / 3;

    Frame.text(frame, x, y, name, { vertical: true });
  }

  function isOutside(pos: number, lim1: number, lim2: number) {
    return pos < lim1 || pos > lim2;
  }

  function overlaps(pos1: number, pos2: number, dim1: number, dim2: number) {
    const [l1, u1] = [pos1 - dim1 / 2, pos1 + dim1 / 2];
    const [l2, u2] = [pos2 - dim2 / 2, pos2 + dim2 / 2];

    if (l1 < u2 && u1 >= l2) return true;
    return false;
  }
}
