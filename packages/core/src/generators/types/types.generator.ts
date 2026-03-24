import { BaseGenerator } from "../../core/engine/generator";
import path from "path";

export class TypesGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "types");
    await this.renderAndWrite("types.ejs", path.join(defaultDir, "result.ts"), {});
  }
}
