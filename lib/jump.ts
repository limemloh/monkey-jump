export interface Target {
  showHint: (hint: HTMLElement) => void;
  clearHint: () => void;
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
  const seqs = [];
  while (seqs.length < nodesLength) {
    seqs.push(iter.next().value);
  }
  return seqs;
}

type KeySeqElm<A> = { value: A; hintElm: HTMLElement };
type KeySeqMap<A extends Target> = Map<
  string,
  KeySeqMapRec<KeySeqElm<A>> | KeySeqElm<A>
>;
interface KeySeqMapRec<A> extends Map<string, KeySeqMapRec<A> | A> {}

function* forEach<A extends Target>(
  keymap: KeySeqMap<A>
): IterableIterator<KeySeqElm<A>> {
  for (const elm of keymap.values()) {
    if (elm instanceof Map) {
      for (const e of forEach(elm)) {
        yield e;
      }
    } else {
      yield elm;
    }
  }
}

function setKeySeq<A extends Target>(
  keymap: KeySeqMap<A>,
  keySeq: string[],
  value: A
) {
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
  const text = keySeq.join("");
  const hintElm = createHintElm(
    atom.config.get("monkey-jump.capitalizeHint") ? text.toUpperCase() : text
  );
  modKeymap.set(keySeq[j], { value, hintElm });
}

function createHintElm(hintText: string) {
  const hintElm = document.createElement("code");
  hintElm.classList.add("monkey-jump-hint");

  const hintPressed = document.createElement("span");
  hintPressed.classList.add("pressed");
  hintElm.appendChild(hintPressed);

  const hintUnpressed = document.createElement("span");
  hintUnpressed.classList.add("unpressed");
  hintElm.appendChild(hintUnpressed);

  hintUnpressed.innerHTML = hintText;
  return hintElm;
}

function updateHint(hintElm: HTMLElement) {
  const [pressed, unpressed] = hintElm.children;
  if (unpressed.innerHTML.length > 0) {
    pressed.innerHTML = pressed.innerHTML + unpressed.innerHTML[0];
    unpressed.innerHTML = unpressed.innerHTML.substring(1);
  }
}

function resetHint(hintElm: HTMLElement) {
  const [pressed, unpressed] = hintElm.children;
  unpressed.innerHTML = pressed.innerHTML + unpressed.innerHTML;
  pressed.innerHTML = "";
}

function nextKeydown(): Promise<string | undefined> {
  const view = atom.views.getView(atom.workspace);
  return new Promise((resolve, reject) => {
    function keyListener(keyEvent: KeyboardEvent) {
      const { key, ctrlKey, shiftKey, altKey, metaKey } = keyEvent;
      view.removeEventListener("mousedown", mouseListener);
      view.removeEventListener("scroll", scrollListener);
      if (ctrlKey || shiftKey || altKey || metaKey) {
        resolve(undefined);
      }
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      resolve(key);
    }
    function mouseListener(mouseEvent: MouseEvent) {
      view.removeEventListener("keydown", keyListener);
      view.removeEventListener("scroll", scrollListener);
      resolve(undefined);
    }
    function scrollListener() {
      view.removeEventListener("keydown", keyListener);
      view.removeEventListener("mousedown", mouseListener);
      resolve(undefined);
    }

    view.addEventListener("keydown", keyListener, {
      once: true,
      capture: true
    });
    view.addEventListener("mousedown", mouseListener, {
      once: true,
      capture: true
    });
    view.addEventListener("scroll", scrollListener, {
      once: true,
      capture: true
    });
  });
}

function clearHints<A extends Target>(keymap: KeySeqMap<A>) {
  for (const { value } of forEach(keymap)) {
    value.clearHint();
  }
}

function clearUnrelatedHints<A extends Target>(
  keymap: KeySeqMap<A>,
  hintKey: string
) {
  for (const [key, elm] of keymap.entries()) {
    if (key !== hintKey) {
      if (elm instanceof Map) {
        clearHints(elm);
      } else {
        elm.value.clearHint();
      }
    }
  }
}

function showHintsInMap<A extends Target>(keymap: KeySeqMap<A>) {
  for (const { value, hintElm } of forEach(keymap)) {
    value.showHint(hintElm);
    resetHint(hintElm);
  }
}

function updateHints<A extends Target>(keymap: KeySeqMap<A>, key: string) {
  for (const { hintElm } of forEach(keymap)) {
    updateHint(hintElm);
  }
}

async function handleKeys<A extends Target>(
  keymap: KeySeqMap<A>
): Promise<A | void> {
  showHintsInMap(keymap);
  let pressed = "";
  const fstKey = await nextKeydown();
  if (fstKey === undefined) {
    return undefined;
  }
  clearUnrelatedHints(keymap, fstKey);
  updateHints(keymap, fstKey);
  let elm = keymap.get(fstKey);
  pressed += fstKey;
  while (elm instanceof Map) {
    const key = await nextKeydown();
    if (key === undefined) {
      return undefined;
    }
    clearUnrelatedHints(elm, key);
    updateHints(elm, key);
    elm = elm.get(key);
    pressed += key;
  }
  if (elm === undefined) {
    return undefined;
  }
  elm.value.clearHint();
  return elm.value;
}

export async function selectTarget<A extends Target>(
  targets: A[]
): Promise<A | void> {
  if (targets.length < 1) {
    throw new Error("Missing targets to jump");
  }
  const hintKeys: string[] = atom.config.get("monkey-jump.hintKeys").split("");
  const keySeqs = generateKeySequences(targets.length, hintKeys);

  let keymap: KeySeqMap<A> = new Map();
  for (let i = 0; i < targets.length; i++) {
    const seq = keySeqs[i];
    const target = targets[i];
    setKeySeq(keymap, seq, target);
  }

  const t = await handleKeys(keymap);
  if (t === undefined) {
    clearHints(keymap);
  }
  return t;
}

export interface SelectableTarget extends Target {
  toggleSelection: () => void;
}

type SelectMultipleTargetsOptions<A> = {
  selected?: boolean | A[];
};

export async function selectMultipleTargets<A extends SelectableTarget>(
  targets: A[],
  options: SelectMultipleTargetsOptions<A> = {}
): Promise<A[]> {
  if (targets.length < 1) {
    throw new Error("Missing targets to jump");
  }
  const hintKeys: string[] = atom.config.get("monkey-jump.hintKeys").split("");
  const keySeqs = generateKeySequences(targets.length, hintKeys);

  let keymap: KeySeqMap<A> = new Map();
  for (let i = 0; i < targets.length; i++) {
    const seq = keySeqs[i];
    const target = targets[i];
    setKeySeq(keymap, seq, target);
  }

  let selected: A[] = Array.isArray(options.selected)
    ? options.selected
    : options.selected === true
      ? targets
      : [];
  if (selected.length > 0) {
    for (const { value, hintElm } of forEach(keymap)) {
      if (selected.includes(value)) {
        hintElm.classList.add("selected");
      }
    }
  }

  while (true) {
    const t = await handleKeys(keymap);
    if (t === undefined) {
      break;
    }
    t.toggleSelection();
    if (selected.includes(t)) {
      selected.splice(selected.indexOf(t), 1);
    } else {
      selected.push(t);
    }
  }
  return selected;
}
