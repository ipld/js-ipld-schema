/**
 * @typedef {import('../../schema-schema.js').Schema} Schema
 * @typedef {import('../../schema-schema.js').FieldName} FieldName
 */
/**
 * @param {Schema} schema
 * @param {Record<string, string>} [options]
 * @returns {string}
 */
export function generateGo(schema: Schema, options?: Record<string, string>): string;
export type Schema = import("../../schema-schema.js").Schema;
export type FieldName = import("../../schema-schema.js").FieldName;
//# sourceMappingURL=go.d.ts.map