import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";
import ts from "typescript";

const srcDir = path.resolve(fileURLToPath(new URL("../src", import.meta.url)));

// Register .ts handler
if (Module._extensions && !Module._extensions[".ts"]) {
  Module._extensions[".ts"] = function (module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const result = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: filename,
    });
    module._compile(result.outputText, filename);
  };
}

// Hook Module._resolveFilename for @/ aliases and extensionless TS imports
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  let targetPath = request;
  if (request.startsWith("@/")) {
    targetPath = path.join(srcDir, request.slice(2));
  } else if ((request.startsWith("./") || request.startsWith("../")) && parent && parent.filename) {
    targetPath = path.resolve(path.dirname(parent.filename), request);
  }

  if (targetPath.startsWith(srcDir)) {
    for (const ext of ["", ".ts", ".tsx", ".js", ".json"]) {
      const candidate = targetPath + ext;
      if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

export function loadTypeScript(fileUrl) {
  const filename = fileURLToPath(fileUrl);
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(result.outputText, filename);
  return loaded.exports;
}
