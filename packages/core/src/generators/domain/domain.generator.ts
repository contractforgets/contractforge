import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import { kebabCase } from "change-case";

export class DomainGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "domain");
    for (const entity of this.context.model.entities) {
      const fileName = `${kebabCase(entity.name)}.ts`;
      await this.renderAndWrite("domain.ejs", path.join(defaultDir, fileName), { entity });
    }
  }
}
