import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import { kebabCase } from "change-case";

export class RepositoryGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "repository");
    for (const entity of this.context.model.entities) {
      if (entity.endpoints.length === 0) continue;
      const fileName = `${kebabCase(entity.name)}.repository.ts`;
      await this.renderAndWrite("repository.ejs", path.join(defaultDir, fileName), { entity });
    }
  }
}
