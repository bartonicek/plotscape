import tinycolor from "tinycolor2";
import { formatLabel, tw } from "../main";
import { defaultOptions } from "../scene/defaultOptions";
import { LAYER } from "../scene/Marker";
import { DOM } from "../utils/DOM";

export namespace QueryTable {
  export function formatQueryTable(
    table: HTMLTableElement,
    info: Record<string, any> | Record<string, any>[],
  ) {
    DOM.clearChildren(table);

    if (!Array.isArray(info)) {
      for (const [k, v] of Object.entries(info)) {
        const row = createRow(k, v);
        DOM.append(table, row);
      }
      return;
    }
    const rows = [] as any[];

    for (const dict of Object.values(info)) {
      for (const [k, v] of Object.entries(dict)) {
        const row = createRow(k, v, defaultOptions.colors[dict[LAYER]]);
        rows.push(row);
        DOM.append(table, row);
      }
    }
  }

  function createRow(key: string, value: any, color?: string) {
    const row = DOM.element(`tr`);
    const nameCell = DOM.element(`td`, {
      classes: tw("tw-border tw-border-gray-400 tw-px-3 tw-py-1"),
      textContent: key,
    });
    const valueCell = DOM.element(`td`, {
      classes: tw("tw-border tw-border-gray-400 tw-px-3 tw-py-1 tw-font-mono"),
      textContent: formatLabel(value),
    });

    if (color) {
      const col = tinycolor(color);
      nameCell.style.backgroundColor = color;
      nameCell.style.borderColor = `black`;
      valueCell.style.backgroundColor = color;
      valueCell.style.borderColor = `black`;
      if (col.getBrightness() < 127) {
        nameCell.style.color = `white`;
        valueCell.style.color = `white`;
      }
    }

    DOM.append(row, nameCell);
    DOM.append(row, valueCell);

    return row;
  }
}
