/**
 * @typedef {import('../../schema-schema').Schema} Schema
 * @typedef {import('../../schema-schema').FieldName} FieldName
 */
/**
 * @param {Schema} schema
 * @param {Record<string, string>} [options]
 * @returns {string}
 */
export function generateGo(schema: Schema, options?: Record<string, string> | undefined): string;
export type Schema = import("../../schema-schema").Schema;
export type FieldName = import("../../schema-schema").FieldName;
//# sourceMappingURL=go.d.ts.map