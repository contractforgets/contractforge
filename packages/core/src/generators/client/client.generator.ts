import { BaseGenerator } from "../../core/engine/generator";
import path from "path";

export class ClientGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    const defaultDir = path.join(process.cwd(), this.context.outputDir, "core", "client");
    const templateName = this.context.config.client === "fetch" ? "client-fetch.ejs" : "client-axios.ejs";
    await this.renderAndWrite(templateName, path.join(defaultDir, "api-client.ts"), {});
  }
}
