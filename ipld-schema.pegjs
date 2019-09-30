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

Root = roots:RootConstructs+ {
  // merge 'type' and 'advanced' structures into one {types:{}, advanced:{}}
  return roots.reduce((o1, o2) => {
    if (o2.types) {
      if (!o1.types) {
        o1.types = {}
      }
      Object.assign(o1.types, o2.types)
    } else if (o2.advanced) {
      if (!o1.advanced) {
        o1.advanced = {}
      }
      Object.assign(o1.advanced, o2.advanced)
    }
    return o1
  }, {})
}

RootConstructs
  = types:TypeDef { return { types } }
  / advanced:AdvancedDef { return { advanced } }

TypeDef = _ 'type' _ name:TypeName _ definition:Definition _ {
  return { [name]: definition }
}

AdvancedDef = _ 'advanced' _ name:TypeName _ {
  return { [name]: { kind: 'advanced' } }
}

AdvancedRepresentation = name:TypeName {
  return { advanced: name }
}

Definition
  = descriptor:MapDescriptor { return descriptor } // "map" assumed if goes straight to a {}
  / descriptor:ListDescriptor { return descriptor } // "list" assumed if goes straight to a []
  / descriptor:LinkDescriptor { return descriptor } // "link" assumed if goes straight to a &
  / descriptor:CopyDescriptor { return descriptor } // "="
  / EnumKind _ descriptor:EnumDescriptor { return descriptor }
  / UnionKind _ descriptor:UnionDescriptor { return descriptor }
  / StructKind _ descriptor:StructDescriptor { return descriptor }
  / BytesKind _ descriptor:BytesDescriptor { return descriptor }
  / kind:SimpleKind { return kind }

MapKind = "map"
ListKind = "list"
EnumKind = "enum"
UnionKind = "union"
StructKind = "struct"
BytesKind = "bytes"

SimpleKind = kind:BaseType { return { kind } }

ListDescriptor = "[" _ fields:TypeDescriptor _ "]" _ representation:ListRepresentation? {
  return Object.assign({ kind: 'list' }, fields, representation ? { representation } : null)
}

// TODO: generalise this TypeName / MapDescriptor / ListDescriptor / LinkDescriptor combo, it's used elsewhere
TypeDescriptor = options:TypeOption* _ valueType:(TypeName / MapDescriptor / ListDescriptor / LinkDescriptor) {
  return options.reduce(extend, { valueType })
}

LinkDescriptor = "&" expectedType:TypeName {
  return extend({ kind: 'link' }, expectedType !== 'Any' ? { expectedType } : null)
}

CopyDescriptor = "=" _ fromType:TypeName {
  return { kind: 'copy', fromType }
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
  if (!representation.byteprefix && Object.values(values).find((v) => typeof v === 'number') > -1) {
    throw new Error(`${Object.keys(representation)[0]} union representations do not support integer discriminators`)
  }
  if (representation.keyed) {
    representation.keyed = fields
  } else if (representation.kinded) {
    representation.kinded = fields
  } else if (representation.byteprefix) {
    representation.byteprefix = fields
  } else if (representation.inline) {
    representation.inline.discriminantTable = fields
  } else if (representation.envelope) {
    representation.envelope.discriminantTable = fields
  } else {
    throw new Error('Unsupported union type') // we shouldn't get here if we're coded right
  }
  return { kind: 'union', representation }
}

// TODO: tighten these up, kinded doesn't get quoted kinds, keyed and envelope does, this allows a kinded
// union to pass through with quoted strings, it's currently just a messy duplication
// also .. byteprefix unions get ints
UnionValue = _ "|" _ type:(TypeName / LinkDescriptor) _ name:(QuotedString / BaseType / Integer) _ {
  if (typeof name === 'number') { // byteprefix allows this
    return { [type]: name }
  }
  return { [name]: type }
}

MapDescriptor = "{" _ keyType:TypeName _ ":" _ valueType:TypeDescriptor _ "}" _ representation:MapRepresentation? {
  let representationType = (representation && representation.type)
  if (representationType) {
    representation = { [representationType]: representation || {} }
    delete representation[representationType].type
  }
  return Object.assign({ kind: 'map', keyType }, valueType, representation ? { representation } : null)
}

StructDescriptor = "{" _ values:StructValue* _ "}" _ representation:StructRepresentation? {
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
  / LinkDescriptor

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

ListRepresentation = "representation" _ representation:ListRepresentationType _ {
  return representation
}

StructRepresentation = "representation" _ representation:StructRepresentationType _ {
  return representation
}

UnionRepresentationType
  = "keyed" { return { keyed: {} } }
  / "kinded" { return { kinded: {} } }
  / "byteprefix" { return { byteprefix: {} } } // TODO: check kind reprs for union types are all bytes
  / "inline" _ descriptor:UnionInlineKeyDefinition { return descriptor }
  / "envelope" _ descriptor:UnionEnvelopeKeyDefinition { return descriptor }

UnionInlineKeyDefinition = "{" _ ("discriminantKey" / "discriminantKey") _ discriminantKey:QuotedString _ "}" {
  return { inline: { discriminantKey } }
}

// TODO: break these by newline || "}" (non-greedy match)
UnionEnvelopeKeyDefinition = "{" _ ("discriminantKey" / "discriminantKey") _ discriminantKey:QuotedString _ "contentKey" _ contentKey:QuotedString _ "}" {
  return { envelope: { discriminantKey, contentKey } }
}

MapRepresentationType
  = "map" { return { type: 'map' } }
  / "listpairs" { return { type: 'listpairs' } }
  / "stringpairs" _ representation:MapStringpairsRepresentation { return representation }
  / "advanced" _ representation:AdvancedRepresentation { return representation }

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

ListRepresentationType = "advanced" _ representation:AdvancedRepresentation { return representation }

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

BytesDescriptor = "representation" _ "advanced" _ representation:AdvancedRepresentation { return { kind: 'bytes', representation } }

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

Integer = chars:[0-9]+ { return parseInt(chars.join(''), 10) }

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
