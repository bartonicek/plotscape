import { getMargins } from "../funs";
import { Contexts } from "../plot/Plot";
import { Scale } from "../scales/Scale";
import { GraphicObject } from "../types";

export interface AxisTitle extends GraphicObject {
  scale: Scale;
}

export function newAxisTitle(scale: Scale): AxisTitle {
  return { scale, render };
}

function render(this: AxisTitle, contexts: Contexts) {
  const along = this.scale.aes;

  if (!along) return;

  const context = contexts.base;
  const name = this.scale.name();
  const margins = getMargins();
  const offset = along === `x` ? margins[0] : margins[1];

  const dim1 = this.scale.codomain.unnormalize(0.5);
  const dim2 = this.scale.other!.codomain.unnormalize(0) - (offset * 2) / 3;

  if (along === `x`) context.text(dim1, dim2, name);
  if (along === `y`) context.text(dim2, dim1, name, { vertical: true });
}
