import { addTailwind, capitalize, removeTailwind } from "../main";
import React from "../utils/JSX";
import { Scene } from "./Scene";

export function keybindingsMenu(scene: Scene) {
  const container = (
    <div>
      <div>
        <div
          id="modal"
          class="absolute left-0 top-0 z-50 hidden size-full flex-col items-center justify-center bg-slate-800 bg-opacity-80"
        >
          <h1 class="relative mb-6 text-3xl font-bold text-white">
            Key bindings
          </h1>
          <div
            id="bindings"
            class="relative flex h-1/2 w-fit columns-2 flex-col flex-wrap justify-start"
          ></div>
        </div>
        <button class="absolute right-0 top-0 z-30 select-none rounded-bl-md bg-gray-300 p-1 px-2 text-sm text-white hover:bg-gray-400">
          keybindings
        </button>
      </div>
    </div>
  );

  const modal = container.querySelector<HTMLDivElement>("#modal")!;
  const bindingsContainer =
    container.querySelector<HTMLDivElement>("#bindings")!;
  bindingsContainer.style.columnFill = `auto`;
  const button = container.querySelector<HTMLButtonElement>("button")!;

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
    const node = (
      <span class="m-1 flex flex-row">
        <button class="m-1 w-8 rounded-md bg-gray-400 p-1 px-2 text-center text-white outline-none hover:bg-gray-500">
          {k}
        </button>
        <div class="m-1 p-1 px-2 text-white">
          {capitalize(v.replaceAll(`-`, ` `))}
        </div>
      </span>
    );
    const text = node.querySelector("div")!;
    const button = node.querySelector("button")!;

    text.addEventListener(`click`, (event) => event.stopPropagation());
    button.addEventListener(`click`, (event) => {
      if (locked) return;
      event.stopPropagation();
      addTailwind(button, `text-black bg-slate-200 hover:bg-slate-200`);
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
