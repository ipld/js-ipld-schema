#!/usr/bin/env node
/**
 * @typedef {import('../schema-schema').Schema} Schema
 */
/**
 * @param {string[]} files
 * @param {{cjs:boolean}} _options
 * @returns
 */
export function toTSDefs(files: string[], _options: {
    cjs: boolean;
}): Promise<undefined>;
export type Schema = import("../schema-schema").Schema;
//# sourceMappingURL=to-tsdefs.d.ts.map