import { CompositeDisposable, TextEditor } from "atom";
import { selectTarget, clearAllHints, selectMultipleTargets } from "./jump";
import { getClickables } from "./clickables";
import { getRanges, getWords, getLines } from "./ranges";
import { flatMap, focusEditor, isEditorVisible } from "./utils";

const disposables = new CompositeDisposable();

type State = {};

export function activate(state: State) {
  disposables.add(
    atom.commands.add("atom-workspace", {
      "monkey:jump": jumpClickables,
      "monkey:jump-word": jumpWord,
      "monkey:jump-line": jumpLine,
      "monkey:select-multiple-words": selectMultipleWords,
      "monkey:select-multiple-lines": selectMultipleLines,
      "monkey:select-selection": selectSelection,
      "monkey:select-multiple-selections": selectMultipleSelections,
      "monkey:deselect-multiple-selections": deselectMultipleSelections,
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
  const target = await selectTarget(clickables);
  if (target !== undefined) {
    target.handler();
  }
}

async function jumpWord() {
  const editors = atom.workspace.getTextEditors().filter(isEditorVisible);
  const targets = flatMap(getWords, editors);
  const target = await selectTarget(targets);
  if (target !== undefined) {
    focusEditor(target.textEditor);
    target.textEditor.setCursorBufferPosition(target.range.start);
  }
}

async function selectMultipleWords() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getWords(textEditor);
  const selected = await selectMultipleTargets(targets);
  if (selected.length > 0) {
    textEditor.setSelectedScreenRanges(selected.map(x => x.range));
  }
}

async function jumpLine() {
  const editors = atom.workspace.getTextEditors().filter(isEditorVisible);
  const targets = flatMap(getLines, editors);
  const target = await selectTarget(targets);
  if (target !== undefined) {
    focusEditor(target.textEditor);
    target.textEditor.setCursorBufferPosition(target.range.start);
  }
}

async function selectMultipleLines() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getLines(textEditor);
  const selected = await selectMultipleTargets(targets);
  if (selected.length > 0) {
    textEditor.setSelectedScreenRanges(selected.map(x => x.range));
  }
}

async function selectSelection() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getRanges(textEditor);
  const target = await selectTarget(targets);
  if (target !== undefined) {
    textEditor.setSelectedScreenRange(target.range);
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

async function deselectMultipleSelections() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const targets = getRanges(textEditor);
  const selected = await selectMultipleTargets(targets, { selected: true });
  if (selected.length > 0) {
    textEditor.setSelectedScreenRanges(selected.map(x => x.range));
  }
}
