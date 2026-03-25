import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import { snakeCase } from "change-case";

export function getDtoFileSuffix(dtoSuffix?: string): string {
  if (!dtoSuffix) return "";
  return "." + dtoSuffix.toLowerCase();
}

export class DTOGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const dtoDir = path.join(process.cwd(), this.context.outputDir, "core", "dto");
    
    for (const entity of this.context.model.entities) {
      const fileName = `${snakeCase(entity.name)}${getDtoFileSuffix(this.context.config.naming?.dtoSuffix)}.ts`;
      const outputPath = path.join(dtoDir, fileName);
      
      await this.renderAndWrite("dto.ejs", outputPath, { entity });
    }
  }
}
