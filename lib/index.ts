import { CompositeDisposable } from "atom";
import { jump, clearAllHints } from "./jump";

const disposables = new CompositeDisposable();

type State = {};

export function activate(state: State) {
  disposables.add(
    atom.commands.add("atom-workspace", {
      "monkey:jump": jump,
      "monkey:Clear hints": clearAllHints
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
