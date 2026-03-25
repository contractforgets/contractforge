import { ContractModel } from "../model/contract";
import { EngineConfig, EngineContext, BaseGenerator } from "./generator";
import SwaggerParser from "@apidevtools/swagger-parser";
import fs from "fs-extra";
import { parseOpenApi } from "../parser/openapi";
import { parsePostman } from "../parser/postman";

import { TypesGenerator } from "../../generators/types/types.generator";
import { ErrorGenerator } from "../../generators/errors/error.generator";
import { ClientGenerator } from "../../generators/client/client.generator";
import { DTOGenerator } from "../../generators/dto/dto.generator";
import { ValidatorGenerator } from "../../generators/validator/validator.generator";
import { DomainGenerator } from "../../generators/domain/domain.generator";
import { MapperGenerator } from "../../generators/mapper/mapper.generator";
import { RepositoryGenerator } from "../../generators/repository/repository.generator";
import { ServiceGenerator } from "../../generators/service/service.generator";

import { BarrelGenerator } from "../../generators/barrel/barrel.generator";
import { DoctorGenerator } from "../../generators/doctor/doctor.generator";

export class GeneratorEngine {
  private config: EngineConfig;
  private pluginClasses: any[] = [];
  
  constructor(config: EngineConfig) {
    this.config = config;
    if (!this.config.naming) {
      this.config.naming = {
        dtoSuffix: "",
        serviceSuffix: "Service",
        repositorySuffix: "Repository"
      };
    }
  }

  public addPluginClass(PluginClass: any) {
    this.pluginClasses.push(PluginClass);
  }

  public async run(): Promise<void> {
    if (this.config.hooks?.beforeGenerate) {
      await this.config.hooks.beforeGenerate();
    }

    if (this.config.clean) {
      await fs.remove(this.config.output);
      console.log(`[CLEAN] Removed ${this.config.output}`);
    }

    console.log(`[ENGINE] Parsing contract at ${this.config.input}...`);
    const fileContent = await fs.readFile(this.config.input, "utf-8");
    let model: ContractModel;

    if (fileContent.includes("schema.getpostman.com")) {
      const postmanJson = JSON.parse(fileContent);
      model = parsePostman(postmanJson);
    } else {
      const api: any = await SwaggerParser.bundle(this.config.input);
      model = parseOpenApi(api);
    }

    const context: EngineContext = {
      model,
      config: this.config,
      outputDir: this.config.output
    };

    // Core Base Generators
    const pipeline: BaseGenerator[] = [
      new TypesGenerator(context),
      new ErrorGenerator(context),
      new ClientGenerator(context),
      new DTOGenerator(context),
      new ValidatorGenerator(context),
      new DomainGenerator(context),
      new MapperGenerator(context),
      new RepositoryGenerator(context),
      new ServiceGenerator(context),
    ];

    // Pipeline runner
    for (const generator of pipeline) {
      await generator.generate();
    }
    
    // Inject dynamic adapter plugins
    for (const PluginClass of this.pluginClasses) {
      await new PluginClass(context).generate();
    }

    await new BarrelGenerator(context).generate();

    // Run doctor (format + lint) unless explicitly disabled
    if (this.config.doctor !== false) {
      await new DoctorGenerator(context).generate();
    }

    if (this.config.hooks?.afterGenerate) {
      await this.config.hooks.afterGenerate();
    }
    console.log(`[ENGINE] Pipeline execution completely finished targeting ${this.config.output}`);
  }
}
