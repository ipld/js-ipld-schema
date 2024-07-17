#!/usr/bin/env node
/**
 * @typedef {import('../schema-schema').Schema} Schema
 */
/**
 * @param {string[]} files
 * @param {{cjs:boolean}} options
 * @returns
 */
export function toJS(files: string[], options: {
    cjs: boolean;
}): Promise<undefined>;
export type Schema = import("../schema-schema").Schema;
//# sourceMappingURL=to-js.d.ts.map