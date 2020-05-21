import { Color } from "./Color";

test(`from hex`, () => {
  describe(`0xffffff`, () => {
    expect(Color.fromHex(0xffffff).toHexString()).toEqual(
      Color.fromHex(0xffffff).toHexString()
    );
  });

  describe(`0x99aabb`, () => {
    expect(Color.fromHex(0x99aabb).toHexString()).toEqual(
      Color.fromHex(0x99aabb).toHexString()
    );
  });

  describe(`0x000000`, () => {
    expect(Color.fromHex(0x000000).toHexString()).toEqual(
      Color.fromHex(0x000000).toHexString()
    );
  });
});

test(`mix`, () => {
  describe(`dark`, () => {
    expect(
      Color.fromHex(0xffffff)
        .mix(Color.fromHex(0x000000))
        .toHexString()
    ).toEqual(Color.fromHex(0x000000).toHexString());
  });

  describe(`dim`, () => {
    expect(
      Color.fromHex(0xffffff)
        .mix(Color.fromHex(0x010101))
        .toHexString()
    ).toEqual(Color.fromHex(0x010101).toHexString());
  });

  describe(`colored dim`, () => {
    expect(
      Color.fromHex(0xffaa00)
        .mix(Color.fromHex(0x101010))
        .toHexString()
    ).toEqual(Color.fromHex(0x100a00).toHexString());
  });

  describe(`light`, () => {
    expect(
      Color.fromHex(0xffffff)
        .mix(Color.fromHex(0xffffff))
        .toHexString()
    ).toEqual(Color.fromHex(0xffffff).toHexString());
  });
});
