import { element, noop, values } from "utils";
import { newPlot } from "../plot/Plot";
import { Scene } from "../scene/Scene";

/**
 * Creates a "noteplot" (which is not a plot) and embeds it in a scene.
 * @param scene A scene object
 * @returns The newly created noteplot
 */
export function newNoteplot(scene: Scene): any {
  const plot = newPlot(scene);

  // Remove all contexts
  for (const context of values(plot.contexts)) context.canvas.remove();

  const textarea = element(`textarea`).appendTo(plot.container).get();
  textarea.value = `\nWrite notes here....`;

  plot.localKeyActions[`KeyP`] = noop;

  return { ...plot, textarea };
}
