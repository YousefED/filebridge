import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FileBridgeServer } from "../src/server";
// https://github.com/developit/microbundle/issues/708
import "regenerator-runtime/runtime.js";
import { event } from "vscode-lib";
import { readFile, saveFile, Watcher } from "filebridge-client";

let server: any;
let dir = fs.mkdtempSync(path.join(os.tmpdir(), "filebridge-test-"));

beforeAll(() => {
  server = new FileBridgeServer({
    dir,
    port: 3001,
  });
});

afterAll(() => {
  server?.close();
});

it("reads a file", async () => {
  fs.writeFileSync(path.join(dir, "testfile"), "contents");
  const file = await readFile("testfile");
  expect(file.contents).toBe("contents");
});

it("writes a file", async () => {
  fs.writeFileSync(path.join(dir, "testfile2"), "contents");
  await saveFile("testfile2", "contents2");
  expect(fs.readFileSync(path.join(dir, "testfile2"), { encoding: "utf-8" })).toBe("contents2");
});

it("write a file not found", async () => {
  expect(async () => {
    await saveFile("notfound", "contents");
  }).rejects.toThrow(Error);
});

it("read a file not found", async () => {
  expect(async () => {
    await readFile("notfound");
  }).rejects.toThrow(Error);
});

it("lists files", async () => {
  fs.writeFileSync(path.join(dir, "testfilewatch.md"), "contents");
  const watcher = new Watcher("*.md");
  try {
    const e = await event.Event.toPromise(watcher.onWatchEvent);
    expect(e.event).toEqual("add");
    expect(e.path).toEqual("testfilewatch.md");
  } finally {
    watcher.dispose();
  }
});

it("lists new files", async () => {
  const watcher = new Watcher("*.md");
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    fs.writeFileSync(path.join(dir, "testfilewatch2.md"), "contents");
    const e = await event.Event.toPromise(watcher.onWatchEvent);
    expect(e.event).toEqual("add");
    expect(e.path).toEqual("testfilewatch2.md");
  } finally {
    watcher.dispose();
  }
});

// TODO: validate absolute paths (/..) and parent paths (../) are blocked in both watcher and read/write
