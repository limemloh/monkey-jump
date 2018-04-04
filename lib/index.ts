import { CompositeDisposable } from "atom";
import * as L from "list";

const disposables = new CompositeDisposable();

const clickableTags = ["A", "TEXTAREA", "BUTTON"];

class MonkeyError extends Error {}

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

interface Clickable {
  showHint: (hint: string) => () => void;
  handler: () => void;
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

class SimpleClickable implements Clickable {
  constructor(protected elm: HTMLElement) {}
  showHint(hint: string): () => void {
    return showHint(this.elm, hint);
  }
  handler() {
    this.elm.click();
  }
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

function makeTreeViewClickable(elm: HTMLElement): Clickable {
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
    return showHint(elm, hint);
  }
}

function searchClickables(view: Node): L.List<Clickable> {
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
      ".github-branch, .github-PushPull"
    );
    return L.map(makeTreeViewClickable, L.list(...githubBtns));
  }

  if (clickableTags.includes(view.tagName)) {
    return L.list(new SimpleClickable(view));
  }
  const { childNodes } = view;
  return L.chain(searchClickables, L.list(...childNodes));
}

function getClickables() {
  const view = atom.views.getView(atom.workspace);

  const clickables = searchClickables(view);

  const tooltip = L.list(
    ...(<HTMLElement>view.parentNode).querySelectorAll<HTMLElement>(".tooltip")
  );
  const tooltipClickables = L.chain(searchClickables, tooltip);

  // const dockToggles = view.querySelectorAll(".atom-dock-toggle-button");
  // for (const btn of dockToggles) {
  //   btn.classList.add("atom-dock-toggle-button-visible");
  //   clickables.push({
  //     showHint: showHint.bind(undefined, btn),
  //     handler: () => {}
  //   });
  // }
  return L.concat(clickables, tooltipClickables);
}

function clearAllHints() {
  const view = atom.views.getView(atom.workspace);
  const hints = view.querySelectorAll(".monkey-jump-hint");
  for (const hint of hints) {
    const parent = hint.parentNode;
    if (parent !== null) {
      parent.removeChild(hint);
    }
  }
}

function calcSeqLength(nodesLength: number, keysLength: number): number {
  let i = 1;
  while (keysLength ** i < nodesLength) {
    i++;
  }
  return i;
}

function* keySequencer(length: number, keys: string[]) {
  const keyindex = Array(length).fill(0);
  while (true) {
    yield keyindex.map(i => keys[i]);
    let carry = true;
    for (let i = 0; i < length; i++) {
      if (carry) {
        const index = length - (i + 1);
        const n = keyindex[index];
        carry = n === keys.length - 1;
        keyindex[index] = carry ? 0 : n + 1;
      } else {
        break;
      }
    }
  }
}

function generateKeySequences(nodesLength: number, keys: string[]) {
  const keysLength = keys.length;
  const seqLength = calcSeqLength(nodesLength, keysLength);
  const iter = keySequencer(seqLength, keys);
  const keyindex = Array(seqLength).fill(0);
  const seqs = [];
  while (seqs.length < nodesLength) {
    seqs.push(iter.next().value);
  }
  return seqs;
}

type KeySeqMap<A> = Map<string, KeySeqMapRec<A> | A>;
interface KeySeqMapRec<A> extends Map<string, KeySeqMapRec<A> | A> {}

function setKeySeq<A>(keymap: KeySeqMap<A>, keySeq: string[], value: A) {
  let modKeymap: any = keymap;
  let j = 0;
  for (; j < keySeq.length - 1; j++) {
    const key = keySeq[j];
    if (modKeymap.has(key)) {
      modKeymap = modKeymap.get(key);
    } else {
      const m = new Map();
      modKeymap.set(key, m);
      modKeymap = m;
    }
  }
  modKeymap.set(keySeq[j], value);
}

function nextKeydown(): Promise<string> {
  const view = atom.views.getView(atom.workspace);
  return new Promise((resolve, reject) => {
    function keyListener(keyEvent: KeyboardEvent) {
      const { key, ctrlKey, shiftKey, altKey, metaKey } = keyEvent;
      if (ctrlKey || shiftKey || altKey || metaKey) {
        reject(new MonkeyError("Modifier pressed"));
      }
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      view.removeEventListener("mousedown", mouseListener);
      resolve(key);
    }
    function mouseListener(mouseEvent: MouseEvent) {
      view.removeEventListener("keydown", keyListener);
      reject(new MonkeyError("Mouse clicked"));
    }

    view.addEventListener("keydown", keyListener, {
      once: true,
      capture: true
    });
    view.addEventListener("mousedown", mouseListener, {
      once: true,
      capture: true
    });
  });
}

async function handleKeys(keymap: KeySeqMap<Clickable>) {
  let pressed = "";
  const fstKey = await nextKeydown();
  pressed += fstKey;
  let value = keymap.get(fstKey);
  while (value instanceof Map) {
    const key = await nextKeydown();
    value = value.get(key);
    pressed += key;
  }
  if (value === undefined) {
    const k = atom.config.get("monkey-jump.capitalizeHint")
      ? pressed.toUpperCase()
      : pressed;
    throw new MonkeyError(`No target for given key '${k}'`);
  }
  await value.handler();
}

function jump() {
  const hintKeys: string[] = atom.config.get("monkey-jump.hintKeys").split("");
  const clickables = getClickables();
  if (clickables.length < 1) {
    return;
  }
  const keySeqs = generateKeySequences(clickables.length, hintKeys);

  let keymap = new Map();
  let removeHints: Array<() => void> = [];
  for (let i = 0; i < clickables.length; i++) {
    const seq = keySeqs[i];
    const clickable = L.nth(i, clickables)!;
    const capitalize: boolean = atom.config.get("monkey-jump.capitalizeHint");
    const text = seq.join("");
    removeHints.push(
      clickable.showHint(capitalize ? text.toUpperCase() : text)
    );
    setKeySeq(keymap, seq, clickable);
  }

  function cleanup() {
    for (const removeHint of removeHints) {
      removeHint();
    }
  }

  handleKeys(keymap).then(cleanup, (e: Error) => {
    cleanup();
    const shouldMute: boolean = atom.config.get(
      "monkey-jump.muteNotifications"
    );
    if (!shouldMute && e instanceof MonkeyError) {
      atom.notifications.addInfo(e.message);
    } else {
      throw e;
    }
  });
}

type State = {};

function activate(state: State) {
  disposables.add(
    atom.commands.add("atom-workspace", {
      "monkey:jump": jump,
      "monkey:Clear hints": clearAllHints
    })
  );
}

function deactivate() {
  disposables.dispose();
}

function serialize(): State {
  return {};
}

const config = {
  capitalizeHint: {
    title: "Capitalize hints",
    description: "Capitalize the jump targets",
    type: "boolean",
    default: false
  },
  muteNotifications: {
    title: "Mute notifications",
    description:
      "Mute the notifications appearing when a monkey jump is aborted",
    type: "boolean",
    default: false
  },
  hintKeys: {
    title: "Hint keys",
    description:
      "A string of characters, which will be used to generate key sequences for the jump targets",
    type: "string",
    default: "fjdksla;"
  }
};

export { activate, deactivate, serialize, config };
