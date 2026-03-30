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
 * @param {TypedOptions} [options]
 * @returns {{ toTyped: TypeTransformerFunction, toRepresentation: TypeTransformerFunction }}
 */
export function create(schema: Schema, root: string, options?: TypedOptions): {
    toTyped: TypeTransformerFunction;
    toRepresentation: TypeTransformerFunction;
};
export class Builder {
    /**
     * @param {Schema} schema
     * @param {TypedOptions} [options]
     */
    constructor(schema: Schema, options?: TypedOptions);
    schema: {
        types: {
            [x: string]: import("../schema-schema.js").TypeDefn;
        } & {
            [x: string]: import("../schema-schema.js").TypeDefn;
        };
    };
    /** @type {Record<string, string>} */
    typeTransformers: Record<string, string>;
    /** @type {Record<string, string>} */
    reprTransformers: Record<string, string>;
    /** @type {CustomTransforms} */
    customTransforms: CustomTransforms;
    dumpTypeTransformers(): string;
    /**
     * @param {TypeName} typeName
     * @param {TypeDefn} [typeDef]
     * @returns {void}
     */
    addType(typeName: TypeName, typeDef?: TypeDefn): void;
}
export type EnumMember = import("../schema-schema.js").EnumMember;
export type KindInt = import("../schema-schema.js").KindInt;
export type KindString = import("../schema-schema.js").KindString;
export type AnyScalar = import("../schema-schema.js").AnyScalar;
export type Schema = import("../schema-schema.js").Schema;
export type TypeDefn = import("../schema-schema.js").TypeDefn;
export type InlineDefn = import("../schema-schema.js").InlineDefn;
export type TypeName = import("../schema-schema.js").TypeName;
export type TypeNameOrInlineDefn = import("../schema-schema.js").TypeNameOrInlineDefn;
export type TypeTransformerFunction = (obj: any) => undefined | any;
export type CustomTransform = {
    toTyped: string | ((value: any) => any | undefined);
    toRepresentation?: string | ((value: any) => any | undefined);
};
export type CustomTransforms = {
    [typeName: string]: CustomTransform;
};
export type TypedOptions = {
    customTransforms?: CustomTransforms;
};
//# sourceMappingURL=typed.d.ts.map