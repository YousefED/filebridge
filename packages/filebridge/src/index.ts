import * as yargs from "yargs";
import { FileBridgeServer } from "./server";

export * from "./server";

export type FileBridgeOptions = {
  dir: string;
  port: number;
};

export function run() {
  yargs
    .command(
      ["serve [dir]", "$0 [dir]"],
      "serve a directory",
      (yargs) => {
        yargs
          .positional("dir", {
            describe: "directory to serve",
            type: "string",
            default: ".",
          })
          .options({
            p: { type: "number", default: 3001 },
          });
      },
      (args) => {
        // console.log(args);
        new FileBridgeServer({
          dir: args.dir as string,
          port: args.p as number,
        });
      }
    )
    .help().argv;
}
