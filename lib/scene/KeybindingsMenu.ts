import { Plot } from "../plot/Plot";
import { DOM } from "../utils/DOM";
import { capitalize, tw } from "../utils/funs";
import { Scene } from "./Scene";

type Event = Scene.Event | Plot.Event;
type KeyBindings = Record<string, Event>;

export namespace KeybindingsMenu {
  export function of(keybindings: KeyBindings) {
    const container = DOM.element(`div`);
    const modal = DOM.element(`div`, { id: `modal` });
    const bindingsContainer = DOM.element(`div`, { id: `bindings` });
    const button = DOM.element(`button`, { textContent: `key bindings` });

    DOM.addClasses(
      modal,
      tw(
        "tw-absolute tw-left-0 tw-top-0 tw-z-50 tw-flex tw-size-full tw-flex-col tw-items-center tw-bg-slate-800 tw-bg-opacity-80 tw-p-10",
      ),
    );

    DOM.addClasses(
      bindingsContainer,
      tw(
        "tw-relative tw-flex tw-h-full tw-w-fit tw-flex-col tw-flex-wrap tw-justify-start tw-py-10",
      ),
    );

    DOM.addClasses(
      button,
      tw(
        "tw-absolute tw-right-0 tw-top-0 tw-z-30 tw-select-none tw-rounded-bl-md tw-bg-gray-300 tw-p-1 tw-px-2 tw-text-sm tw-text-white hover:tw-bg-gray-400",
      ),
    );

    DOM.append(container, modal);
    DOM.append(container, button);
    DOM.append(modal, bindingsContainer);

    bindingsContainer.style.columnFill = `auto`;

    modal.style.display = `none`;
    let locked = false;

    function showModal() {
      modal.style.display = `flex`;
    }

    function hideModal() {
      if (!locked) modal.style.display = `none`;
    }

    button.addEventListener(`click`, showModal);
    modal.addEventListener(`click`, hideModal);

    for (const [k, v] of Object.entries(keybindings)) {
      const node = DOM.element(`span`, {
        classes: tw("tw-m-1 tw-flex tw-flex-row"),
      });
      const button = DOM.element(`button`, { textContent: k });
      const text = DOM.element(`div`, {
        classes: tw("tw-m-1 tw-p-1 tw-px-2 tw-text-white"),
        textContent: capitalize(v.replaceAll(`-`, ` `)),
      });

      DOM.addClasses(
        button,
        tw(
          "tw-m-1 tw-w-8 tw-rounded-md tw-bg-gray-400 tw-p-1 tw-px-2 tw-text-center tw-text-white tw-outline-none hover:tw-bg-gray-500",
        ),
      );

      DOM.append(node, button);
      DOM.append(node, text);

      text.addEventListener(`click`, (event) => event.stopPropagation());
      button.addEventListener(`click`, (event) => {
        if (locked) return;
        event.stopPropagation();
        DOM.addClasses(
          button,
          tw("text-black bg-slate-200 hover:bg-slate-200"),
        );
        window.addEventListener(`keydown`, listener);
        locked = true;
      });

      const listener = (event: KeyboardEvent) => {
        const { key } = event;
        const oldKey = button.innerText;

        if (key in keybindings && key !== oldKey) return;

        setKeyBinding(keybindings, key, v);
        button.innerText = event.key;

        DOM.removeClasses(
          button,
          tw("tw-text-black tw-bg-slate-200 hover:tw-bg-slate-200"),
        );
        window.removeEventListener(`keydown`, listener);
        locked = false;
      };

      bindingsContainer.appendChild(node);
    }

    return container;
  }

  function setKeyBinding(
    keybindings: Record<string, Event>,
    key: string,
    event: Event,
  ) {
    let oldkey: string | undefined = undefined;

    for (const [k, v] of Object.entries(keybindings)) {
      if (v === event) {
        oldkey = k;
        break;
      }
    }

    if (oldkey) delete keybindings[oldkey];
    keybindings[key] = event;
  }
}
