import { Widget } from "./Widget";

export interface WidgetSource {
  widget(): Widget | undefined;
}
