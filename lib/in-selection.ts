import { Range, TextEditor } from "atom";

function flatMap<A>(fn: (a: A) => A[], arr: A[]) {
  return arr.reduce<A[]>((acc, x) => acc.concat(fn(x)), []);
}

const wordRegExp = /\w+/g;

export function wordsInSelection() {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const ranges = textEditor.getSelectedScreenRanges();
  const newRanges =
    ranges.length === 1 && ranges[0].isEmpty()
      ? [getRangeOfTheBuffer(textEditor)]
      : ranges;
  const wordRanges = flatMap(
    regExpInRange.bind(undefined, wordRegExp),
    newRanges
  );
  if (newRanges.length > 0) {
    textEditor.setSelectedScreenRanges(wordRanges);
  }
}

function getRangeOfTheBuffer(textEditor: TextEditor) {
  const lastLine = textEditor.getLineCount();
  return new Range([0, 0], [lastLine, 0]);
}

function regExpInRange(regExp: RegExp, range: Range): Range[] {
  const textEditor = atom.workspace.getActiveTextEditor()!;
  const lines = textEditor.getTextInBufferRange(range).split("\n");

  let res: Range[] = [];
  let match;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    const firstRow = i === 0;
    while ((match = wordRegExp.exec(text)) !== null) {
      res.push(
        new Range(
          [range.start.row + i, match.index],
          [range.start.row + i, wordRegExp.lastIndex]
        ).translate([0, firstRow ? range.start.column : 0])
      );
    }
  }
  return res;
}
