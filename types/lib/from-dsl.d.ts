/**
 * @typedef {import('../schema-schema').Schema} Schema
 */
/**
 * @param {string} input
 * @param {Record<string, any>} [options]
 * @returns {Schema}
 */
export function fromDSL(input: string, options?: Record<string, any>): Schema;
export type Schema = import("../schema-schema").Schema;
//# sourceMappingURL=from-dsl.d.ts.map