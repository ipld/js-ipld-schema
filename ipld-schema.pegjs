/** IPLD Schema PEG.js grammar **/

// Utility functions
{
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
  = StringKind { return { kind: 'string' }}
  / EnumKind _ descriptor:EnumDescriptor? { return descriptor }
  / UnionKind _ descriptor:UnionDescriptor? { return descriptor }
  / MapKind _ descriptor:MapDescriptor? { return descriptor }
  / StructKind _ descriptor:StructDescriptor? { return descriptor }

MapKind = "map"
StringKind = "string"
EnumKind = "enum"
UnionKind = "union"
StructKind = "struct"

ListDescriptor = "[" _ fields:TypeDescriptor _ "]" {
  return extend({ kind: 'list' }, fields)
}

TypeDescriptor = options:TypeOption* _ valueType:(TypeName / ListDescriptor) {
  return options.reduce(extend, { valueType })
}

EnumDescriptor = "{" values:EnumValue+ "}" {
  return {
    kind: 'enum',
    members: values.reduce(extend, {}),
    representation: { string: {} }
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
    case 'inline':
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
  let representationType = (representation && representation.type) || 'map'
  representation = { [representationType]: representation || {} }
  delete representation[representationType].type
  return Object.assign({ kind: 'map', keyType }, valueType, { representation })
}

StructDescriptor = "{" values:StructValue* "}" _ representation:StructRepresentation? {
  let fields = values.reduce(extend, {})
  let representationType = (representation && representation.type) || 'map'
  representation = { [representationType]: representation || {} }
  delete representation[representationType].type
  if (representationType === 'tuple' && !representation.tuple.fieldOrder) {
    representation.tuple.fieldOrder = Object.keys(fields)
  }
  return extend({ kind: 'struct', fields }, { representation })
}

// TODO: break these by newline || "}" (non-greedy match)
StructValue = _ key:StringName _ options:StructFieldOption* _ type:StructType _ {
  return { [key]: options.reduce(extend, { type }) }
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
  / "inline" _ discriminatorKey:QuotedString { return { type: 'inline', discriminatorKey } }
  / "envelope" _ descriptor:UnionEnvelopeKeyDefinition { return descriptor }

// TODO: break these by newline || "}" (non-greedy match)
UnionEnvelopeKeyDefinition = "{" _ "discriminatorKey" _ discriminatorKey:QuotedString _ "contentKey" _ contentKey:QuotedString _ "}" {
  return { type: 'envelope', discriminatorKey, contentKey }
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
  = "map" _ fields:StructMapRepresentationFields? {
      return { type: 'map', fields: fields.reduce(extend, {}) }
    }
  / "tuple" _ fieldOrder:StructTupleRepresentationFields? { return { type: 'tuple', fieldOrder } }
  / "stringjoin" _ join:StructStringjoinRepresentationFields { return { type: 'stringjoin', join } }
  / "stringpairs" _ representation:MapStringpairsRepresentation { return representation }
  / "listpairs" { return { type: 'listpairs' } }

// TODO: break these by newline || "}" (non-greedy match)
StructMapRepresentationFields = "{" _ fields:StructMapRepresentationField* _ "}" { return fields }

StructMapRepresentationField = "field" _ field:StringName _ isDefault:"default" _ defaultValue:QuotedString _ {
  return { [field]: extend({}, isDefault ? { default: coerceValue(defaultValue) } : null) }
}

StructTupleRepresentationFields = "{" _ fieldOrder:StructTupleRepresentationFieldOrder?  _ "}" {
  return fieldOrder
}

StructTupleRepresentationFieldOrder = "fieldOrder" _ fields:QuotedStringArray {
  return fields
}

StructStringjoinRepresentationFields = "{" _ "join" _ join:QuotedString  _ "}" {
  return join
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
