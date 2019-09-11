/** IPLD Schema PEG.js grammar **/

// Utility functions
{
  function defaultStructRepresentation () {
    return { map: {} }
  }

  function extend (o1, o2) {
    // we only use a 2-argument form and this also lets us supply `extend` as an argument
    // to Array#reduce and not worry about the additional reducer arguments
    return Object.assign(o1, o2)
  }

  // some values need coercion into proper forms, `default` being one of them
  function coerceValue (value) {
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
    // this isn't needed yet, just trying the concept
    if (parseInt(value, 10) == value) {
      return parseInt(value, 10)
    }
    return value
  }
}

Root = types:TypeDef+ { return { schema: types.reduce(extend, {}) } }

TypeDef = _ 'type' _ name:TypeName _ definition:Definition _ {
  return { [name]: definition }
}

Definition
  = descriptor:MapDescriptor { return descriptor } // "map" assumed if goes straight to a {}
  / descriptor:ListDescriptor { return descriptor } // "list" assumed if goes straight to a []
  / EnumKind _ descriptor:EnumDescriptor { return descriptor }
  / UnionKind _ descriptor:UnionDescriptor { return descriptor }
  / StructKind _ descriptor:StructDescriptor { return descriptor }
  / kind:SimpleKind { return kind }

MapKind = "map"
ListKind = "list"
EnumKind = "enum"
UnionKind = "union"
StructKind = "struct"
SimpleKind = kind:BaseType { return { kind } }

ListDescriptor = "[" _ fields:TypeDescriptor _ "]" {
  return extend({ kind: 'list' }, fields)
}

TypeDescriptor = options:TypeOption* _ valueType:(TypeName / ListDescriptor) {
  return options.reduce(extend, { valueType })
}

EnumDescriptor = "{" values:EnumValue+ "}" {
  return {
    kind: 'enum',
    members: values.reduce(extend, {})
  }
}

EnumValue = _ "|" _ name:QuotedString _ { return { [name]: null } }

UnionDescriptor = "{" values:UnionValue+ "}" _ representation:UnionRepresentation {
  let fields = values.reduce(extend, {})
  let representationType = representation.type
  switch (representationType) {
    case 'keyed':
    case 'kinded':
      representation = { [representationType]: fields }
      break
    case 'inline': // TODO: inline unions have to contain certain types that can be inlined, structs, maps?
    case 'envelope':
      representation = { [representationType]: extend(representation, { discriminantTable: fields }) }
      break
    default:
      throw new Error('Unsupported')
  }
  delete representation[representationType].type
  return extend({ kind: 'union' }, { representation })
}

UnionValue
  = _ "|" _ type:TypeName _ name:QuotedString _ { return { [name]: type } } // keyed and envelope
  / _ "|" _ name:TypeName _ kind:BaseType _ { return { [kind]: name } } // kinded

MapDescriptor = "{" _ keyType:TypeName _ ":" _ valueType:TypeDescriptor _ "}" _ representation:MapRepresentation? {
  let representationType = (representation && representation.type)
  if (representationType) {
    representation = { [representationType]: representation || {} }
    delete representation[representationType].type
  }
  return Object.assign({ kind: 'map', keyType }, valueType, representation ? { representation } : null)
}

StructDescriptor = "{" values:StructValue* "}" _ representation:StructRepresentation? {
  let fields = values.reduce(extend, {})
  // field representation options can come in from parens following field definitions, we need
  // to lift them out into the 'representation' object
  const representationFields = Object.entries(fields).reduce((p, fieldEntry) => {
    if (fieldEntry[1].representationOptions) {
      p[fieldEntry[0]] = fieldEntry[1].representationOptions
      delete fieldEntry[1].representationOptions
    }
    return p
  }, {})
  let representationType = (representation && representation.type)
  if (representationType) {
    // restructure from { type: 'foo', bar: 'baz' } to { foo: { bar: 'baz' } }
    representation = { [representationType]: representation || {} }
    delete representation[representationType].type
    /* auto-fill fieldOrder? if (representationType === 'tuple' && !representation.tuple.fieldOrder) {
      representation.tuple.fieldOrder = Object.keys(fields)
    } */
  }
  // handle inline field representation data
  if (Object.keys(representationFields).length) {
    if (!representation) {
      representation = defaultStructRepresentation()
    }
    if (!representation.map) {
      throw new Error('field modifiers only valid for struct map representation')
    }
    representation.map.fields = representationFields
  }
  return extend({ kind: 'struct', fields }, { representation: representation || defaultStructRepresentation() })
}

// TODO: break these by newline || "}" (non-greedy match)
StructValue = _ key:StringName _ options:StructFieldOption* _ type:StructType _ representationOptions:StructFieldRepresentationOptions? _ {
  return { [key]: options.reduce(extend, extend({ type }, representationOptions ? { representationOptions } : null)) }
}

StructFieldOption
  = "optional" { return { optional: true } }
  / "nullable" { return { nullable: true } }

TypeOption
  = "optional" { return { optional: true } }
  / "nullable" { return { valueNullable: true } }

StructType
  = type:StringName { return type }
  / MapDescriptor
  / ListDescriptor

StructFieldRepresentationOptions = "(" _ options:StructFieldRepresentationOption* _ ")" {
  return options.reduce(extend, {})
}

StructFieldRepresentationOption
  = "implicit" _ implicit:QuotedString _ { return { implicit: coerceValue(implicit) } }
  / "rename" _ rename:QuotedString _ { return { rename } }

UnionRepresentation = "representation" _ representation:UnionRepresentationType _ {
  return representation
}

MapRepresentation = "representation" _ representation:MapRepresentationType _ {
  return representation
}

StructRepresentation = "representation" _ representation:StructRepresentationType _ {
  return representation
}

UnionRepresentationType
  = "keyed" { return { type: 'keyed' } }
  / "kinded" { return { type: 'kinded' } }
  / "inline" _ descriptor:UnionInlineKeyDefinition { return descriptor }
  / "envelope" _ descriptor:UnionEnvelopeKeyDefinition { return descriptor }

UnionInlineKeyDefinition = "{" _ ("discriminantKey" / "discriminantKey") _ discriminantKey:QuotedString _ "}" {
  return { type: 'inline', discriminantKey }
}

// TODO: break these by newline || "}" (non-greedy match)
UnionEnvelopeKeyDefinition = "{" _ ("discriminantKey" / "discriminantKey") _ discriminantKey:QuotedString _ "contentKey" _ contentKey:QuotedString _ "}" {
  return { type: 'envelope', discriminantKey, contentKey }
}

MapRepresentationType
  = "map" { return { type: 'map' } }
  / "listpairs" { return { type: 'listpairs' } }
  / "stringpairs" _ representation:MapStringpairsRepresentation { return representation }

// TODO: break these by newline || "}" (non-greedy match)
MapStringpairsRepresentation = "{" _ options:MapStringpairsRepresentationOptions* _ "}" {
  let representation = extend({ type: 'stringpairs' }, options.reduce(extend, {}))
  if (!representation.innerDelim || !representation.entryDelim) {
    throw new Error('"stringpairs" representation requires both "innerDelim" and "entryDelim" options')
  }
  return representation
}

MapStringpairsRepresentationOptions
  = _ "innerDelim" _ innerDelim:QuotedString { return { innerDelim } }
  / _ "entryDelim" _ entryDelim:QuotedString { return { entryDelim } }

StructRepresentationType
  = "map" { return { type: 'map' } }
  / "tuple" _ fieldOrder:StructTupleRepresentationFields? { return extend({ type: 'tuple' }, fieldOrder ? { fieldOrder } : null) }
  / "stringjoin" _ fields:StructStringjoinRepresentationFields { return extend({ type: 'stringjoin' }, fields ) }
  / "stringpairs" _ representation:MapStringpairsRepresentation { return representation }
  / "listpairs" { return { type: 'listpairs' } }

// TODO: break these by newline || "}" (non-greedy match)
StructMapRepresentationFields = "{" _ "}"

StructMapRepresentationField = "field" _ field:StringName _ isImplicit:"implicit" _ implicitValue:QuotedString _ {
  return { [field]: extend({}, isImplicit ? { implicit: coerceValue(implicitValue) } : null) }
}

StructTupleRepresentationFields = "{" _ fieldOrder:StructTupleRepresentationFieldOrder?  _ "}" {
  return fieldOrder
}

StructTupleRepresentationFieldOrder = "fieldOrder" _ fieldOrder:QuotedStringArray {
  return fieldOrder
}

// TODO: break these by newline || "}" (non-greedy match)
StructStringjoinRepresentationFields = "{" fields:StructStringjoinRepresentationField+ "}" {
  fields = fields.reduce(extend, {})
  if (!fields.join) {
    throw new Error('stringjoin representation needs a "join" specifier')
  }
  return fields
}

StructStringjoinRepresentationField
  = StructStringjoinRepresentationField_Join
  / StructStringjoinRepresentationField_FieldOrder

StructStringjoinRepresentationField_Join = _ "join" _ join:QuotedString _ {
  return { join }
}

StructStringjoinRepresentationField_FieldOrder = _ "fieldOrder" _ fieldOrder:QuotedStringArray _ {
  return { fieldOrder }
}

QuotedStringArray = "[" _ firstElement:QuotedString? subsequentElements:(_ "," _ s:QuotedString _ { return s })* _ "]" {
  if (!firstElement) {
    return []
  }
  if (!subsequentElements) {
    return [ firstElement ]
  }
  return [ firstElement ].concat(subsequentElements)
}

TypeName = first:[A-Z] remainder:[a-zA-Z0-9_]* { return first + remainder.join('') }

QuotedString = "\"" chars:[^"]+ "\"" { return chars.join('') }

StringName = chars:[a-zA-Z0-9_]+ { return chars.join('') }

BaseType
  = "bool"
	/ "string"
	/ "bytes"
	/ "int"
	/ "float"
	/ "map"
	/ "list"
	/ "link"

__
  = whitespace+
  / comment+

_ = __*

whitespace = [ \t\n\r]

comment = "#" [^\r\n]*[\r\n]? { return }

newline = "\r"? "\n"
