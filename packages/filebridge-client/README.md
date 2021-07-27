# FileBridge-client

[![npm version](https://badge.fury.io/js/filebridge-client.svg)](https://badge.fury.io/js/filebridge-client)

FileBridge is a simple server to interact with a directory on your local file system. Use it to interact with a filesystem from a web application or other client.

# Starting

    npx filebridge [dir] [-p 3001]

# Reading files

    GET /file/<relative path to dir>

# Writing files

    POST /file/<relative path to dir>

# Watching

FileBridge exposes filesystem events (provided by Chokidar) over WebSockets.

# Client (this package)

A javascript is available as the package `filebridge-client`. See example usage in the [unit test](https://github.com/YousefED/filebridge/blob/main/packages/filebridge/test/server.test.ts).
