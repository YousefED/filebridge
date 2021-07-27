import * as WebSocket from "ws";
import * as http from "http";
import { resolve } from "path";
import * as chokidar from "chokidar";
import { FileBridgeOptions } from ".";
import * as path from "path";

export function createWatchServer(
  opts: FileBridgeOptions,
  httpServer: http.Server,
  ignoreSaveStats: Map<string, number>
) {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on("connection", function connection(ws, request) {
    let data = {
      watcher: undefined as chokidar.FSWatcher | undefined,
    };
    ws.on("message", function message(msg) {
      console.log(`Received message ${msg}`);
      msg = JSON.parse(msg);

      if (msg.event === "watch") {
        const file = msg.path ? path.join(opts.dir, msg.path) : this.opts.dir;
        console.log(file);
        if (!path.isAbsolute(file)) {
          throw new Error("invalid path " + file);
        }
        if (data.watcher) {
          data.watcher.add(file);
        } else {
          data.watcher = chokidar.watch(file, {
            cwd: opts.dir, // TODO: are we safe from watching parent paths with ..?
            alwaysStat: true,
            ignored: /(^|[\/\\])node_modules./,
          });
          data.watcher.on("all", (eventName, path, stats) => {
            const absPath = resolve(opts.dir, path);
            if (eventName === "change" && ignoreSaveStats.get(absPath) === stats.mtimeMs) {
              // don't send events for files that have been saved via FileTunnelServer
              return;
            }
            ws.send(
              JSON.stringify({
                event: eventName,
                path: path,
              })
            );
          });
        }
      } else if (msg.event === "unwatch") {
        if (!data.watcher) {
          console.error("unwatch but not watching");
        } else {
          data.watcher.unwatch(""); // TODO
        }
      } else {
        throw new Error("invalid message received");
      }
    });

    ws.on("close", () => {
      if (data.watcher) {
        data.watcher.close();
      }
    });
  });

  httpServer.on("upgrade", function upgrade(request, socket, head) {
    // TODO: authenticate

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  });
}
