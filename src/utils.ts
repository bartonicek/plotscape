import { Direction } from "./types";

export function identity<T>(x: T) {
  return x;
}
export function applyDirection(x: number, direction: Direction) {
  return 0.5 * (1 - direction) + direction * x;
}
