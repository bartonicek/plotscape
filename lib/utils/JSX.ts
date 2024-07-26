export const React = {
  createElement(
    tag: string,
    props: { [id: string]: any },
    ...children: string[] | Node[]
  ) {
    const element = document.createElement(tag);

    for (const [k, v] of Object.entries(props || {})) {
      if (k.startsWith(`on`) && k.toLowerCase() in window) {
        element.addEventListener(k.toLowerCase().slice(2), v);
      } else element.setAttribute(k, v);
    }

    appendChildren(element, ...children);
    return element;
  },
};

export function appendChildren(parent: Node, ...children: (string | Node)[]) {
  if (children.length === 0) return;
  if (children.length > 1) {
    for (const child of children) appendChildren(parent, child);
    return;
  }
  const child = children[0];
  const childNode = isNode(child) ? child : document.createTextNode(child);
  parent.appendChild(childNode);
}

function isNode(x: any): x is Node {
  return x.nodeType != undefined;
}

export default React;
