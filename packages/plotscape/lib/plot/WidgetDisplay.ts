import { element } from "utils";
import { Widget } from "../widgets/Widget";

export interface WidgetDisplay {
  initialized: boolean;
  modal: HTMLDialogElement;
  container: HTMLDivElement;
  show(): void;
  addWidget(widget: Widget): void;
}

export function newWidgetDisplay(parent: HTMLDivElement): WidgetDisplay {
  const modal = element(`dialog`).addClass(`ps-modal`).appendTo(parent).get();
  const container = element(`div`)
    .addClass(`ps-widget-display`)
    .appendTo(modal)
    .get();

  modal.onclick = (event) => (event.stopPropagation(), modal.close());
  container.onclick = (event) => event.stopPropagation();

  const initialized = false;

  const self = { initialized, container, modal, show, addWidget };
  return self;
}

function show(this: WidgetDisplay) {
  this.modal.showModal();
}

function addWidget(this: WidgetDisplay, widget: Widget) {
  this.container.appendChild(widget.container);
}
