import tsConfigJSON from "../tsconfig.json";
import eslintJSON from "../.eslintrc.json";
import packageJSON from "../package.json";
import gitIgnore from "../.gitignore?raw";

const { name: _, version: _v, bin, ...packageJSONWithoutName } = packageJSON;

const packageJson = (name: string) =>
  JSON.stringify(
    {
      // retaining the order of entries for serialization
      name,
      version: "0.0.1",
      bin: {
        [name]: bin["create-brocolito-cli"],
      },
      ...packageJSONWithoutName,
    },
    null,
    2,
  ) + "\n";
const main = `import { CLI } from "brocolito";

CLI.command("hello", "prints 'hello world'").action(() =>
  console.log("hello world")
);

CLI.parse(); // this needs to be executed after all "commands" were set up
`;
const testFile = `import { describe, vi, it, expect } from "vitest";
import { CLI } from "brocolito";

vi.spyOn(CLI, "parse").mockImplementationOnce(async () => undefined);

const call = (line: string) =>
  CLI.parse(["nodeFile", "scriptFile"].concat(line.split(" ")));

describe("main", () => {
  it("logs 'hello world'", async () => {
    // given
    const log = vi
      .spyOn(console, "log")
      .mockImplementationOnce(() => undefined);
    await import("./main");

    // when
    await call("hello");

    // then
    expect(log).toHaveBeenCalledWith("hello world");
  });
});
`;
const tsConfig = JSON.stringify(tsConfigJSON, null, 2) + "\n";
const eslintConfig = JSON.stringify(eslintJSON, null, 2) + "\n";

export const Templates = {
  packageJson,
  main,
  testFile,
  tsConfig,
  eslintConfig,
  gitIgnore,
};
