import { element, values } from "utils";
import { newPlot } from "../plot/Plot";
import { Scene } from "../scene/Scene";

export function newNoteplot(scene: Scene) {
  const plot = newPlot(scene);

  for (const context of values(plot.contexts)) context.canvas.remove();

  const textarea = element(`textarea`).appendTo(plot.container).get();
  textarea.value = `Write notes here....`;
}
