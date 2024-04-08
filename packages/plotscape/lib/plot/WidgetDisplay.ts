import { clearChildren, element } from "utils";
import { Widget } from "../widgets/Widget";

enum Mode {
  Default,
  Dragging,
}

/** Displays widgets related to plot parameters. */
export interface WidgetDisplay {
  mode: Mode;
  initialized: boolean;
  lastX: number;
  lastY: number;

  modal: HTMLDialogElement;
  container: HTMLDivElement;

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

  const mode = Mode.Default;
  const initialized = false;
  const [lastX, lastY] = [0, 0];

  const props = { mode, initialized, container, modal, lastX, lastY };
  const methods = { show, addWidget, clear, isInitialized, setInitialized };
  const self = { ...props, ...methods };

  container.addEventListener(`mousedown`, onMousedown.bind(self));
  container.addEventListener(`mouseup`, onMouseup.bind(self));
  container.addEventListener(`mousemove`, onMousemove.bind(self));

  modal.addEventListener(`mousedown`, () => {
    self.mode = Mode.Default;
    modal.close();
  });

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

function onMousedown(this: WidgetDisplay, event: MouseEvent) {
  event.stopPropagation();

  if (event.button != 0) return this;

  this.lastX = event.clientX;
  this.lastY = event.clientY;
  this.mode = Mode.Dragging;
  return this;
}

function onMouseup(this: WidgetDisplay, event: MouseEvent) {
  event.stopPropagation();

  this.mode = Mode.Default;
  return this;
}

function onMousemove(this: WidgetDisplay, event: MouseEvent) {
  if (this.mode != Mode.Dragging) return this;

  const { modal } = this;
  const xMove = event.clientX - this.lastX;
  const yMove = event.clientY - this.lastY;

  const { left, top } = getComputedStyle(modal);
  modal.style.left = `${parseFloat(left.slice(0, -2)) + xMove}px`;
  modal.style.top = `${parseFloat(top.slice(0, -2)) + yMove}px`;

  this.lastX = event.clientX;
  this.lastY = event.clientY;
}
