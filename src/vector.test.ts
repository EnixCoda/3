import { Vector } from "./Vector";

const init = [2, 2, 2];
test(`add`, () => {
  const v = new Vector(init);
  expect(v.add(v).values).toEqual([4, 4, 4]);
});

test(`sub`, () => {
  const v = new Vector(init);
  expect(v.sub(v).values).toEqual([0, 0, 0]);
});

test(`scale`, () => {
  const v = new Vector(init);
  expect(v.scale(2).values).toEqual([4, 4, 4]);
});

test(`dot product`, () => {
  const v = new Vector(init);
  expect(v.dotProduct(v)).toEqual(12);
});
