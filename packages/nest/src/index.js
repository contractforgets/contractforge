"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestAdapterGenerator = void 0;
const core_1 = require("@contractforge/core");
const path_1 = __importDefault(require("path"));
const change_case_1 = require("change-case");
class NestAdapterGenerator extends core_1.BaseGenerator {
    async generate() {
        const defaultDir = path_1.default.join(process.cwd(), this.context.outputDir, "adapters", "nest");
        const templatePath = path_1.default.join(__dirname, "..", "src", "template.ejs");
        for (const entity of this.context.model.entities) {
            if (entity.endpoints.length === 0)
                continue;
            const fileName = `${(0, change_case_1.kebabCase)(entity.name)}.provider.ts`;
            await this.renderAndWrite("template.ejs", path_1.default.join(defaultDir, fileName), { entity }, templatePath);
        }
    }
}
exports.NestAdapterGenerator = NestAdapterGenerator;
//# sourceMappingURL=index.js.map