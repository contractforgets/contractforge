import { ContractModel, Entity, Endpoint, Field } from "../model/contract";
import { pascalCase, camelCase } from "change-case";

export function parseOpenApi(api: any): ContractModel {
  const entitiesMap = new Map<string, Entity>();
  
  // 1. Extract Models (Entities) -> We only want root schemas from swagger bundle
  const schemas = api.components?.schemas || {};
  
  // Track enums so we can strip refs and fallback to strings
  const enumKeys = new Set<string>();
  for (const [name, obj] of Object.entries<any>(schemas)) {
    if (obj.enum) enumKeys.add(name);
  }

  for (const [schemaName, schemaObj] of Object.entries<any>(schemas)) {
    if (schemaObj.type === "object" || schemaObj.properties) {
      const fields: Field[] = [];
      const requiredList = schemaObj.required || [];
      const props = schemaObj.properties || {};
      
      for (const [propName, propDef] of Object.entries<any>(props)) {
        let ref = propDef.$ref ? propDef.$ref.split("/").pop() : (propDef.items?.$ref ? propDef.items.$ref.split("/").pop() : undefined);
        
        let isEnum = !!propDef.enum || (ref && enumKeys.has(ref));
        if (isEnum && ref && enumKeys.has(ref)) {
           // It's an enum schema reference. Map it to basic string.
           ref = undefined;
        }

        fields.push({
          name: propName,
          type: propDef.type || "string",
          required: requiredList.includes(propName),
          isArray: propDef.type === "array",
          isDate: propDef.format === "date-time",
          isObject: propDef.$ref || (propDef.type === "object"),
          isEnum,
          ref
        });
      }
      
      entitiesMap.set(schemaName, {
        name: schemaName,
        fields,
        endpoints: []
      });
    }
  }
  
  // 2. Extract Endpoints and append them to their responsible Entity
  const paths = api.paths || {};
  for (const [pathUrl, pathMethods] of Object.entries<any>(paths)) {
    for (const [method, operation] of Object.entries<any>(pathMethods)) {
      if (typeof operation !== "object") continue;
      
      // Attempt to group by tags or derive from path
      let entityName = "General";
      if (operation.tags && operation.tags.length > 0) {
        entityName = pascalCase(operation.tags[0]);
      } else {
        const pathParts = pathUrl.split("/").filter(Boolean);
        if (pathParts.length > 0) entityName = pascalCase(pathParts[0]);
      }
      
      if (!entitiesMap.has(entityName)) {
        entitiesMap.set(entityName, { name: entityName, fields: [], endpoints: [] });
      }
      
      const endpointName = operation.operationId || camelCase(`${method}_${pathUrl.replace(/[\W_]+/g, "_")}`);
      
      const reqFields: Field[] = [];
      const resFields: Field[] = [];
      
      // Map request -> input references
      const contentReq = operation.requestBody?.content?.["application/json"];
      if (contentReq?.schema?.$ref) {
         reqFields.push({ name: "body", type: "object", required: true, ref: contentReq.schema.$ref.split("/").pop() });
      } else if (contentReq?.schema?.type === "array" && contentReq.schema.items?.$ref) {
         reqFields.push({ name: "body", type: "array", required: true, isArray: true, ref: contentReq.schema.items.$ref.split("/").pop() });
      }
      
      // Map response -> output references
      const res200 = (operation.responses && (operation.responses["200"] || operation.responses["201"])) || {};
      const contentRes = res200.content?.["application/json"];
      if (contentRes?.schema?.$ref) {
         resFields.push({ name: "data", type: "object", required: true, ref: contentRes.schema.$ref.split("/").pop() });
      } else if (contentRes?.schema?.type === "array" && contentRes.schema.items?.$ref) {
         resFields.push({ name: "data", type: "array", required: true, isArray: true, ref: contentRes.schema.items.$ref.split("/").pop() });
      }
      
      const endpoint: Endpoint = {
        name: endpointName,
        method: method.toUpperCase() as any,
        path: pathUrl,
        requestFields: reqFields.length ? reqFields : undefined,
        responseFields: resFields
      };
      
      entitiesMap.get(entityName)!.endpoints.push(endpoint);
    }
  }

  return {
    entities: Array.from(entitiesMap.values())
  };
}
