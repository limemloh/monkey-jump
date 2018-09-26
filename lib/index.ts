import { CompositeDisposable } from "atom";
import { selectTargets, clearAllHints, selectMultipleTargets } from "./jump";
import { getClickables } from "./clickables";
import { getRanges, getWords, getLines } from "./ranges";

const disposables = new CompositeDisposable();

type State = {};

export function activate(state: State) {
  disposables.add(
    atom.commands.add("atom-workspace", {
      "monkey:jump": jumpClickables,
      "monkey:jump-word": jumpWord,
      "monkey:jump-line": jumpLine,
      "monkey:select-selection": selectSelection,
      "monkey:select-multiple-selections": selectMultipleSelections,
      "monkey:clear-hints": clearAllHints
    })
  );
}

export function deactivate() {
  disposables.dispose();
}

export function serialize(): State {
  return {};
}

export const config = {
  capitalizeHint: {
    title: "Capitalize hints",
    description: "Capitalize the jump targets",
    type: "boolean",
    default: true
  },
  hintKeys: {
    title: "Hint keys",
    description:
      "A string of characters, which will be used to generate key sequences for the jump targets",
    type: "string",
    default: "fjdksla;"
  }
};

async function jumpClickables() {
  const clickables = getClickables();
  const target = await selectTargets(clickables);
  if (target !== undefined) {
    target.handler();
  }
}

async function selectSelection() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getRanges(textEditor);
  const target = await selectTargets(targets);
  if (target !== undefined) {
    textEditor.setSelectedScreenRange(target.range);
  }
}

async function jumpWord() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getWords(textEditor);
  const target = await selectTargets(targets);
  if (target !== undefined) {
    textEditor.setCursorBufferPosition(target.range.start);
  }
}

async function jumpLine() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getLines(textEditor);
  const target = await selectTargets(targets);
  if (target !== undefined) {
    textEditor.setCursorBufferPosition(target.range.start);
  }
}

async function selectMultipleSelections() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getRanges(textEditor);
  const selected = await selectMultipleTargets(targets);
  if (selected.length > 0) {
    textEditor.setSelectedScreenRanges(selected.map(x => x.range));
  }
}
