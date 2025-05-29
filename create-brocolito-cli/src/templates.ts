import tsConfigJSON from "../tsconfig.json";
import eslintConfig from "../eslint.config.js?raw";
import packageJSON from "../package.json";
import gitIgnore from "../.gitignore?raw";

export type SupportedRuntime = "node" | "bun" | "deno";

const { name: _, version: _v, bin, ...packageJSONRest } = packageJSON;

const packageJson = (name: string, runtime: SupportedRuntime) => {
  const result = {
    // retaining the order of entries for serialization
    name,
    version: "0.0.1",
    bin: {
      [name]: bin["create-brocolito-cli"],
    },
    ...packageJSONRest,
  };

  if (runtime === "bun") {
    result.scripts.build = "brocolito bun";
    result.scripts.test = "bun test";
  }

  if (runtime === "deno") {
    result.scripts.build = "brocolito-deno";
    result.scripts.test = "deno test";
    result.scripts["lint:ts"] = "deno check";
    // TODO: Opt-in to "deno fmt" + "deno lint"?
  }

  return JSON.stringify(result, null, 2) + "\n";
};

const main = `import { CLI } from "brocolito";

CLI.command("hello", "prints 'hello world'").action(() =>
  console.log("hello world"),
);

CLI.parse(); // this needs to be executed after all "commands" were set up
`;

// when getting rid of vite(st), also opt-in to runtime specific test cases
const testFile = `import { describe, vi, it, expect } from "vitest";
import { CLI } from "brocolito";

vi.spyOn(CLI, "parse").mockImplementationOnce(async () => undefined);
await import("./main");

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("main", () => {
  it("logs 'hello world'", async () => {
    // given
    const log = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => undefined);

    // when
    await call("hello");

    // then
    expect(log).toHaveBeenCalledWith("hello world");
  });
});
`;
const testFileBun = `import { describe, spyOn, it, expect } from "bun:test";
import { CLI } from "brocolito";

spyOn(CLI, "parse").mockImplementationOnce(async () => undefined);
await import("./main");

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("main", () => {
  it("logs 'hello world'", async () => {
    // given
    const log = spyOn(console, "log").mockImplementationOnce(() => undefined);

    // when
    await call("hello");

    // then
    expect(log).toHaveBeenCalledWith("hello world");
  });
});
`;

// "allowImportingTsExtensions": true, <- node + deno
// "erasableSyntaxOnly": true <- node
const tsConfig = (runtime: SupportedRuntime) => {
  const config = { ...tsConfigJSON } as Omit<
    typeof tsConfigJSON,
    "compilerOptions"
  > & {
    compilerOptions: Partial<(typeof tsConfigJSON)["compilerOptions"]>;
  };

  if (runtime === "deno") {
    config.compilerOptions.allowImportingTsExtensions = true;

    // the following options are ignored by deno and raise a warning otherwise
    delete config.compilerOptions.allowSyntheticDefaultImports;
    delete config.compilerOptions.module;
    delete config.compilerOptions.moduleResolution;
    delete config.compilerOptions.noEmit;
    delete config.compilerOptions.removeComments;
    delete config.compilerOptions.resolveJsonModule;
    delete config.compilerOptions.skipLibCheck;
    delete config.compilerOptions.sourceMap;
    delete config.compilerOptions.target;
  }

  return JSON.stringify(config, null, 2) + "\n";
};

export const Templates = {
  packageJson,
  main,
  testFile,
  testFileBun,
  tsConfig,
  eslintConfig,
  gitIgnore,
};
