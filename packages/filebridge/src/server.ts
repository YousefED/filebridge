import express from "express";
import { FileBridgeOptions } from ".";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import { createWatchServer } from "./watcher";
import * as bodyParser from "body-parser";
const cors = require("cors");

export class FileBridgeServer {
  private readonly server: http.Server;
  private lastSaveStats = new Map<string, number>();
  private setFilePath = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // see comments @ https://stackoverflow.com/a/29549148
    const file = req.params[0] ? path.join(this.opts.dir, req.params[0]) : this.opts.dir;
    // TODO: needs to resolve?
    // console.log("filePath", file, req.params);
    if (!path.isAbsolute(file) || !file.startsWith(this.opts.dir)) {
      res.status(403).send("no access");
      return;
    }

    if (!fs.existsSync(file)) {
      res.status(404).send("not found");
      return;
    }

    if (fs.lstatSync(file).isDirectory()) {
      if (req.method === "POST") {
        res.status(404).send("not found");
      } else {
        res.status(203).send("No content: directory");
      }
      return;
    }
    req.params.file = file;
    next();
  };

  constructor(private opts: FileBridgeOptions) {
    opts.dir = path.resolve(opts.dir);
    if (!path.isAbsolute(opts.dir) || !fs.existsSync(opts.dir) || !fs.lstatSync(opts.dir).isDirectory()) {
      throw new Error("not a valid directory " + opts.dir);
    }

    const app = express();

    app.use(cors());
    app.use(bodyParser.text());
    app.get("/file/*?", this.setFilePath, async (req, res) => {
      res.sendFile(req.params.file);
    });

    app.post("/file/*?", this.setFilePath, async (req, res) => {
      fs.writeFileSync(req.params.file, req.body);
      const stat = fs.statSync(req.params.file);
      this.lastSaveStats.set(req.params.file, stat.mtimeMs);
      res.send("saved");
    });

    this.server = http.createServer(app);
    createWatchServer(opts, this.server, this.lastSaveStats);
    this.server.listen(this.opts.port, () => {
      console.log(
        `[server]: Serving directory ${path.resolve(opts.dir)} running at http://localhost:${this.opts.port}`
      );
    });
  }

  public close() {
    this.server?.close();
  }
}
