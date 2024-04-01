import { element } from "utils";
import { Widget } from "../widgets/Widget";

/** Displays widgets related to plot parameters. */
export interface WidgetDisplay {
  modal: HTMLDialogElement;
  container: HTMLDivElement;
  initialized: boolean;
  show(): void;
  addWidget(widget: Widget): void;
}

export function newWidgetDisplay(parent: HTMLDivElement): WidgetDisplay {
  const modal = element(`dialog`)
    .addClass(`ps-widget-modal`)
    .appendTo(parent)
    .get();

  const container = element(`div`)
    .addClass(`ps-widget-display`)
    .appendTo(modal)
    .get();

  modal.onclick = (event) => (event.stopPropagation(), modal.close());
  container.onclick = (event) => event.stopPropagation();
  container.onmousemove = (event) => event.stopPropagation();

  const initialized = false;

  const self = { initialized, container, modal, show, addWidget };
  return self;
}

function show(this: WidgetDisplay) {
  if (!this.container.childNodes.length) return;
  this.modal.showModal();
}

function addWidget(this: WidgetDisplay, widget: Widget) {
  if (widget) this.container.appendChild(widget.container);
}
