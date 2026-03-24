import { BaseGenerator } from "../../core/engine/generator";
import path from "path";

export class ErrorGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "errors");
    await this.renderAndWrite("error.ejs", path.join(defaultDir, "error.mapper.ts"), {});
  }
}
