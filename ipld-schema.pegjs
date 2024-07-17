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

  function flattenArray (a) {
    if (!Array.isArray(a)) {
      return a
    }
    return a.reduce((p, c) => p.concat(flattenArray(c)), [])
  }

  function processComments (precomments, linecomment) {
    let pcl = precomments.split('\n')
    // trim trailing empty lines
    while (pcl.length && !pcl[pcl.length - 1].trim()) {
      pcl.pop()
    }
    // trim leading empty lines
    while (pcl.length && !pcl[0].trim()) {
      pcl.shift()
    }
    let lastempty = pcl.findLastIndex((l) => /^\s*$/.test(l))
    if (lastempty !== -1) {
      pcl = pcl.slice(lastempty + 1)
    }
    // trim leading space and # on each line
    pcl = pcl.map((l) => l.replace(/^[ \t]*#[ \t]?/gm, ''))
    linecomment = linecomment ? flattenArray(linecomment).join('').replace(/^[ \t]*#[ \t]?/, '') : null
    const comments = (pcl.length || linecomment) ? {} : null
    if (pcl.length) {
      comments.precomments = pcl.join('\n')
    }
    if (linecomment) {
      comments.linecomment = linecomment
    }
    return comments
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

TypeDef =
    ws*
    precomments:capturedcomment
    annotations:Annotation*
    'type'
    ws+
    name:TypeName
    ws+
    definition:Definition
    ws*
    newline* {
  if (Object.keys(definition).length !== 1) {
    throw new Error('Unexpected definition for type: ' + JSON.stringify(definition))
  }
  const typ = Object.keys(definition)[0]
  const comments = processComments(precomments)
  if (comments) {
    definition[typ].comments = extend(definition[typ].comments || {}, { type: comments })
  }
  if (annotations && annotations.length) {
    definition[typ].annotations = extend(definition[typ].annotations || {}, { type: annotations })
  }
  return { [name]: definition }
}

AdvancedDef = _ 'advanced' _ name:TypeName _ {
  return { [name]: { advanced: {} } }
}

AdvancedRepresentation = name:TypeName {
  return { advanced: name }
}

Definition
  = descriptor:MapDescriptor { return descriptor } // "map" assumed if goes straight to a {}
  / descriptor:ListDescriptor { return descriptor } // "list" assumed if goes straight to a []
  / descriptor:LinkDescriptor { return descriptor } // "link" assumed if goes straight to a &
  / descriptor:CopyDescriptor { return descriptor } // "="
  / EnumKind wsnl descriptor:EnumDescriptor { return descriptor }
  / UnionKind wsnl descriptor:UnionDescriptor { return descriptor }
  / StructKind wsnl descriptor:StructDescriptor { return descriptor }
  / BytesKind wsnl descriptor:BytesDescriptor { return descriptor }
  / kind:SimpleKind { return { [kind]: {} } }

MapKind = "map"
ListKind = "list"
EnumKind = "enum"
UnionKind = "union"
StructKind = "struct"
BytesKind = "bytes"

SimpleKind = kind:BaseType { return kind }

ListDescriptor = "[" _ fields:TypeDescriptor _ "]" wsnl representation:ListRepresentation? {
  return { list: Object.assign({}, fields, representation ? { representation } : null) }
}

// TODO: generalise this TypeName / MapDescriptor / ListDescriptor / LinkDescriptor combo, it's used elsewhere
TypeDescriptor = options:TypeOption* _ valueType:(TypeName / MapDescriptor / ListDescriptor / LinkDescriptor) {
  return options.reduce(extend, { valueType })
}

LinkDescriptor = "&" expectedType:TypeName {
  return { link: { expectedType } }
}

CopyDescriptor = "=" wsnl fromType:TypeName {
  return { copy: { fromType } }
}

EnumDescriptor = "{" members:EnumMember+ "}" wsnl representation:EnumRepresentation? wsnl {
  if (!representation || !(representation.string || representation.int)) {
    representation = { string: {} }
  }

  const repr = members.filter((m) => Object.values(m)[0]).reduce(extend, {})
  members = Object.keys(members.reduce(extend, {}))

  if (representation.string) {
    representation.string = repr
  } else if (representation.int) {
    representation.int = repr
    Object.entries(repr).forEach(([k, v]) => {
      const i = parseInt(v, 10)
      if (i != v) {
        throw new Error('int representations only support integer representation values')
      }
      repr[k] = i
    })
  }

  return { enum: { members, representation } }
}

EnumMember = wsnl "|" wsnl name:EnumValue _ representationOptions:EnumFieldRepresentationOptions? wsnl {
  return { [name]: representationOptions }
}

EnumFieldRepresentationOptions = "(" ws* value:QuotedString ws* ")" { return value }

UnionDescriptor = "{" values:UnionValue+ "}" wsnl representation:UnionRepresentation wsnl {
  let fields = values.reduce(extend, {})
  if (representation.keyed) {
    representation.keyed = fields
  } else if (representation.kinded) {
    representation.kinded = fields
  } else if (representation.stringprefix) {
    representation.stringprefix = { prefixes: fields }
  } else if (representation.bytesprefix) {
    representation.bytesprefix = { prefixes: fields }
  } else if (representation.inline) {
    representation.inline.discriminantTable = fields
  } else if (representation.envelope) {
    representation.envelope.discriminantTable = fields
  } else {
    throw new Error('Unsupported union type') // we shouldn't get here if we're coded right
  }
  return { union: { members: Object.values(fields), representation } }
}

// TODO: tighten these up, kinded doesn't get quoted kinds, keyed and envelope does, this allows a kinded
// union to pass through with quoted strings, it's currently just a messy duplication
UnionValue = wsnl "|" ws* type:(TypeName / LinkDescriptor) ws* name:(QuotedString / BaseType) _ {
  return { [name]: type }
}

MapDescriptor = "{" _ keyType:TypeName _ ":" _ valueType:TypeDescriptor _ "}" wsnl representation:MapRepresentation? {
  let representationType = (representation && representation.type)
  if (representationType) {
    representation = { [representationType]: representation || {} }
    delete representation[representationType].type
  }
  return { map: Object.assign({ keyType }, valueType, representation ? { representation } : null) }
}

StructDescriptor = "{" values:StructValues "}" ws* representation:StructRepresentation? {
  let fields = values.reduce(extend, {})
  // Field representation options can come in from parens following field definitions,
  // annotations comments prior to field definitions, and any additional precomments or line
  // comments need to be captured from around the field. These all need to be lifted out of the
  // entry and packaged separately.
  const [representationFields, annotationsFields, commentsFields] = Object.entries(fields).reduce((p, fieldEntry) => {
    if (fieldEntry[1].representationOptions) {
      p[0][fieldEntry[0]] = fieldEntry[1].representationOptions
      delete fieldEntry[1].representationOptions
    }
    if (fieldEntry[1].annotations) {
      p[1][fieldEntry[0]] = fieldEntry[1].annotations
      delete fieldEntry[1].annotations
    }
    if (fieldEntry[1].comments) {
      p[2][fieldEntry[0]] = fieldEntry[1].comments
      delete fieldEntry[1].comments
    }
    return p
  }, [{}, {}, {}])
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
  return { struct:
    extend(
      extend(
        extend({ fields }, { representation: representation || defaultStructRepresentation() }),
        Object.keys(annotationsFields).length > 0 ? { annotations: { fields: annotationsFields } } : null
      ), Object.keys(commentsFields).length > 0 ? { comments: { fields: commentsFields} } : null
    )
  }
}

StructValues
  = values:StructValue+ {
    return values
  }
  / _ { return [] }

StructValue =
    ws*
    precomments:capturedcomment
    annotations:Annotation*
    key:StringName
    ws+
    options:(options:StructFieldOption ws+ { return options })*
    type:StructType
    ws*
    representationOptions:StructFieldRepresentationOptions?
    ws*
    linecomment:comment?
    ws*
    newline* {
  const comments = processComments(precomments, linecomment)
  return { [key]: options.reduce(extend,
     extend(
        extend(
          extend({ type }, comments ? { comments } : null),
          representationOptions ? { representationOptions } : null),
        annotations.length ? { annotations } : null
     )
    )
  }
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

StructFieldRepresentationOptions = "(" ws* options:StructFieldRepresentationOption* ws* ")" {
  return options.reduce(extend, {})
}

StructFieldRepresentationOption
  = "implicit" ws* implicit:ImplicitOption { return { implicit } }
  / "rename" ws* rename:QuotedString ws* { return { rename } }

ImplicitOption
  = implicit:QuotedString ws* { return implicit }
  / implicit:Integer ws* { return parseInt(implicit, 10) }
  / "true" { return true }
  / "false" { return false }
  // TODO: floats and bytes

UnionRepresentation = "representation" wsnl representation:UnionRepresentationType {
  return representation
}

MapRepresentation = "representation" wsnl representation:MapRepresentationType {
  return representation
}

ListRepresentation = "representation" wsnl representation:ListRepresentationType {
  return representation
}

StructRepresentation = "representation" wsnl representation:StructRepresentationType {
  return representation
}

EnumRepresentation = "representation" wsnl representation:EnumRepresentationType {
  return representation
}

UnionRepresentationType
  = "keyed" { return { keyed: {} } }
  / "kinded" { return { kinded: {} } }
  / "stringprefix" { return { stringprefix: {} } } // TODO: check kind reprs for union types are all strings
  / "bytesprefix" { return { bytesprefix: {} } } // TODO: check kind reprs for union types are all bytes
  / "inline" wsnl descriptor:UnionInlineKeyDefinition { return descriptor }
  / "envelope" wsnl descriptor:UnionEnvelopeKeyDefinition { return descriptor }

UnionInlineKeyDefinition = "{" wsnl ("discriminantKey" / "discriminantKey") wsnl discriminantKey:QuotedString _ "}" {
  return { inline: { discriminantKey } }
}

// TODO: break these by newline || "}" (non-greedy match)
UnionEnvelopeKeyDefinition = "{" wsnl ("discriminantKey" / "discriminantKey") wsnl discriminantKey:QuotedString wsnl "contentKey" wsnl contentKey:QuotedString _ "}" {
  return { envelope: { discriminantKey, contentKey } }
}

MapRepresentationType
  = "map" { return { type: 'map' } }
  / "listpairs" { return { type: 'listpairs' } }
  / "stringpairs" wsnl representation:MapStringpairsRepresentation { return representation }
  / "advanced" wsnl representation:AdvancedRepresentation { return representation }

// TODO: break these by newline || "}" (non-greedy match)
MapStringpairsRepresentation = "{" wsnl options:MapStringpairsRepresentationOptions* wsnl "}" {
  let representation = extend({ type: 'stringpairs' }, options.reduce(extend, {}))
  if (!representation.innerDelim || !representation.entryDelim) {
    throw new Error('"stringpairs" representation requires both "innerDelim" and "entryDelim" options')
  }
  return representation
}

MapStringpairsRepresentationOptions
  = wsnl "innerDelim" wsnl innerDelim:QuotedString { return { innerDelim } }
  / wsnl "entryDelim" wsnl entryDelim:QuotedString { return { entryDelim } }

ListRepresentationType = "advanced" wsnl representation:AdvancedRepresentation { return representation }

StructRepresentationType
  = "map" { return { type: 'map' } }
  / "tuple" wsnl fieldOrder:StructTupleRepresentationFields? { return extend({ type: 'tuple' }, fieldOrder ? { fieldOrder } : null) }
  / "stringjoin" wsnl fields:StructStringjoinRepresentationFields { return extend({ type: 'stringjoin' }, fields ) }
  / "stringpairs" wsnl representation:MapStringpairsRepresentation { return representation }
  / "listpairs" { return { type: 'listpairs' } }

// TODO: break these by newline || "}" (non-greedy match)
StructMapRepresentationFields = "{" _ "}"

StructMapRepresentationField = "field" ws* field:StringName ws* isImplicit:"implicit" ws* implicitValue:QuotedString _ {
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

EnumRepresentationType
  = "string" { return { string: {} } }
  / "int" { return { int: {} } }

BytesDescriptor = "representation" wsnl "advanced" wsnl representation:AdvancedRepresentation { return { bytes: { representation } } }

QuotedStringArray = "[" _ firstElement:QuotedString? subsequentElements:(_ "," _ s:QuotedString _ { return s })* _ "]" {
  if (!firstElement) {
    return []
  }
  if (!subsequentElements) {
    return [ firstElement ]
  }
  return [ firstElement ].concat(subsequentElements)
}

TypeName = StringName

EnumValue = StringName

QuotedString = "\"" chars:[^"]+ "\"" { return chars.join('') }

StringName = first:[a-zA-Z] remainder:[a-zA-Z0-9_]* { return first + remainder.join('') }

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
	/ "null"
	/ "any"

// Annotation is '## @name(value)' or '## @name', swallowing any trailing comments
Annotation = [ \t]* "##" [ \t]* "@" name:StringName value:("(" value:[^)]* ")" { return value })? [^\r\n]* newline ws* {
  return { [name]: value ? value.join('') : '' }
}

capturedcomment = comments:_capturedcomment* {
  return flattenArray(comments).join('')
}

_capturedcomment
  = ws+
  / newline+
  / comment+

__
  = ws+ { return }
  / newline+ { return }
  / comment+ { return }

_ = __*

_wsnl
  = ws+ { return }
  / newline+ { return }

wsnl = _wsnl*

comment = "#" !("#" [ \t]* "@" StringName) [^\r\n]*

ws = [ \t]

newline = "\r"? "\n"
