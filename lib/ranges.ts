import { Range, DisplayMarker } from "atom";
import { Target, SelectableTarget } from "./jump";

export function getRanges() {
  const textEditor = atom.workspace.getActiveTextEditor();
  return textEditor !== undefined
    ? textEditor.getSelectedScreenRanges().map(rangeToTarget)
    : [];
}

class RangeTarget implements SelectableTarget {
  constructor(public range: Range) {}
  private hintElm?: HTMLElement;
  private marker: DisplayMarker | undefined;
  showHint(hint: HTMLElement) {
    const textEditor = atom.workspace.getActiveTextEditor()!;
    this.marker = textEditor.markScreenRange(this.range, {
      invalidate: "touch"
    });

    this.hintElm = hint;

    const decoration = textEditor.decorateMarker(this.marker, {
      type: "overlay",
      item: this.hintElm,
      position: "tail"
    });
  }
  clearHint() {
    this.marker!.destroy();
  }
  toggleSelection() {
    if (this.hintElm !== undefined) {
      this.hintElm.classList.toggle("selected");
    }
  }
}

function rangeToTarget(range: Range) {
  return new RangeTarget(range);
}
