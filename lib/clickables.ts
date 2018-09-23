import * as L from "list";
import { Target } from "./jump";

export function getClickables() {
  const view = atom.views.getView(atom.workspace);

  const clickables = searchClickables(view);

  const tooltip = L.list(
    ...(<HTMLElement>view.parentNode).querySelectorAll<HTMLElement>(".tooltip")
  );
  const tooltipClickables = L.chain(searchClickables, tooltip);

  return L.toArray(L.concat(clickables, tooltipClickables));
}

const clickableTags = ["A", "TEXTAREA", "BUTTON"];

function isClosedDock(view: HTMLElement) {
  if (view.tagName !== "ATOM-DOCK") {
    return false;
  }
  const inner = view.querySelector(".atom-dock-inner");
  return inner !== null && !inner.classList.contains("atom-dock-open");
}

function isTreeView(node: HTMLElement) {
  return node.classList.contains("tree-view");
}

function isTabs(node: HTMLElement) {
  return node.classList.contains("tab-bar");
}

function isEditor(node: HTMLElement) {
  return (
    node.classList.contains("editor") && !node.classList.contains("is-focused")
  );
}

function isInvisible(node: HTMLElement) {
  return (
    !node.offsetParent ||
    node.getAttribute("type") === "hidden" ||
    getComputedStyle(node).visibility === "hidden" ||
    node.getAttribute("display") === "none"
  );
}

function isGithubStatusBarTileController(node: HTMLElement) {
  return node.classList.contains("github-StatusBarTileController");
}

function showHint(elm: HTMLElement, hint: string): () => void {
  const hintElm = document.createElement("code");
  hintElm.classList.add("monkey-jump-hint");
  hintElm.innerText = hint;
  elm.appendChild(hintElm);
  if (getComputedStyle(elm).position === "static") {
    let old = elm.style.position;
    elm.style.position = "relative";
    return () => {
      hintElm.remove();
      elm.style.position = old;
    };
  }
  return hintElm.remove.bind(hintElm);
}

class SimpleClickable implements Target {
  constructor(protected elm: HTMLElement) {}
  showHint(hint: string) {
    this.clearHint = showHint(this.elm, hint);
  }
  handler() {
    this.elm.click();
  }
  clearHint() {}
}

function makeSimpleClickable(elm: HTMLElement) {
  return new SimpleClickable(elm);
}

class FileClickable extends SimpleClickable {
  handler() {
    const path = this.elm
      .querySelector("[data-path]")!
      .getAttribute("data-path")!;
    atom.workspace.open(path);
  }
}

function makeTreeViewClickable(elm: HTMLElement): Target {
  if (elm.classList.contains("file")) {
    return new FileClickable(elm);
  } else {
    return new SimpleClickable(elm);
  }
}

class EditorClickable extends SimpleClickable {
  handler() {
    this.elm.focus();
  }
}

class InputClickable extends SimpleClickable {
  showHint(hint: string) {
    const elm = <HTMLElement>this.elm.parentNode;
    this.clearHint = showHint(elm, hint);
  }
}

export function searchClickables(view: Node): L.List<Target> {
  if (!(view instanceof HTMLElement) || isInvisible(view)) {
    return L.empty();
  }

  if (isClosedDock(view)) {
    return L.empty();
  }

  if (isTreeView(view)) {
    const links = view.querySelectorAll<HTMLElement>(
      ".tree-view .list-item:not(.selected)"
    );
    return L.map(makeTreeViewClickable, L.list(...links));
  }

  if (isTabs(view)) {
    const tabs = view.querySelectorAll<HTMLElement>(
      ".tab-bar li.tab:not(.active)"
    );
    return L.map(makeSimpleClickable, L.list(...tabs));
  }
  if (isEditor(view)) {
    return L.list(new EditorClickable(view));
  }

  if (view.tagName === "INPUT") {
    return L.list(new InputClickable(view));
  }

  if (isGithubStatusBarTileController(view)) {
    const githubBtns = view.querySelectorAll<HTMLElement>(
      ".github-branch, .github-PushPull, .github-ChangedFilesCount"
    );
    return L.map(makeSimpleClickable, L.list(...githubBtns));
  }

  if (clickableTags.includes(view.tagName)) {
    return L.list(new SimpleClickable(view));
  }
  const { childNodes } = view;
  return L.chain(searchClickables, L.list(...childNodes));
}
