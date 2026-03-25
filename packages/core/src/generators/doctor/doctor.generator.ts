import { BaseGenerator } from "../../core/engine/generator";
import path from "path";
import { runDoctor, printDoctorReport } from "../../core/doctor/doctor";

export class DoctorGenerator extends BaseGenerator {
  async generate(): Promise<void> {
    if (this.context.config.dryRun) return;

    const outputDir = path.join(process.cwd(), this.context.outputDir);
    const result = await runDoctor(outputDir, true, false);
    printDoctorReport(result, outputDir);
  }
}
