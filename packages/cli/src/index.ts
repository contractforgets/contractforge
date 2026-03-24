#!/usr/bin/env node
import { program } from "commander";
import fs from "fs-extra";
import path from "path";
import chokidar from "chokidar";
import { GeneratorEngine, EngineConfig } from "@contractforge/core";

program
  .name("contractforge")
  .description("Enterprise SDK Compiler processing OpenAPI/Postman contracts into strictly typed Clean Architecture bindings.")
  .version("0.2.0");

program
  .command("init")
  .description("Initialize configuration file")
  .action(async () => {
    const configPath = path.join(process.cwd(), "contractforge.config.json");
    const defaultConfig = {
      input: "openapi.yaml",
      output: "src/api",
      client: "axios",
      adapters: [],
      naming: {
        dtoSuffix: "DTO",
        serviceSuffix: "Service",
        repositorySuffix: "Repository"
      },
      wrapResponse: false
    };
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log("Created contractforge.config.json!");
  });

program
  .command("clean")
  .description("Removes generated files")
  .action(async () => {
     const configPath = path.resolve(process.cwd(), "contractforge.config.json");
     let outDir = "src/api";
     if (fs.existsSync(configPath)) {
        const conf = JSON.parse(await fs.readFile(configPath, "utf-8"));
        if (conf.output) outDir = conf.output;
     }
     await fs.remove(path.resolve(process.cwd(), outDir));
     console.log(`[CLEAN] Removed ${outDir} successfully.`);
  });

program
  .command("generate")
  .description("Generate the SDK from contract")
  .option("-i, --input <path>", "Path to OpenAPI/Postman file")
  .option("-o, --output <dir>", "Directory for generated code")
  .option("-c, --client <type>", "HTTP client type (axios or fetch)")
  .option("-a, --adapter <type>", "Framework adapter (e.g. react, angular)")
  .option("--plugin <plugin...>", "Additional plugins to run (e.g. react-query, swr)")
  .option("--watch", "Watch mode for instant rebuilds")
  .option("--dry-run", "Shows files without writing")
  .action(async (options) => {
    
    // Build Config
    let config: EngineConfig = {
      input: options.input || "openapi.yaml",
      output: options.output || "src/api",
      client: options.client || "axios",
      clean: true,
      dryRun: options.dryRun || false,
      watch: options.watch || false,
      naming: { dtoSuffix: "", serviceSuffix: "Service", repositorySuffix: "Repository" }
    };

    const configPath = path.resolve(process.cwd(), "contractforge.config.json");
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(await fs.readFile(configPath, "utf-8"));
      config = { ...config, ...fileConfig };
      if (options.input) config.input = options.input;
      if (options.output) config.output = options.output;
      if (options.client) config.client = options.client;
      if (options.adapter) {
         if (!config.adapters) config.adapters = [];
         config.adapters.push(options.adapter);
      }
    }
    
    // Inject Plugins
    if (options.plugin) {
       if (!config.adapters) config.adapters = [];
       config.adapters.push(...options.plugin);
    }

    const engine = new GeneratorEngine(config);

    if (config.adapters) {
      for (const adapter of config.adapters) {
        try {
          const pkgName = adapter.startsWith("@") ? adapter : `@contractforge/${adapter}`;
          const PluginModule = require(pkgName);
          for (const key of Object.keys(PluginModule)) {
             if (PluginModule[key] && PluginModule[key].prototype && PluginModule[key].prototype.generate) {
                 engine.addPluginClass(PluginModule[key]);
             }
          }
        } catch (e: any) {
          console.warn(`[WARN] Could not safely load plugin scope for ${adapter}:`, e.message);
        }
      }
    }

    if (config.watch) {
       console.log(`[WATCH] Watching for changes to ${config.input}...`);
       chokidar.watch(config.input).on('change', async () => {
         console.log(`\n[WATCH] ${config.input} modified! Regenerating engine...`);
         try {
           await engine.run();
         } catch (e) {
           console.error("[ENGINE ERROR]", e);
         }
       });
    }

    try {
      await engine.run();
    } catch (e) {
      console.error("[ENGINE FATAL]", e);
      process.exit(1);
    }
  });

program.parse(process.argv);
