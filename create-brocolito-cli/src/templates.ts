import tsConfigJSON from "../tsconfig.json";
import eslintConfig from "../eslint.config.js?raw";
import packageJSON from "../package.json";
import gitIgnore from "../.gitignore?raw";

export type SupportedRuntime = "node" | "bun" | "deno";
export type SupportedPackageManagers = "pnpm" | "npm" | "yarn";
export type SupportedTestFrameworks = "vitest" | SupportedRuntime;

const { name: _, version: _v, bin, ...packageJSONRest } = packageJSON;

const packageJson = (
  name: string,
  runtime: SupportedRuntime,
  testFramework: "vitest" | "runtime" | "none",
): { fileName: string; content: Record<string, unknown> } => {
  if (runtime === "deno") {
    const content = {
      version: "0.0.1",
      tasks: {
        build: "brocolito deno --allow-env",
        lint: "deno task lint:fmt && deno task lint:lint && deno task lint:ts",
        "lint:lint": "deno lint",
        "lint:fmt": "deno fmt",
        "lint:ts": "deno check",
        test: "deno test --allow-env",
      } as Record<string, string>,
      imports: {
        "@std/testing": "jsr:@std/testing@1",
        brocolito: `npm:brocolito@${packageJSONRest.dependencies.brocolito}`,
      } as Record<string, string>,
    };
    if (testFramework === "vitest") {
      content.imports.vitest = `npm:vitest@${packageJSONRest.devDependencies.vitest}`;
    }
    if (testFramework === "none") {
      delete content.tasks.test;
    }
    return {
      fileName: "deno.json",
      content,
    };
  }

  const content = {
    // retaining the order of entries for serialization
    name,
    version: "0.0.1",
    bin: {
      [name]: bin["create-brocolito-cli"],
    },
    ...packageJSONRest,
  };

  if (runtime === "bun") {
    content.scripts.build = "brocolito bun";
    content.scripts.test = "bun test";
  }

  if (runtime === "node") {
    content.scripts.test =
      "node --experimental-strip-types --no-warnings --test";
  }

  if (testFramework !== "vitest") {
    delete (content.devDependencies as Record<string, string>).vitest;
  }

  if (runtime !== "node" || testFramework === "vitest") {
    delete (content.devDependencies as Record<string, string>).vite;
  }

  if (testFramework === "none") {
    delete (content.scripts as Record<string, string>).test;
  }

  return { fileName: "package.json", content };
};

const main = `import { CLI } from "brocolito";

CLI.command("hello", "prints 'hello world'").action(() =>
  console.log("hello world"),
);

CLI.parse(); // this needs to be executed after all "commands" were set up
`;

// "allowImportingTsExtensions": true, <- node without vite
// "erasableSyntaxOnly": true <- node without vite
const tsConfig = (
  runtime: SupportedRuntime,
  testFramework: "vitest" | "runtime" | "none",
) => {
  const config = { ...tsConfigJSON } as Omit<
    typeof tsConfigJSON,
    "compilerOptions"
  > & {
    compilerOptions: Partial<(typeof tsConfigJSON)["compilerOptions"]>;
  };

  if (runtime === "node" && testFramework === "runtime") {
    config.compilerOptions.allowImportingTsExtensions = true;
  }

  return JSON.stringify(config, null, 2) + "\n";
};

const TEST_FILES: Record<SupportedTestFrameworks, string> = {
  // https://vitest.dev/api/
  vitest: `import { describe, vi, it, expect } from "vitest";
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
`,
  // https://bun.sh/docs/cli/test
  bun: `import { describe, spyOn, it, expect } from "bun:test";
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
`,
  // https://nodejs.org/api/test.html
  node: `import { describe, it, mock } from "node:test";
import { CLI } from "brocolito";

mock.method(CLI, "parse").mock.mockImplementationOnce(async () => undefined);
await import("./main.ts");

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("main", () => {
  it("logs 'hello world'", async (t) => {
    // given
    const log = t.mock.method(console, "log");
    log.mock.mockImplementationOnce(() => undefined);

    // when
    await call("hello");

    // then
    t.assert.equal(log.mock.calls[0].arguments[0], "hello world");
  });
});
`,
  // https://docs.deno.com/runtime/fundamentals/testing/
  deno: `import { describe, it } from "@std/testing/bdd";
import { assertSpyCall, stub } from "@std/testing/mock";
import { CLI } from "brocolito";

const parseStub = stub(CLI, "parse");
await import("./main.ts");
parseStub.restore();

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("main", () => {
  it("logs 'hello world'", async () => {
    // given
    const log = stub(console, "log");

    // when
    await call("hello");

    // then
    assertSpyCall(log, 0, { args: ["hello world"] });
  });
});
`,
};

const testFile = (framework: SupportedTestFrameworks) => TEST_FILES[framework];

export const Templates = {
  packageJson,
  main,
  testFile,
  tsConfig,
  eslintConfig,
  gitIgnore,
};
