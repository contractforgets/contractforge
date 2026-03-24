import { BaseGenerator } from "@contractforge/core";
import path from "path";
import { pascalCase } from "change-case";

export class SwrAdapterGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "adapters", "swr");
    const templatePath = path.join(__dirname, "..", "src", "template.ejs");
    for (const entity of this.context.model.entities) {
      if (entity.endpoints.length === 0) continue;
      const fileName = `use${pascalCase(entity.name)}Swr.ts`;
      await this.renderAndWrite("template.ejs", path.join(defaultDir, fileName), { entity }, templatePath);
    }
  }
}
