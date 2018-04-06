import * as L from "list";
import { searchClickables, Clickable } from "./clickables";

class MonkeyError extends Error {}

function getClickables() {
  const view = atom.views.getView(atom.workspace);

  const clickables = searchClickables(view);

  const tooltip = L.list(
    ...(<HTMLElement>view.parentNode).querySelectorAll<HTMLElement>(".tooltip")
  );
  const tooltipClickables = L.chain(searchClickables, tooltip);

  return L.concat(clickables, tooltipClickables);
}

export function clearAllHints() {
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

export function jump() {
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
