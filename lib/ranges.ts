import { Range, DisplayMarker, TextEditor } from "atom";
import { Target, SelectableTarget } from "./jump";
import { getVisibleRowRange } from "./utils";

export class RangeTarget implements SelectableTarget {
  constructor(public textEditor: TextEditor, public range: Range) {}
  private hintElm?: HTMLElement;
  private marker: DisplayMarker | undefined;
  showHint(hint: HTMLElement) {
    this.marker = this.textEditor.markBufferPosition(this.range.start, {
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
    const c = editor.lineTextForScreenRow(i).length;
    lines.push(new RangeTarget(editor, new Range([i, 0], [i, c])));
  }
  return lines;
}
