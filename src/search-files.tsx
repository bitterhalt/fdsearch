import { Action, ActionPanel, closeMainWindow, List, open } from "@vicinae/api";
import { useEffect, useState } from "react";
import { spawn, type ChildProcess } from "node:child_process";
import { homedir } from "node:os";

const MAX_RESULTS = 500;
const SEARCH_DELAY_MS = 250;
const EXCLUDED_DIRS = [".icons", "Pictures", "Videos", "bin", "icons", "lib", "lib64", "man"];
const SEARCH_ROOTS = [homedir(), "/etc", "/usr", "/opt", "/var", "/srv"];

type SearchState = {
  query: string;
  paths: string[];
  searching: boolean;
  error?: string;
};

function runSearch(query: string, onUpdate: (update: Partial<SearchState>) => void): () => void {
  let process: ChildProcess | undefined;
  let cancelled = false;
  const timer = setTimeout(() => {
    if (cancelled) return;

    const args = ["--hidden", "--no-ignore", "--type", "file"];
    for (const directory of EXCLUDED_DIRS) args.push("--exclude", directory);
    args.push("--", query, ...SEARCH_ROOTS);

    try {
      process = spawn("fd", args, { stdio: ["ignore", "pipe", "ignore"] });
    } catch (error) {
      onUpdate({ searching: false, error: error instanceof Error ? error.message : String(error) });
      return;
    }

    let output = "";
    const paths: string[] = [];
    process.stdout?.setEncoding("utf8");
    process.stdout?.on("data", (chunk: string) => {
      output += chunk;
      const lines = output.split("\n");
      output = lines.pop() ?? "";
      for (const path of lines) {
        if (path && paths.length < MAX_RESULTS) paths.push(path);
      }
      onUpdate({ paths: [...paths] });
      if (paths.length >= MAX_RESULTS) process?.kill("SIGTERM");
    });
    process.on("error", (error) => {
      if (!cancelled) onUpdate({ searching: false, error: `Could not run fd: ${error.message}` });
    });
    process.on("close", () => {
      if (cancelled) return;
      if (output && paths.length < MAX_RESULTS) paths.push(output);
      onUpdate({ paths, searching: false });
    });
  }, SEARCH_DELAY_MS);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    process?.kill("SIGTERM");
  };
}

export default function SearchFiles() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ query: "", paths: [], searching: false });

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setState({ query, paths: [], searching: false });
      return;
    }

    setState({ query, paths: [], searching: true });
    return runSearch(trimmedQuery, (update) => {
      setState((current) => (current.query === query ? { ...current, ...update } : current));
    });
  }, [query]);

  const paths = state.paths;

  return (
    <List
      searchText={query}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Find files with fd..."
      isLoading={state.searching}
    >
      {paths.map((path) => (
        <List.Item
          key={path}
          title={path.slice(path.lastIndexOf("/") + 1) || path}
          subtitle={path}
          icon="📄"
          actions={
            <ActionPanel>
              <Action
                title="Open File"
                onAction={async () => {
                  await open(path);
                  await closeMainWindow();
                }}
              />
              {!path.startsWith(`${homedir()}/`) && path !== homedir() && (
                <Action.RunInTerminal title="Edit as Administrator (sudoedit)" args={["sudoedit", path]} />
              )}
              <Action.CopyToClipboard title="Copy Path" content={path} />
            </ActionPanel>
          }
        />
      ))}
      {!query.trim() && (
        <List.EmptyView title="Search files" description="Type a query to scan with fd. No index is used." />
      )}
      {!!query.trim() && !state.searching && paths.length === 0 && !state.error && (
        <List.EmptyView title="No files found" description="Try another query." />
      )}
      {!!state.error && <List.EmptyView title="Search failed" description={state.error} />}
      {paths.length === MAX_RESULTS && (
        <List.EmptyView title={`Showing first ${MAX_RESULTS} results`} description="Refine your query to narrow the search." />
      )}
    </List>
  );
}
