import { Plot } from "../plot/Plot";
import { GraphicObject } from "../types";

export interface AxisTitle extends GraphicObject {
  plot: Plot;
  axis: `x` | `y`;
  render(): void;
}

export function newAxisTitle(plot: Plot, axis: `x` | `y`): AxisTitle {
  return { plot, axis, render };
}

function render(this: AxisTitle) {
  const { plot, axis } = this;

  if (!axis) return;

  const scale = plot.scales[axis];
  const context = this.plot.contexts.base;
  const name = scale.name();
  const margins = plot.margins;
  const offset = axis === `x` ? margins[0] : margins[1];

  const dim1 = scale.codomain.unnormalize(0.5);
  const dim2 = scale.other!.codomain.unnormalize(0) - (offset * 2) / 3;

  if (axis === `x`) context.text(dim1, dim2, name);
  if (axis === `y`) context.text(dim2, dim1, name, { vertical: true });
}
