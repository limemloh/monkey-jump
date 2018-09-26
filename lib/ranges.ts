import { Range, DisplayMarker, TextEditor } from "atom";
import { Target, SelectableTarget } from "./jump";

export class RangeTarget implements SelectableTarget {
  constructor(public textEditor: TextEditor, public range: Range) {}
  private hintElm?: HTMLElement;
  private marker: DisplayMarker | undefined;
  showHint(hint: HTMLElement) {
    this.marker = this.textEditor.markScreenRange(this.range, {
      invalidate: "touch"
    });

    hint.classList.add("range");
    this.hintElm = hint;

    const decoration = this.textEditor.decorateMarker(this.marker, {
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

export function getRanges(textEditor: TextEditor) {
  return textEditor
    .getSelectedScreenRanges()
    .map(range => new RangeTarget(textEditor, range));
}

function getVisibleRowRange(editor: TextEditor): [number, number] {
  // @ts-ignore
  return editor.element.getVisibleRowRange();
}

const wordRegExp = /\w+/g;

export function getWords(editor: TextEditor) {
  const [first, last] = getVisibleRowRange(editor);
  let wordTargets: RangeTarget[] = [];
  editor.scanInBufferRange(
    wordRegExp,
    new Range([first, 0], [last, 0]),
    ({ range }) => {
      wordTargets.push(new RangeTarget(editor, range));
    }
  );
  return wordTargets;
}

export function getLines(editor: TextEditor) {
  const [first, last] = getVisibleRowRange(editor);
  let lines = [];
  for (let i = first; i < last; i++) {
    lines.push(rangeToTarget(new Range([i, 0], [i, 0])));
  }
  return lines;
}
