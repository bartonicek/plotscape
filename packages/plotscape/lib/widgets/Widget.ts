import { Named } from "../mixins/Named";
import { Observable } from "../mixins/Observable";

export interface Widget extends Named, Observable {
  container: HTMLDivElement;
  render(): this;
}
