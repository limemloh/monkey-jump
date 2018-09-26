import { TextEditor } from "atom";

export function isEditorVisible(editor: TextEditor) {
  return !getVisibleRowRange(editor).includes(NaN);
}

export function flatMap<A, B>(fn: (a: A) => B[], arr: A[]) {
  return arr.reduce<B[]>((acc, x) => acc.concat(fn(x)), []);
}

export function getVisibleRowRange(editor: TextEditor): [number, number] {
  // @ts-ignore
  return editor.element.getVisibleRowRange();
}

export function focusEditor(editor: TextEditor) {
  // @ts-ignore
  editor.element.focus();
}
