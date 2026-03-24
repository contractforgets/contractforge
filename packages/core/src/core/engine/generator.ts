import { ContractModel } from "../model/contract";
import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { camelCase, kebabCase, pascalCase, snakeCase } from "change-case";

export interface EngineConfig {
  input: string;
  output: string;
  client?: string;
  adapters?: string[];
  clean?: boolean;
  dryRun?: boolean;
  watch?: boolean;
  naming?: {
    dtoSuffix?: string;
    serviceSuffix?: string;
    repositorySuffix?: string;
  };
  wrapResponse?: boolean;
  hooks?: {
    beforeGenerate?: () => Promise<void>;
    afterGenerate?: () => Promise<void>;
    beforeWriteFile?: (filePath: string, content: string) => Promise<string | void>;
  };
}

export interface EngineContext {
  model: ContractModel;
  config: EngineConfig;
  outputDir: string;
}

export abstract class BaseGenerator {
  protected context: EngineContext;
  
  constructor(context: EngineContext) {
    this.context = context;
  }
  
  abstract generate(): Promise<void>;

  protected async renderAndWrite(
    templateName: string, 
    outputPath: string, 
    data: any,
    absoluteTemplatePath?: string
  ): Promise<void> {
    let srcTemplatePath = "";
    if (absoluteTemplatePath) {
       srcTemplatePath = absoluteTemplatePath;
    } else {
       const rootDir = path.resolve(__dirname, "..", "..", "..");
       srcTemplatePath = path.join(rootDir, "src", "templates", templateName);
    }
    const templateContent = await fs.readFile(srcTemplatePath, "utf-8");
    
    // Inject global helpers and config into EJS context
    const renderPayload = {
      ...data,
      config: this.context.config,
      camelCase,
      kebabCase,
      pascalCase,
      snakeCase
    };
    
    let result = ejs.render(templateContent, renderPayload);
    
    if (this.context.config.hooks?.beforeWriteFile) {
      const hookedResult = await this.context.config.hooks.beforeWriteFile(outputPath, result);
      if (typeof hookedResult === "string") {
         result = hookedResult;
      }
    }
    
    if (this.context.config.dryRun) {
      console.log(`[DRY RUN] Would generate: ${outputPath}`);
      return;
    }
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, result);
  }
}
