import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import { kebabCase } from "change-case";

export class MapperGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "mappers");
    for (const entity of this.context.model.entities) {
      const fileName = `${kebabCase(entity.name)}.mapper.ts`;
      await this.renderAndWrite("mapper.ejs", path.join(defaultDir, fileName), { entity });
    }
  }
}
