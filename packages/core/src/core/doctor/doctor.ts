import fs from "fs-extra";
import path from "path";
import * as prettier from "prettier";
import ts from "typescript";

export interface DoctorIssue {
  file: string;
  type: "format" | "empty" | "missing-export" | "unused-import" | "ts-error" | "ts-warning";
  message: string;
  line?: number;
}

export interface DoctorResult {
  filesChecked: number;
  filesFormatted: number;
  unusedImportsRemoved: number;
  issues: DoctorIssue[];
}

const PRETTIER_CONFIG: prettier.Options = {
  parser: "typescript",
  printWidth: 100,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: "es5",
  semi: true,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};

// TS error codes we care about
const UNUSED_IMPORT_CODE = 6133; // declared but never read
const UNUSED_IMPORT_CODE_2 = 6196; // declared but never used (type)

async function collectTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  if (!(await fs.pathExists(dir))) return files;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function removeUnusedImports(source: string, unusedNames: Set<string>): string {
  const lines = source.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const importMatch = line.match(/^import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/);
    if (!importMatch) {
      result.push(line);
      continue;
    }

    const specifiers = importMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    const kept = specifiers.filter((spec) => {
      // handle "Foo as Bar" — check the alias (Bar) against unused names
      const alias = spec.includes(" as ") ? spec.split(" as ")[1].trim() : spec.trim();
      return !unusedNames.has(alias);
    });

    if (kept.length === 0) {
      // entire import removed — skip line
      continue;
    }

    if (kept.length === specifiers.length) {
      // nothing removed
      result.push(line);
    } else {
      // rebuild with only kept specifiers
      result.push(line.replace(importMatch[1], ` ${kept.join(", ")} `));
    }
  }

  return result.join("\n");
}

function runTsDiagnostics(files: string[]): Map<string, ts.Diagnostic[]> {
  const program = ts.createProgram(files, {
    noEmit: true,
    strict: false,
    noUnusedLocals: true,
    noUnusedParameters: false,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
  });

  const diagnosticsMap = new Map<string, ts.Diagnostic[]>();
  const allDiagnostics = ts.getPreEmitDiagnostics(program);

  for (const diag of allDiagnostics) {
    if (!diag.file) continue;
    const filePath = diag.file.fileName;
    if (!diagnosticsMap.has(filePath)) diagnosticsMap.set(filePath, []);
    diagnosticsMap.get(filePath)!.push(diag);
  }

  return diagnosticsMap;
}

export async function runDoctor(
  outputDir: string,
  fix = true,
  verbose = false
): Promise<DoctorResult> {
  const result: DoctorResult = {
    filesChecked: 0,
    filesFormatted: 0,
    unusedImportsRemoved: 0,
    issues: [],
  };

  const files = await collectTsFiles(outputDir);
  result.filesChecked = files.length;
  if (files.length === 0) return result;

  // --- Pass 1: TS diagnostics (unused imports + errors) ---
  const diagMap = runTsDiagnostics(files);

  for (const file of files) {
    const diags = diagMap.get(file) || [];
    const unusedNames = new Set<string>();

    for (const diag of diags) {
      const line = diag.file
        ? diag.file.getLineAndCharacterOfPosition(diag.start ?? 0).line + 1
        : undefined;
      const message = ts.flattenDiagnosticMessageText(diag.messageText, " ");

      if (diag.code === UNUSED_IMPORT_CODE || diag.code === UNUSED_IMPORT_CODE_2) {
        // Extract the symbol name from the message: "'Foo' is declared but its value is never read."
        const match = message.match(/'([^']+)'/);
        if (match) unusedNames.add(match[1]);
        result.issues.push({ file, type: "unused-import", message, line });
      } else if (diag.category === ts.DiagnosticCategory.Error) {
        result.issues.push({ file, type: "ts-error", message, line });
      }
    }

    // Auto-fix: strip unused imports
    if (fix && unusedNames.size > 0) {
      const original = await fs.readFile(file, "utf-8");
      const cleaned = removeUnusedImports(original, unusedNames);
      if (cleaned !== original) {
        await fs.writeFile(file, cleaned, "utf-8");
        result.unusedImportsRemoved += unusedNames.size;
        if (verbose) {
          console.log(
            `[DOCTOR] Removed ${unusedNames.size} unused import(s): ${path.relative(process.cwd(), file)}`
          );
        }
      }
    }
  }

  // --- Pass 2: Prettier format (after unused imports removed) ---
  for (const file of files) {
    const original = await fs.readFile(file, "utf-8");

    if (original.trim().length === 0) {
      result.issues.push({ file, type: "empty", message: "File is empty" });
      continue;
    }

    if (!original.includes("export")) {
      result.issues.push({ file, type: "missing-export", message: "File has no exports" });
    }

    let formatted: string;
    try {
      formatted = await prettier.format(original, PRETTIER_CONFIG);
    } catch (e: any) {
      result.issues.push({ file, type: "format", message: `Prettier failed: ${e.message}` });
      continue;
    }

    if (formatted !== original) {
      result.issues.push({ file, type: "format", message: "File is not formatted correctly" });
      if (fix) {
        await fs.writeFile(file, formatted, "utf-8");
        result.filesFormatted++;
        if (verbose) {
          console.log(`[DOCTOR] Formatted: ${path.relative(process.cwd(), file)}`);
        }
      }
    }
  }

  return result;
}

export function printDoctorReport(result: DoctorResult, outputDir: string): void {
  const rel = path.relative(process.cwd(), outputDir);
  console.log(`\n[DOCTOR] Checked ${result.filesChecked} files in ${rel}/`);

  if (result.filesFormatted > 0) {
    console.log(`[DOCTOR] Formatted ${result.filesFormatted} files`);
  }
  if (result.unusedImportsRemoved > 0) {
    console.log(`[DOCTOR] Removed ${result.unusedImportsRemoved} unused import(s)`);
  }

  const remainingIssues = result.issues.filter(
    (i) => i.type === "ts-error" || i.type === "empty" || i.type === "missing-export"
  );

  for (const issue of remainingIssues) {
    const loc = issue.line ? `:${issue.line}` : "";
    console.warn(
      `[DOCTOR] ${issue.type === "ts-error" ? "ERROR" : "WARN "}  ${issue.type.toUpperCase()} — ${path.relative(process.cwd(), issue.file)}${loc}: ${issue.message}`
    );
  }

  const hasProblems = remainingIssues.length > 0;
  if (!hasProblems) {
    console.log("[DOCTOR] All files look good.");
  }
}
