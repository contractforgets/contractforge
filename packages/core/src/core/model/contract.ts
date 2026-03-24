export interface ContractModel {
  entities: Entity[];
}

export interface Entity {
  name: string;
  fields: Field[];
  endpoints: Endpoint[];
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
  isArray?: boolean;
  isDate?: boolean;
  isObject?: boolean;
  isEnum?: boolean;
  ref?: string;
}

export interface Endpoint {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  requestFields?: Field[];
  responseFields: Field[];
}
