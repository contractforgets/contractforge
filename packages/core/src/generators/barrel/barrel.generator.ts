import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import fs from "fs-extra";

export class BarrelGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const coreDir = path.join(process.cwd(), this.context.outputDir, "core");
    
    // The standard clean architecture buckets
    const dirs = ["dto", "domain", "mappers", "repository", "services", "client", "errors", "types", "validators"];
    const coreExports: string[] = [];
    
    if (this.context.config.dryRun) return;

    for (const d of dirs) {
      const folderPath = path.join(coreDir, d);
      if (await fs.pathExists(folderPath)) {
        coreExports.push(`export * from "./${d}";`);
        
        // Dynamically create index.ts inside each nested sub-folder
        const files = await fs.readdir(folderPath);
        const folderExports = files
          .filter(f => f.endsWith('.ts') && f !== 'index.ts')
          .map(f => `export * from "./${f.replace('.ts', '')}";`);
          
        if (folderExports.length > 0) {
           await fs.writeFile(path.join(folderPath, "index.ts"), folderExports.join("\n") + "\n");
        }
      }
    }
    
    // Create core/index.ts
    if (coreExports.length > 0) {
       await fs.writeFile(path.join(coreDir, "index.ts"), coreExports.join("\n") + "\n");
       
       // Create ultimate src/api/index.ts exporting core natively
       const rootDir = path.join(process.cwd(), this.context.outputDir);
       await fs.writeFile(path.join(rootDir, "index.ts"), `export * from "./core";\n`);
    }
  }
}
