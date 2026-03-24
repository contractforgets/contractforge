import { BaseGenerator } from "@contractforge/core";
import path from "path";
import { pascalCase } from "change-case";

export class ReactQueryAdapterGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "adapters", "react-query");
    const templatePath = path.join(__dirname, "..", "src", "template-react-query.ejs");
    for (const entity of this.context.model.entities) {
      if (entity.endpoints.length === 0) continue;
      const fileName = `use${pascalCase(entity.name)}Query.ts`;
      await this.renderAndWrite("template-react-query.ejs", path.join(defaultDir, fileName), { entity }, templatePath);
    }
  }
}
