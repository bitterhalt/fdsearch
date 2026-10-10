# FD Search

A Vicinae extension for searching files with [`fd`](https://github.com/sharkdp/fd). Searches run directly against the filesystem—there is no index to build or maintain.

## Features

- Search updates as you type, with a short debounce to avoid spawning a process for every keystroke.
- Searches hidden and ignored files, matching the behavior of `fd -HI -t f`.
- Opens selected files with Vicinae's standard **Open File** action.
- Offers **Edit as Administrator (sudoedit)** for files outside `$HOME`.
- Includes a **Copy Path** action.
- Limits the displayed results to 500; refine the query if you need to narrow the search.

## Search scope

Searches these locations:

- `$HOME`
- `/etc`
- `/usr`
- `/opt`
- `/var`
- `/srv`

Directories named `.icons`, `Pictures`, `Videos`, `bin`, `icons`, `lib`, `lib64`, and `man` are excluded. The extension invokes `fd` directly (without a shell), so the query is passed safely as a single argument. `fd` must be available as `fd` on `PATH`.

## Requirements

- Vicinae
- Node.js 20 or newer and npm
- [`fd`](https://github.com/sharkdp/fd)

## Install and develop

Install dependencies and start the extension in Vicinae's development mode:

```sh
npm install
npm run dev
```

To build the extension without starting a development session:

```sh
npm run build
```

## Behavior notes

- This is tested only on Linux, so probably No-Go on Windows or 🍎
- Search is skipped until the query is non-empty.
- Matching follows `fd`'s regular-expression pattern syntax.
- Symlink directories are not followed by `fd`'s default behavior.
- The administrator edit action opens `sudoedit` in a terminal. Configure `SUDO_EDITOR`, `VISUAL`, or `EDITOR` to choose the editor; sudo may prompt for authentication in the terminal.
