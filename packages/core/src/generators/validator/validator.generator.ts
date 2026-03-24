import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import { camelCase, kebabCase } from "change-case";

export class ValidatorGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "validators");
    for (const entity of this.context.model.entities) {
      const fileName = `${kebabCase(entity.name)}.validator.ts`;
      await this.renderAndWrite("validator.ejs", path.join(defaultDir, fileName), { entity });
    }
  }
}
