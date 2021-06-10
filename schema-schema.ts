export type KindBool = boolean
export type KindString = string
export type KindBytes = Uint8Array
export type KindInt = number
export type KindFloat = number
export type KindNull = null
export type KindMap = {}
export type KindList = []
export type KindLink = {}
export type KindUnion = {}
export type KindStruct = {}
export type KindEnum = {}

export type TypeBool = {}
export type TypeString = {}
export type TypeBytes = {
  representation?: BytesRepresentation
}
export type BytesRepresentation =
    { bytes: BytesRepresentation_Bytes }
  | { advanced: AdvancedDataLayoutName }
export type BytesRepresentation_Bytes = {}
export type TypeInt = {}
export type TypeFloat = {}
export type TypeMap = {
  keyType: TypeName
  valueType?: TypeTerm
  valueNullable?: KindBool
  representation?: MapRepresentation
}
export type MapRepresentation =
    { map: MapRepresentation_Map }
  | { stringpairs: MapRepresentation_StringPairs }
  | { listpairs: MapRepresentation_ListPairs }
  | { advanced: AdvancedDataLayoutName }

export type MapRepresentation_Map = {}
export type MapRepresentation_StringPairs = {
  innerDelim: KindString
  entryDelim: KindString
}
export type MapRepresentation_ListPairs = {}
export type TypeList = {
  valueType: TypeTerm
  valueNullable?: KindBool
  representation?: ListRepresentation
}
export type ListRepresentation =
    { list: ListRepresentation_List }
  | { advanced: AdvancedDataLayoutName }
export type ListRepresentation_List = {}
export type TypeLink = {
  expectedType?: KindString
}
export type TypeUnion = {
  representation?: UnionRepresentation
}
export type UnionRepresentation =
    { kinded: UnionRepresentation_Kinded }
  | { keyed: UnionRepresentation_Keyed }
  | { envelope: UnionRepresentation_Envelope }
  | { inline: UnionRepresentation_Inline }
  | { byteprefix: UnionRepresentation_BytePrefix }
export type UnionRepresentation_Kinded = Record<RepresentationKind, TypeName>
export type UnionRepresentation_Keyed = Record<KindString, TypeName>
export type UnionRepresentation_Envelope = {
  discriminantKey: KindString
  contentKey: KindString
  discriminantTable: Record<KindString, TypeName>
}
export type UnionRepresentation_Inline = {
  discriminantKey: KindString
  discriminantTable: Record<KindString, TypeName>
}
export type UnionRepresentation_BytePrefix = {
  discriminantTable: Record<TypeName, KindInt>
}

export type TypeStruct = {
  fields: Record<FieldName, StructField>
  representation?: StructRepresentation
}
export type FieldName = string
export type StructField = {
  type: TypeTerm
  optional?: KindBool
  nullable?: KindBool
}
export type TypeTerm =
    TypeName
  | InlineDefn
export type InlineDefn =
    { map: TypeMap }
  | { list: TypeList }
export type StructRepresentation =
    { map: StructRepresentation_Map }
  | { tuple: StructRepresentation_Tuple }
  | { stringpairs: StructRepresentation_StringPairs }
  | { stringjoin: StructRepresentation_StringJoin }
  | { listpairs: StructRepresentation_ListPairs }
export type StructRepresentation_Map = {
  fields?: Record<FieldName, StructRepresentation_Map_FieldDetails>
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

    
export type TypeEnum = {
  members: Record<EnumValue, KindNull>
  representation: EnumRepresentation
}
export type EnumValue = string
export type EnumRepresentation =
    { string: EnumRepresentation_String }
  | { int: EnumRepresentation_Int }
export type EnumRepresentation_String = Record<EnumValue, KindString>
export type EnumRepresentation_Int = Record<EnumValue, KindInt>
export type TypeCopy = {
  fromType: TypeName
}

export type TypeName = string
export type SchemaMap = { TypeName: Type }
export type AdvancedDataLayoutName = string
export type Schema = {
  types: SchemaMap
}
export type Type =
    TypeBool
  | TypeString
  | TypeBytes
  | TypeInt
  | TypeFloat
  | TypeMap
  | TypeList
  | TypeLink
  | TypeUnion
  | TypeStruct
  | TypeEnum
  | TypeCopy

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
  | "map"
  | "list"
  | "link"

export type AnyScalar =
    KindBool
  | KindString
  | KindBytes
  | KindInt
  | KindFloat
