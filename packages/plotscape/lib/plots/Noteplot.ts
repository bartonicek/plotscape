import { element, noop, values } from "utils";
import { newPlot } from "../plot/Plot";
import { Scene } from "../scene/Scene";

export function newNoteplot(scene: Scene): any {
  const plot = newPlot(scene);

  // Remove all contexts
  for (const context of values(plot.contexts)) context.canvas.remove();

  const textarea = element(`textarea`).appendTo(plot.container).get();
  textarea.value = `\nWrite notes here....`;

  plot.localKeyActions[`KeyP`] = noop;

  return { ...plot, textarea };
}
