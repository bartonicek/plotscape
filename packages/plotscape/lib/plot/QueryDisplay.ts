import { Dict, element } from "utils";
import { formatQueryLabel } from "../funs";
import { Point } from "../types";

export interface QueryDisplay {
  parentContainer: HTMLDivElement;
  container: HTMLDivElement;
  clear(): void;
  renderQuery(point: Point, info: Dict | undefined): void;
}

export function newQueryDisplay(parentContainer: HTMLDivElement): QueryDisplay {
  const container = element(`div`)
    .appendTo(parentContainer)
    .addClass(`ps-query-display`)
    .get();

  return { parentContainer, container, clear, renderQuery };
}

function clear(this: QueryDisplay) {
  this.container.style.display = `none`;
}

function renderQuery(this: QueryDisplay, point: Point, info: Dict | undefined) {
  if (!info) return;

  let htmlString = ``;
  for (const [k, v] of Object.entries(info)) {
    htmlString += `${k}: ${formatQueryLabel(v)}<br>`;
  }

  const { container, parentContainer } = this;
  const { clientWidth: width, clientHeight: height } = parentContainer;

  container.innerHTML = htmlString;
  container.style.display = `inline-block`;

  const queryStyle = getComputedStyle(container);
  const queryWidth = parseFloat(queryStyle.width.slice(0, -2));

  const [x, y] = point;

  if (x + queryWidth > width) {
    container.style.left = `auto`;
    container.style.right = `${width - x + 5}px`;
  } else {
    container.style.left = `${x + 5}px`;
    container.style.right = `auto`;
  }

  container.style.top = `${height - y}px`;
}
