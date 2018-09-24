import { CompositeDisposable, Range } from "atom";
import { jumpTargets, clearAllHints, jumpSelectTargets } from "./jump";
import { getClickables } from "./clickables";
import { getRanges } from "./ranges";
import { wordsInSelection } from "./in-selection";

const disposables = new CompositeDisposable();

type State = {};

export function activate(state: State) {
  disposables.add(
    atom.commands.add("atom-workspace", {
      "monkey:jump": jumpClickables,
      "monkey:Jump Selections": jumpSelections,
      "monkey:Clear hints": clearAllHints,
      "monkey:Words In Selection": wordsInSelection,
      "monkey:Multi jump selection": selectTargets
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

async function jumpClickables() {
  const e = atom.workspace.getActiveTextEditor()!;
  const clickables = getClickables();
  const target = await jumpTargets(clickables);
  if (target !== undefined) {
    target.handler();
  }
}

async function jumpSelections() {
  const targets = getRanges();
  const target = await jumpTargets(targets);
  if (target !== undefined) {
    const textEditor = atom.workspace.getActiveTextEditor()!;
    textEditor.setSelectedScreenRange(target.range);
  }
}

async function selectTargets() {
  const targets = getRanges();
  const selected = await jumpSelectTargets(targets);
  if (selected.length > 0) {
    const textEditor = atom.workspace.getActiveTextEditor()!;
    textEditor.setSelectedScreenRanges(selected.map(x => x.range));
  }
}
