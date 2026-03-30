#!/usr/bin/env node
/**
 * @typedef {import('../schema-schema.js').Schema} Schema
 */
/**
 * @param {string[]} files
 * @param {{cjs:boolean}} _options
 * @returns
 */
export function toTSDefs(files: string[], _options: {
    cjs: boolean;
}): Promise<undefined>;
export type Schema = import("../schema-schema.js").Schema;
//# sourceMappingURL=to-tsdefs.d.ts.map