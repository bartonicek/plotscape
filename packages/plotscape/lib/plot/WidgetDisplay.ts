import { clearChildren, element } from "utils";
import { Widget } from "../widgets/Widget";

/** Displays widgets related to plot parameters. */
export interface WidgetDisplay {
  modal: HTMLDialogElement;
  container: HTMLDivElement;
  initialized: boolean;
  show(): this;
  clear(): this;
  addWidget(widget: Widget): this;
  isInitialized(): boolean;
  setInitialized(value: boolean): this;
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

  const props = { initialized, container, modal };
  const methods = { show, addWidget, clear, isInitialized, setInitialized };
  const self = { ...props, ...methods };

  return self;
}

function isInitialized(this: WidgetDisplay) {
  return this.initialized;
}

function setInitialized(this: WidgetDisplay, value: boolean) {
  this.initialized = value;
  return this;
}

function show(this: WidgetDisplay) {
  if (!this.container.childNodes.length) return this;
  this.modal.showModal();
  return this;
}

function clear(this: WidgetDisplay) {
  const { container } = this;
  clearChildren(container);
  return this;
}

function addWidget(this: WidgetDisplay, widget: Widget | undefined) {
  if (widget) {
    widget.render();
    this.container.appendChild(widget.container);
  }
  return this;
}
