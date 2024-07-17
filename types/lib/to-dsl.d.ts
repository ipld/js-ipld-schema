/**
 * @param {Schema} schema
 * @param {string} indent
 * @param {Highlighter} [highlighter]
 * @returns {string}
 */
export function toDSL(schema: Schema, indent?: string, highlighter?: Highlighter | undefined): string;
export type Schema = import("../schema-schema").Schema;
export type TypeName = import("../schema-schema").TypeName;
export type TypeDefn = import("../schema-schema").TypeDefn;
export type TypeDefnCopy = import("../schema-schema").TypeDefnCopy;
export type TypeDefnLink = import("../schema-schema").TypeDefnLink;
export type TypeDefnString = import("../schema-schema").TypeDefnString;
export type TypeDefnBytes = import("../schema-schema").TypeDefnBytes;
export type TypeDefnStruct = import("../schema-schema").TypeDefnStruct;
export type TypeDefnMap = import("../schema-schema").TypeDefnMap;
export type TypeDefnList = import("../schema-schema").TypeDefnList;
export type TypeDefnUnion = import("../schema-schema").TypeDefnUnion;
export type TypeDefnEnum = import("../schema-schema").TypeDefnEnum;
export type MapRepresentation_StringPairs = import("../schema-schema").MapRepresentation_StringPairs;
export type StructRepresentation_StringPairs = import("../schema-schema").StructRepresentation_StringPairs;
export type UnionRepresentation_StringPrefix = import("../schema-schema").UnionRepresentation_StringPrefix;
export type UnionRepresentation_BytesPrefix = import("../schema-schema").UnionRepresentation_BytesPrefix;
export type UnionMemberInlineDefn = import("../schema-schema").UnionMemberInlineDefn;
export type FieldName = import("../schema-schema").FieldName;
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