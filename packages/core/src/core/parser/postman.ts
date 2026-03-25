import { ContractModel, Entity, Endpoint, Field } from "../model/contract";
import { pascalCase, camelCase } from "change-case";

export function parsePostman(postmanJson: any): ContractModel {
  const entitiesMap = new Map<string, Entity>();
  
  const extractItems = (items: any[]) => {
    for (const item of items) {
      if (item.item) {
        extractItems(item.item);
      } else if (item.request) {
        const method = item.request.method;
        const urlObj = item.request.url;
        
        // Handle Postman url strings vs url object definitions
        let pathUrl = "/";
        if (urlObj) {
           if (typeof urlObj === "string") {
              const u = new URL(urlObj.replace(/\{\{.*\}\}/g, 'http://mock'));
              pathUrl = u.pathname;
           } else {
              pathUrl = "/" + (urlObj.path || []).join("/");
           }
        }
        
        // Exclude variables from basic pathing strategy (e.g. /{{user_id}})
        let rawCleanPath = pathUrl.replace(/\{\{[^}]+\}\}/g, "");
        const pathParts = rawCleanPath.split("/").filter(Boolean);
        
        let entityName = "General";
        if (pathParts.length > 0) {
           entityName = pascalCase(pathParts[0]);
        }
        
        if (!entitiesMap.has(entityName)) {
          entitiesMap.set(entityName, { name: entityName, fields: [], endpoints: [] });
        }
        
        const endpointName = camelCase(`${method}_${item.name.replace(/[\W_]+/g, "_")}`);
        
        const requestFields: Field[] = [];
        if (item.request?.body?.mode === "raw" && item.request?.body?.raw) {
          try {
            const parsedBody = JSON.parse(item.request.body.raw);
            if (typeof parsedBody === "object" && parsedBody !== null) {
              for (const [key, val] of Object.entries(parsedBody)) {
                let type: any = "string";
                if (typeof val === "number") type = "number";
                if (typeof val === "boolean") type = "boolean";
                if (typeof val === "object" && !Array.isArray(val)) type = "any";
                
                const field: Field = {
                  name: key,
                  type,
                  required: true,
                  isArray: Array.isArray(val)
                };
                
                requestFields.push(field);
                
                const entityDetails = entitiesMap.get(entityName)!;
                if (!entityDetails.fields.find(f => f.name === key)) {
                  entityDetails.fields.push(field);
                }
              }
            }
          } catch (e) {
            // Ignore parse errors, fallback to empty fields natively
          }
        }

        const endpoint: Endpoint = {
          name: endpointName,
          method: method.toUpperCase() as any,
          path: pathUrl, // Rebuild clean path
          requestFields, // Now dynamically mapped over postman examples securely
          responseFields: [] // Defaults to returning basically typed instances
        };
        
        entitiesMap.get(entityName)!.endpoints.push(endpoint);
      }
    }
  };
  
  extractItems(postmanJson.item || []);
  
  return {
    entities: Array.from(entitiesMap.values())
  };
}
