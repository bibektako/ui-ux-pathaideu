const path = require("path");

describe("utils/storage", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("getUploadPath returns a path and ensures directory exists", () => {
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      unlinkSync: jest.fn(),
    }));

    const fs = require("fs");
    const storage = require("../utils/storage");

    const p = storage.getUploadPath("package");
    expect(typeof p).toBe("string");
    expect(p.includes(path.join("uploads", "package_photos"))).toBe(true);
    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  test("getUploadPath falls back to package photos for unknown type", () => {
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      unlinkSync: jest.fn(),
    }));
    const storage = require("../utils/storage");
    const p = storage.getUploadPath("unknown-type");
    expect(p.includes(path.join("uploads", "package_photos"))).toBe(true);
  });

  test("generateFileName preserves extension and includes prefix", () => {
    const storage = require("../utils/storage");
    const name = storage.generateFileName("photo.jpg", "id_");
    expect(name.startsWith("id_")).toBe(true);
    expect(name.endsWith(".jpg")).toBe(true);
  });

  test("generateFileName includes original basename", () => {
    const storage = require("../utils/storage");
    const name = storage.generateFileName("my-file.png");
    expect(name).toContain("my-file_");
    expect(name.endsWith(".png")).toBe(true);
  });

  test("deleteFile returns false when file does not exist", () => {
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      unlinkSync: jest.fn(),
    }));
    const storage = require("../utils/storage");
    expect(storage.deleteFile("/tmp/nope.txt")).toBe(false);
  });

  test("deleteFile returns true when delete succeeds", () => {
    jest.doMock("fs", () => ({
      existsSync: jest.fn(() => true),
      mkdirSync: jest.fn(),
      unlinkSync: jest.fn(),
    }));
    const fs = require("fs");
    const storage = require("../utils/storage");
    expect(storage.deleteFile("/tmp/ok.txt")).toBe(true);
    expect(fs.unlinkSync).toHaveBeenCalledWith("/tmp/ok.txt");
  });
});

