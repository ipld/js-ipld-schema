export declare type KindBool = boolean;
export declare type KindString = string;
export declare type KindBytes = Uint8Array;
export declare type KindInt = number;
export declare type KindFloat = number;
export declare type KindNull = null;
export declare type KindMap = {};
export declare type KindList = [];
export declare type KindLink = {};
export declare type KindUnion = {};
export declare type KindStruct = {};
export declare type KindEnum = {};
export declare type TypeDefn = {
    bool: TypeDefnBool;
} | {
    string: TypeDefnString;
} | {
    bytes: TypeDefnBytes;
} | {
    int: TypeDefnInt;
} | {
    float: TypeDefnFloat;
} | {
    map: TypeDefnMap;
} | {
    list: TypeDefnList;
} | {
    link: TypeDefnLink;
} | {
    union: TypeDefnUnion;
} | {
    struct: TypeDefnStruct;
} | {
    enum: TypeDefnEnum;
} | {
    unit: TypeDefnUnit;
} | {
    any: TypeDefnAny;
} | {
    copy: TypeDefnCopy;
} | {
    null: TypeDefnNull;
};
export declare type TypeDefnBool = {};
export declare type TypeDefnString = {
    representation?: StringRepresentation;
};
export declare type StringRepresentation = {
    advanced: AdvancedDataLayoutName;
};
export declare type TypeDefnBytes = {
    representation?: BytesRepresentation;
};
export declare type BytesRepresentation = {
    bytes: BytesRepresentation_Bytes;
} | {
    advanced: AdvancedDataLayoutName;
};
export declare type BytesRepresentation_Bytes = {};
export declare type TypeDefnInt = {};
export declare type TypeDefnFloat = {};
export declare type TypeDefnNull = {};
export declare type TypeDefnMap = {
    keyType: TypeName;
    valueType: TypeNameOrInlineDefn;
    valueNullable?: KindBool;
    representation?: MapRepresentation;
};
export declare type MapRepresentation = {
    map: MapRepresentation_Map;
} | {
    stringpairs: MapRepresentation_StringPairs;
} | {
    listpairs: MapRepresentation_ListPairs;
} | {
    advanced: AdvancedDataLayoutName;
};
export declare type MapRepresentation_Map = {};
export declare type MapRepresentation_StringPairs = {
    innerDelim: KindString;
    entryDelim: KindString;
};
export declare type MapRepresentation_ListPairs = {};
export declare type TypeDefnList = {
    valueType: TypeNameOrInlineDefn;
    valueNullable?: KindBool;
    representation?: ListRepresentation;
};
export declare type ListRepresentation = {
    list: ListRepresentation_List;
} | {
    advanced: AdvancedDataLayoutName;
};
export declare type ListRepresentation_List = {};
export declare type TypeDefnLink = {
    expectedType?: KindString;
};
export declare type TypeDefnUnion = {
    members: UnionMember[];
    representation: UnionRepresentation;
};
export declare type UnionMember = TypeName | UnionMemberInlineDefn;
export declare type UnionMemberInlineDefn = {
    link: TypeDefnLink;
};
export declare type UnionRepresentation = {
    kinded: UnionRepresentation_Kinded;
} | {
    keyed: UnionRepresentation_Keyed;
} | {
    envelope: UnionRepresentation_Envelope;
} | {
    inline: UnionRepresentation_Inline;
} | {
    stringprefix: UnionRepresentation_StringPrefix;
} | {
    bytesprefix: UnionRepresentation_BytesPrefix;
};
export declare type UnionRepresentation_Kinded = {
    [k in RepresentationKind]?: TypeName;
};
export declare type UnionRepresentation_Keyed = {
    [k in KindString]: UnionMember;
};
export declare type UnionRepresentation_Envelope = {
    discriminantKey: KindString;
    contentKey: KindString;
    discriminantTable: {
        [k in KindString]: UnionMember;
    };
};
export declare type UnionRepresentation_Inline = {
    discriminantKey: KindString;
    discriminantTable: {
        [k in HexString]: TypeName;
    };
};
export declare type HexString = string;
export declare type UnionRepresentation_StringPrefix = {
    [k in KindString]: TypeName;
};
export declare type UnionRepresentation_BytesPrefix = {
    [k in KindString]: TypeName;
};
export declare type TypeDefnStruct = {
    fields: {
        [k in FieldName]: StructField;
    };
    representation?: StructRepresentation;
};
export declare type FieldName = string;
export declare type StructField = {
    type: TypeNameOrInlineDefn;
    optional?: KindBool;
    nullable?: KindBool;
};
export declare type TypeNameOrInlineDefn = TypeName | InlineDefn;
export declare type InlineDefn = {
    map: TypeDefnMap;
} | {
    list: TypeDefnList;
} | {
    link: TypeDefnLink;
};
export declare type StructRepresentation = {
    map: StructRepresentation_Map;
} | {
    tuple: StructRepresentation_Tuple;
} | {
    stringpairs: StructRepresentation_StringPairs;
} | {
    stringjoin: StructRepresentation_StringJoin;
} | {
    listpairs: StructRepresentation_ListPairs;
} | {
    advanced: AdvancedDataLayoutName;
};
export declare type StructRepresentation_Map = {
    fields?: {
        [k in FieldName]: StructRepresentation_Map_FieldDetails;
    };
};
export declare type StructRepresentation_Map_FieldDetails = {
    rename?: KindString;
    implicit?: AnyScalar;
};
export declare type StructRepresentation_Tuple = {
    fieldOrder?: FieldName[];
};
export declare type StructRepresentation_StringPairs = {
    innerDelim: KindString;
    entryDelim: KindString;
};
export declare type StructRepresentation_StringJoin = {
    join: KindString;
    fieldOrder?: FieldName[];
};
export declare type StructRepresentation_ListPairs = {};
export declare type TypeDefnEnum = {
    members: EnumMember[];
    representation: EnumRepresentation;
};
export declare type EnumMember = string;
export declare type EnumRepresentation = {
    string: EnumRepresentation_String;
} | {
    int: EnumRepresentation_Int;
};
export declare type EnumRepresentation_String = {
    [k in EnumMember]: KindString;
};
export declare type EnumRepresentation_Int = {
    [k in EnumMember]: KindInt;
};
export declare type TypeDefnCopy = {
    fromType: TypeName;
};
export declare type TypeDefnUnit = {
    representation: UnitRepresentation;
};
export declare type UnitRepresentation = "null" | "true" | "false" | "emptymap";
export declare type TypeDefnAny = {};
export declare type TypeName = string;
export declare type Schema = {
    types: {
        [k in TypeName]: TypeDefn;
    };
    advanced?: AdvancedDataLayoutMap;
};
export declare type AdvancedDataLayoutName = string;
export declare type AdvancedDataLayoutMap = {
    [k in AdvancedDataLayoutName]: AdvancedDataLayout;
};
export declare type AdvancedDataLayout = {};
export declare type TypeKind = KindBool | KindString | KindBytes | KindInt | KindFloat | KindMap | KindList | KindLink | KindUnion | KindStruct | KindEnum;
export declare type RepresentationKind = "bool" | "string" | "bytes" | "int" | "float" | "null" | "map" | "list" | "link";
export declare type AnyScalar = KindBool | KindString | KindBytes | KindInt | KindFloat;
//# sourceMappingURL=schema-schema.d.ts.map