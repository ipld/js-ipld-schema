#!/usr/bin/env node
/**
 * @param {string[]} files
 * @param {{tabs?:boolean, 'include-comments'?:boolean, 'include-annotations'?:boolean}} options
 * @returns
 */
export function toJSON(files: string[], options: {
    tabs?: boolean;
    "include-comments"?: boolean;
    "include-annotations"?: boolean;
}): Promise<void>;
export type Schema = import("../schema-schema").Schema;
//# sourceMappingURL=to-json.d.ts.map