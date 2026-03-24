import { BaseGenerator } from "@contractforge/core";
import path from "path";
import { kebabCase } from "change-case";

export class AngularAdapterGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "adapters", "angular");
    const templatePath = path.join(__dirname, "..", "src", "template.ejs");
    for (const entity of this.context.model.entities) {
      if (entity.endpoints.length === 0) continue;
      const fileName = `${kebabCase(entity.name)}.angular.service.ts`;
      await this.renderAndWrite("template.ejs", path.join(defaultDir, fileName), { entity }, templatePath);
    }
  }
}
