export function includes<A>(searchElement: A, array: A[]): boolean {
  const len = array.length;
  if (len === 0) {
    return false;
  }
  for (const item of array) {
    if (sameValueZero(item, searchElement)) {
      return true;
    }
  }
  return false;
}

function sameValueZero(x: any, y: any) {
  return (
    x === y ||
    (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y))
  );
}

export function map<A, B>(fn: (a: A) => B, collection: Iterable<A>): B[] {
  let a = [];
  for (const i of collection) {
    a.push(fn(i));
  }
  return a;
}

export function flatten<A>(collection: Iterable<Iterable<A>>): A[] {
  let a = [];
  for (const c of collection) {
    for (const d of c) {
      a.push(d);
    }
  }
  return a;
}

export function flatMap<A, B>(
  fn: (a: A) => Iterable<B>,
  collection: Iterable<A>
): B[] {
  return flatten(map(fn, collection));
}
