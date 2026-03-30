/**
 * @param {Schema} schema
 * @param {string} indent
 * @param {Highlighter} [highlighter]
 * @returns {string}
 */
export function toDSL(schema: Schema, indent?: string, highlighter?: Highlighter): string;
export type Schema = import("../schema-schema.js").Schema;
export type TypeName = import("../schema-schema.js").TypeName;
export type TypeDefn = import("../schema-schema.js").TypeDefn;
export type TypeDefnCopy = import("../schema-schema.js").TypeDefnCopy;
export type TypeDefnLink = import("../schema-schema.js").TypeDefnLink;
export type TypeDefnString = import("../schema-schema.js").TypeDefnString;
export type TypeDefnBytes = import("../schema-schema.js").TypeDefnBytes;
export type TypeDefnStruct = import("../schema-schema.js").TypeDefnStruct;
export type TypeDefnMap = import("../schema-schema.js").TypeDefnMap;
export type TypeDefnList = import("../schema-schema.js").TypeDefnList;
export type TypeDefnUnion = import("../schema-schema.js").TypeDefnUnion;
export type TypeDefnEnum = import("../schema-schema.js").TypeDefnEnum;
export type MapRepresentation_StringPairs = import("../schema-schema.js").MapRepresentation_StringPairs;
export type StructRepresentation_StringPairs = import("../schema-schema.js").StructRepresentation_StringPairs;
export type UnionRepresentation_StringPrefix = import("../schema-schema.js").UnionRepresentation_StringPrefix;
export type UnionRepresentation_BytesPrefix = import("../schema-schema.js").UnionRepresentation_BytesPrefix;
export type UnionMemberInlineDefn = import("../schema-schema.js").UnionMemberInlineDefn;
export type FieldName = import("../schema-schema.js").FieldName;
export type hltrans = (s: string) => string;
export type Highlighter = {
    keyword: hltrans;
    builtin: hltrans;
    operator: hltrans;
    number: hltrans;
    string: hltrans;
    className: hltrans;
    punctuation: hltrans;
};
//# sourceMappingURL=to-dsl.d.ts.map