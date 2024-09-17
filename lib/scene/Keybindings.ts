import { capitalize, removeTailwind, tw } from "../main";
import { DOM } from "../utils/DOM";
import { Scene } from "./Scene";

export function keybindingsMenu(scene: Scene) {
  const container = DOM.element(`div`);
  const modal = DOM.element(`div`, { id: `modal` });
  const bindingsContainer = DOM.element(`div`, { id: `bindings` });
  const button = DOM.element(`button`, { textContent: `key bindings` });

  DOM.addClasses(
    modal,
    tw(
      "tailwind absolute left-0 top-0 z-50 flex size-full flex-col items-center bg-slate-800 bg-opacity-80 p-10",
    ),
  );

  DOM.addClasses(
    bindingsContainer,
    tw("relative flex h-full w-fit flex-col flex-wrap justify-start py-10"),
  );

  DOM.addClasses(
    button,
    tw(
      "absolute right-0 top-0 z-30 select-none rounded-bl-md bg-gray-300 p-1 px-2 text-sm text-white hover:bg-gray-400",
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

  const bindings = scene.keybindings;

  for (const [k, v] of Object.entries(bindings)) {
    const node = DOM.element(`span`, { classes: tw("m-1 flex flex-row") });
    const button = DOM.element(`button`, { textContent: k });
    const text = DOM.element(`div`, {
      classes: tw("m-1 p-1 px-2 text-white"),
      textContent: capitalize(v.replaceAll(`-`, ` `)),
    });

    DOM.addClasses(
      button,
      tw(
        "m-1 w-8 rounded-md bg-gray-400 p-1 px-2 text-center text-white outline-none hover:bg-gray-500",
      ),
    );

    DOM.append(node, button);
    DOM.append(node, text);

    text.addEventListener(`click`, (event) => event.stopPropagation());
    button.addEventListener(`click`, (event) => {
      if (locked) return;
      event.stopPropagation();
      DOM.addClasses(button, tw("text-black bg-slate-200 hover:bg-slate-200"));
      window.addEventListener(`keydown`, listener);
      locked = true;
    });

    const listener = (event: KeyboardEvent) => {
      const { key } = event;
      const oldKey = button.innerText;

      if (key in bindings && key !== oldKey) return;

      Scene.setKeyBinding(scene, key, v);
      button.innerText = event.key;
      removeTailwind(button, `text-black bg-slate-200 hover:bg-slate-200`);

      window.removeEventListener(`keydown`, listener);
      locked = false;
    };

    bindingsContainer.appendChild(node);
  }

  return container;
}
