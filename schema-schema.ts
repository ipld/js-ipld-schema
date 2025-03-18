import { CID } from 'multiformats/cid'

export type KindBool = boolean
export type KindString = string
export type KindBytes = Uint8Array
export type KindInt = number | bigint
export type KindFloat = number
export type KindNull = null
export type KindMap = {}
export type KindList = []
export type KindLink = CID
export type KindUnion = {}
export type KindStruct = {}
export type KindEnum = {}

export namespace KindBool {
  export function isKindBool(value: any): value is KindBool {
    return typeof value === 'boolean'
  }
}

export namespace KindString {
  export function isKindString(value: any): value is KindString {
    return typeof value === 'string'
  }
}

export namespace KindBytes {
  export function isKindBytes(value: any): value is KindBytes {
    return value instanceof Uint8Array
  }
}

export namespace KindInt {
  export function isKindInt(value: any): value is KindInt {
    return (typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value)) || (typeof value === 'bigint')
  }
}

export namespace KindFloat {
  export function isKindFloat(value: any): value is KindFloat {
    return typeof value === 'number' && Number.isFinite(value)
  }
}

export namespace KindNull {
  export function isKindNull(value: any): value is KindNull {
    return value === null
  }
}

export namespace KindMap {
  export function isKindMap(value: any): value is KindMap {
    return value !== null && typeof value === 'object' && value.asCID !== value && !Array.isArray(value) && !(value instanceof Uint8Array)
  }
}

export namespace KindList {
  export function isKindList(value: any): value is KindList {
    return Array.isArray(value)
  }
}

export namespace KindLink {
  export function isKindLink(value: any): value is KindLink {
    return value !== null && typeof value === 'object' && value.asCID === value
  }
}

export type TypeDefn =
    { bool: TypeDefnBool }
  | { string: TypeDefnString }
  | { bytes: TypeDefnBytes }
  | { int: TypeDefnInt }
  | { float: TypeDefnFloat }
  | { map: TypeDefnMap }
  | { list: TypeDefnList }
  | { link: TypeDefnLink }
  | { union: TypeDefnUnion }
  | { struct: TypeDefnStruct }
  | { enum: TypeDefnEnum }
  | { unit: TypeDefnUnit }
  | { any: TypeDefnAny }
  | { copy: TypeDefnCopy }
  | { null: TypeDefnNull } // TODO: not in schema-schema, what do?

export type TypeDefnBool = {}
export type TypeDefnString = {
  representation?: StringRepresentation // TODO: not in schema-schema
}
export type StringRepresentation = { advanced: AdvancedDataLayoutName } // TODO: does it need a {string}
export type TypeDefnBytes = {
  representation?: BytesRepresentation // TODO: not optional in schema-schema
}
export type BytesRepresentation =
    { bytes: BytesRepresentation_Bytes } // TODO: does this make sense? or is default good enough?
  | { advanced: AdvancedDataLayoutName }
export type BytesRepresentation_Bytes = {}
export type TypeDefnInt = {}
export type TypeDefnFloat = {}
export type TypeDefnNull = {} // TODO: not in schema-schema, what do?
export type TypeDefnMap = {
  keyType: TypeName
  valueType: TypeNameOrInlineDefn
  valueNullable?: KindBool
  representation?: MapRepresentation
}
export type MapRepresentation =
    { map: MapRepresentation_Map } // TODO: not in schema-schema - put it there
  | { stringpairs: MapRepresentation_StringPairs }
  | { listpairs: MapRepresentation_ListPairs }
  | { advanced: AdvancedDataLayoutName }
export type MapRepresentation_Map = {}
export type MapRepresentation_StringPairs = {
  innerDelim: KindString
  entryDelim: KindString
}
export type MapRepresentation_ListPairs = {}
export type TypeDefnList = {
  valueType: TypeNameOrInlineDefn
  valueNullable?: KindBool
  representation?: ListRepresentation
}
export type ListRepresentation =
    { list: ListRepresentation_List } // TODO: not in schema-schema - put it there?
  | { advanced: AdvancedDataLayoutName }
export type ListRepresentation_List = {}
export type TypeDefnLink = {
  expectedType?: KindString
}
export type TypeDefnUnion = {
  members: UnionMember[]
  representation: UnionRepresentation
}
export type UnionMember =
    TypeName
  | UnionMemberInlineDefn
export type UnionMemberInlineDefn =
    { link: TypeDefnLink }
export type UnionRepresentation =
    { kinded: UnionRepresentation_Kinded }
  | { keyed: UnionRepresentation_Keyed }
  | { envelope: UnionRepresentation_Envelope }
  | { inline: UnionRepresentation_Inline }
  | { stringprefix: UnionRepresentation_StringPrefix }
  | { bytesprefix: UnionRepresentation_BytesPrefix }

// TODO: schema-schema has UnionMember instead of TypeName here but we need a name for the map
export type UnionRepresentation_Kinded = { [k in RepresentationKind]?: TypeName }
export type UnionRepresentation_Keyed = { [k in KindString]: UnionMember }
export type UnionRepresentation_Envelope = {
  discriminantKey: KindString
  contentKey: KindString
  discriminantTable: { [ k in KindString]: UnionMember }
}
export type UnionRepresentation_Inline = {
  discriminantKey: KindString
  discriminantTable: { [ k in HexString]: TypeName }
}
export type HexString = string
export type UnionRepresentation_StringPrefix = { 
  prefixes: { [ k in KindString]: TypeName }
}
export type UnionRepresentation_BytesPrefix = { 
  prefixes: { [ k in KindString]: TypeName }
}
export type TypeDefnStruct = {
  fields: { [ k in FieldName]: StructField }
  representation?: StructRepresentation
  annotations?: StructAnnotations
  comments?: StructComments
}
export type FieldName = string
export type StructField = {
  type: TypeNameOrInlineDefn
  optional?: KindBool
  nullable?: KindBool
}
export type TypeNameOrInlineDefn =
    TypeName
  | InlineDefn
export type InlineDefn =
    { map: TypeDefnMap }
  | { list: TypeDefnList }
  | { link: TypeDefnLink }
export type StructRepresentation =
    { map: StructRepresentation_Map }
  | { tuple: StructRepresentation_Tuple }
  | { stringpairs: StructRepresentation_StringPairs }
  | { stringjoin: StructRepresentation_StringJoin }
  | { listpairs: StructRepresentation_ListPairs }
  | { advanced: AdvancedDataLayoutName } // TODO: not on schema-schema
export type StructRepresentation_Map = {
  fields?: { [ k in FieldName]: StructRepresentation_Map_FieldDetails }
}
export type StructRepresentation_Map_FieldDetails = {
  rename?: KindString
  implicit?: AnyScalar
}
export type StructRepresentation_Tuple = {
  fieldOrder?: FieldName[]
}
export type StructRepresentation_StringPairs = {
  innerDelim: KindString
  entryDelim: KindString
}
export type StructRepresentation_StringJoin = {
  join: KindString
  fieldOrder?: FieldName[]
}
export type StructRepresentation_ListPairs = {}
export type StructAnnotations = {
  type?: { [ k in KindString]: KindString }[]
  fields?: { [ k in FieldName]: { [ k in KindString]: KindString }[] }
}
export type StructComments = {
  type?: {
    precomments: KindString,
    linecomment: KindString
  }
  fields?: {
    [ k in FieldName]: {
      precomments: KindString,
      linecomment: KindString
    }
  }
}
export type TypeDefnEnum = {
  members: EnumMember[]
  representation: EnumRepresentation
}
export type EnumMember = string
export type EnumRepresentation =
    { string: EnumRepresentation_String }
  | { int: EnumRepresentation_Int }
export type EnumRepresentation_String = { [ k in EnumMember]: KindString }
export type EnumRepresentation_Int = { [ k in EnumMember]: KindInt }
export type TypeDefnCopy = {
  fromType: TypeName
}
export type TypeDefnUnit = {
  representation: UnitRepresentation
}
export type UnitRepresentation =
    "null"
  | "true"
  | "false"
  | "emptymap"
export type TypeDefnAny = {}
export type TypeName = string
export type Schema = {
  types: { [ k in TypeName]: TypeDefn }
  advanced?: AdvancedDataLayoutMap
}
export type AdvancedDataLayoutName = string
export type AdvancedDataLayoutMap = { [ k in AdvancedDataLayoutName ]: AdvancedDataLayout }
export type AdvancedDataLayout = {}
export type TypeKind =
    KindBool
  | KindString
  | KindBytes
  | KindInt
  | KindFloat
  | KindMap
  | KindList
  | KindLink
  | KindUnion
  | KindStruct
  | KindEnum
export type RepresentationKind =
    "bool"
  | "string"
  | "bytes"
  | "int"
  | "float"
  | "null" // TODO: not in schema-schema, wot do?
  | "map"
  | "list"
  | "link"
export type AnyScalar =
    KindBool
  | KindString
  | KindBytes
  | KindInt
  | KindFloat
