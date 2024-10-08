/**
 * @param {string} name
 * @returns {string}
 */
export function safeReference(name: string): string;
/**
 * @param {string} name
 * @returns {string}
 */
export function safeFieldReference(name: string): string;
/**
 * @param {Schema} schema
 * @param {string} root
 * @returns {{ toTyped: TypeTransformerFunction, toRepresentation: TypeTransformerFunction }}
 */
export function create(schema: Schema, root: string): {
    toTyped: TypeTransformerFunction;
    toRepresentation: TypeTransformerFunction;
};
export class Builder {
    /**
     * @param {Schema} schema
     */
    constructor(schema: Schema);
    schema: {
        types: {
            [x: string]: import("../schema-schema").TypeDefn;
        } & {
            [x: string]: import("../schema-schema").TypeDefn;
        };
    };
    /** @type {Record<string, string>} */
    typeTransformers: Record<string, string>;
    /** @type {Record<string, string>} */
    reprTransformers: Record<string, string>;
    dumpTypeTransformers(): string;
    /**
     * @param {TypeName} typeName
     * @param {TypeDefn} [typeDef]
     * @returns {void}
     */
    addType(typeName: TypeName, typeDef?: import("../schema-schema").TypeDefn | undefined): void;
}
export type EnumMember = import("../schema-schema").EnumMember;
export type KindInt = import("../schema-schema").KindInt;
export type KindString = import("../schema-schema").KindString;
export type AnyScalar = import("../schema-schema").AnyScalar;
export type Schema = import("../schema-schema").Schema;
export type TypeDefn = import("../schema-schema").TypeDefn;
export type InlineDefn = import("../schema-schema").InlineDefn;
export type TypeName = import("../schema-schema").TypeName;
export type TypeNameOrInlineDefn = import("../schema-schema").TypeNameOrInlineDefn;
export type TypeTransformerFunction = (obj: any) => undefined | any;
//# sourceMappingURL=typed.d.ts.map