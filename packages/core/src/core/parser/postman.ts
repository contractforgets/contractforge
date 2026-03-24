import { ContractModel, Entity, Endpoint } from "../model/contract";
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
        
        const endpoint: Endpoint = {
          name: endpointName,
          method: method.toUpperCase() as any,
          path: pathUrl, // Rebuild clean path
          requestFields: [], // We skip full schema guessing for postman fallback in MVP
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
