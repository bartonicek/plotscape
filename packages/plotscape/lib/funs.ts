import { diff, times } from "utils";
import graphicParameters from "./graphicParameters.json";
import { Margins, Rect } from "./types";

export function getMargins() {
  const { marginLines, axisTitleFontsize } = graphicParameters;
  return marginLines.map(times(axisTitleFontsize)) as Margins;
}

/**
 * Checks whether two rectangles overlap.
 *
 * @param rect1 A rectangle defined by four corner coordinates
 * @param rect2 Another rectangle
 * @returns `true` if the rectangles overlap, `false` otherwise
 */
export function rectsIntersect(rect1: Rect, rect2: Rect) {
  const [r1xmin, r1xmax] = [rect1[0], rect1[2]].sort(diff);
  const [r1ymin, r1ymax] = [rect1[1], rect1[3]].sort(diff);
  const [r2xmin, r2xmax] = [rect2[0], rect2[2]].sort(diff);
  const [r2ymin, r2ymax] = [rect2[1], rect2[3]].sort(diff);

  return !(
    r1xmax < r2xmin || // If any holds, rectangles don't overlap
    r1xmin > r2xmax ||
    r1ymax < r2ymin ||
    r1ymin > r2ymax
  );
}

type Segment = Rect;
function segmentToPointVec(segment: Segment) {
  const [x0, y0, x1, y1] = segment;
  return [x0, y0, x1 - x0, y1 - y0];
}

function inRange(value: number, min: number, max: number) {
  return !(value < min) && !(value > max);
}

export function segmentsIntersect(segment1: Segment, segment2: Segment) {
  let [s1x0, s1y0, s1x1, s1y1] = segmentToPointVec(segment1);
  let [s2x0, s2y0, s2x1, s2y1] = segmentToPointVec(segment2);

  const det = s2x1 * s1y1 - s1x1 * s2y1;
  const s = ((s1x0 - s2x0) * s1y1 - (s1y0 - s2y0) * s1x1) / det;
  const t = -(-(s1x0 - s2x0) * s2y1 + (s1y0 - s2y0) * s2x1) / det;

  return inRange(s, 0, 1) && inRange(t, 0, 1);
}

export function rectSegmentIntersect(rect: Rect, segment: Segment) {
  const [x0, y0, x1, y1] = rect;
  return (
    segmentsIntersect([x0, y0, x1, y0], segment) ||
    segmentsIntersect([x0, y0, x0, y1], segment) ||
    segmentsIntersect([x1, y0, x1, y1], segment) ||
    segmentsIntersect([x0, y1, x1, y1], segment)
  );
}
