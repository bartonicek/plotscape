export interface Widget {
  container: HTMLDivElement;
  render(): void;
  setName(name: string): this;
}
