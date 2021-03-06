import type fetchType from "cross-fetch";
import { event } from "vscode-lib";
import { lifecycle } from "vscode-lib";

const SERVER = "http://localhost:3001";
const WS_SERVER = "ws://localhost:3001";

export async function readFile(fetch: typeof fetchType, path: string, server = SERVER) {
  const file = await fetch(server + "/file/" + path, {});

  if (file.status === 203) {
    return { type: "directory" as "directory" };
  } else if (file.status === 200) {
    return {
      type: "file" as "file",
      contents: await file.text(),
    };
  } else {
    throw new Error("readFile response: " + file.status);
  }
}

export async function saveFile(fetch: typeof fetchType, path: string, contents: string, server = SERVER) {
  const file = await fetch(server + "/file/" + path, {
    method: "POST",
    body: contents,
  });
  if (file.status !== 200) {
    throw new Error("readFile response: " + file.status);
  }
  return file;
}

type WatchEvent = {
  event: "add" | "unlink" | "change" | "addDir" | "unlinkDir";
  path: string;
};

export class Watcher extends lifecycle.Disposable {
  private connected = false;
  private readonly socket: WebSocket;

  private watching = new Set<string>();

  private readonly _onWatchEvent: event.Emitter<WatchEvent> = this._register(new event.Emitter<WatchEvent>());
  public readonly onWatchEvent: event.Event<WatchEvent> = this._onWatchEvent.event;

  private readonly _onError: event.Emitter<void> = this._register(new event.Emitter<void>());
  public readonly onError: event.Event<void> = this._onError.event;

  constructor(path: string, server = WS_SERVER) {
    super();
    this.watching.add(path);
    this.socket = new WebSocket(server);

    // Connection opened
    this.socket.addEventListener("open", (event) => {
      this.connected = true;
      this.watching.forEach((path) => {
        this.socket.send(JSON.stringify({ event: "watch", path }));
      });
    });

    // Listen for messages
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      console.log("Message from server ", event.data);
      if (["add", "unlink", "change", "addDir", "unlinkDir"].includes(message.event)) {
        this._onWatchEvent.fire({
          event: message.event,
          path: message.path,
        });
      }
    });

    this.socket.addEventListener("error", (event) => {
      this._onError.fire();
    });
    this.socket.addEventListener("close", (event) => {
      //   debugger;
    });
  }

  public addWatch(path: string) {
    this.watching.add(path);
    if (this.connected) {
      this.socket.send(JSON.stringify({ event: "watch", path }));
    }
  }

  public unwatch(path: string) {
    this.watching.delete(path);
    if (this.connected) {
      this.socket.send(JSON.stringify({ event: "unwatch", path }));
    }
  }

  public dispose() {
    super.dispose();
    this.socket.close();
  }
}
