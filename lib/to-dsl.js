/**
 * @param {string} s
 * @returns {string}
 */
const noop = (s) => s

/**
 * @typedef {import('../schema-schema').Schema} Schema
 * @typedef {import('../schema-schema').TypeName} TypeName
 * @typedef {import('../schema-schema').TypeDefn} TypeDefn
 * @typedef {import('../schema-schema').TypeDefnCopy} TypeDefnCopy
 * @typedef {import('../schema-schema').TypeDefnLink} TypeDefnLink
 * @typedef {import('../schema-schema').TypeDefnString} TypeDefnString
 * @typedef {import('../schema-schema').TypeDefnBytes} TypeDefnBytes
 * @typedef {import('../schema-schema').TypeDefnStruct} TypeDefnStruct
 * @typedef {import('../schema-schema').TypeDefnMap} TypeDefnMap
 * @typedef {import('../schema-schema').TypeDefnList} TypeDefnList
 * @typedef {import('../schema-schema').TypeDefnUnion} TypeDefnUnion
 * @typedef {import('../schema-schema').TypeDefnEnum} TypeDefnEnum
 * @typedef {import('../schema-schema').MapRepresentation_StringPairs} MapRepresentation_StringPairs
 * @typedef {import('../schema-schema').StructRepresentation_StringPairs} StructRepresentation_StringPairs
 * @typedef {import('../schema-schema').UnionRepresentation_StringPrefix} UnionRepresentation_StringPrefix
 * @typedef {import('../schema-schema').UnionRepresentation_BytesPrefix} UnionRepresentation_BytesPrefix
 * @typedef {import('../schema-schema').UnionMemberInlineDefn} UnionMemberInlineDefn
 * @typedef {import('../schema-schema').FieldName} FieldName
 */

/**
 * @typedef {(s:string)=>string} hltrans
 * @typedef {{keyword:hltrans, builtin:hltrans, operator:hltrans, number: hltrans, string: hltrans, className: hltrans, punctuation: hltrans}} Highlighter
 */

// based on prism.js syntax categories, except 'class-name' -> className
/** @type {Highlighter} */
const noopHighlighter = {
  keyword: noop,
  builtin: noop,
  operator: noop,
  number: noop,
  string: noop,
  // comment: noop,
  className: noop,
  punctuation: noop
}

/**
 * @param {Schema} schema
 * @param {string} indent
 * @param {Highlighter} [highlighter]
 * @returns {string}
 */
export function toDSL (schema, indent = '  ', highlighter) {
  if (!schema || typeof schema.types !== 'object') {
    throw new Error('Invalid schema')
  }

  highlighter = Object.assign({}, noopHighlighter, highlighter)

  let str = ''

  str += printAdvanced(schema, indent, highlighter)
  str += printTypes(schema, indent, highlighter)

  return str
}

/**
 * @param {Schema} schema
 * @param {string} _
 * @param {Highlighter} highlighter
 * @returns {string}
 */
function printAdvanced (schema, _, highlighter) {
  let str = ''

  if (typeof schema.advanced === 'object') {
    for (const advanced of Object.keys(schema.advanced)) {
      str += `${highlighter.keyword('advanced')} ${highlighter.className(advanced)}\n\n`
    }
  }

  return str
}

/**
 * @param {Schema} schema
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns
 */
function printTypes (schema, indent, highlighter) {
  let str = ''

  for (const [type, defn] of Object.entries(schema.types)) {
    str += `${highlighter.keyword('type')} ${highlighter.className(type)} ${printType(defn, indent, highlighter)}\n\n`
  }

  return str.replace(/\n\n$/m, '')
}

/**
 * @param {TypeDefn} defn
 * @returns {string}
 */
function kindFromDefinition (defn) {
  const [kind, more] = Object.keys(defn)
  if (!kind) {
    throw new Error('Invalid schema, missing kind')
  }
  if (more !== undefined) {
    throw new Error('Invalid schema more than one kind')
  }
  return kind
}

/**
 * @param {TypeDefn} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
function printType (defn, indent, highlighter) {
  const kind = kindFromDefinition(defn)

  if (['map', 'list', 'link', 'copy'].includes(kind)) {
    return printTypeTerm(defn, indent, highlighter)
  }

  if (['struct', 'union', 'enum'].includes(kind)) {
    return `${highlighter.builtin(kind)} ${printTypeTerm(defn, indent, highlighter)}`
  }

  if (kind === 'bytes' && kind in defn && 'representation' in defn.bytes && typeof defn.bytes.representation === 'object' && 'advanced' in defn.bytes.representation && typeof defn.bytes.representation.advanced === 'string') {
    return `${kind} ${highlighter.builtin('representation')} advanced ${defn.bytes.representation.advanced}`
  }
  if (kind === 'string' && kind in defn && 'representation' in defn.string && typeof defn.string.representation === 'object' && 'advanced' in defn.string.representation && typeof defn.string.representation.advanced === 'string') {
    return `${kind} ${highlighter.builtin('representation')} advanced ${defn.string.representation.advanced}`
  }

  return kind
}

/**
 * @param {TypeName|TypeDefn|UnionMemberInlineDefn} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
function printTypeTerm (defn, indent, highlighter) {
  if (typeof defn === 'string') {
    return defn
  }

  const kind = kindFromDefinition(defn)
  if (!(kind in defn)) {
    throw new Error('Invalid schema, no kind where one should be')
  }

  // @ts-ignore
  if (!(kind in printTypeTerm) || typeof printTypeTerm[kind] !== 'function') {
    throw new Error(`Invalid schema unsupported kind (${kind})`)
  }

  /** @type {(defn:TypeDefn, indent:string, highlighter:Highlighter)=>string} */
  const fn =
    // @ts-ignore
    printTypeTerm[kind]
  // @ts-ignore
  return fn(defn[kind], indent, highlighter)
}

/**
 * @param {TypeDefnLink} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.link = function link (defn, indent, highlighter) {
  return `${highlighter.punctuation('&')}${printTypeTerm(defn.expectedType || 'Any', indent, highlighter)}`
}

/**
 * @param {TypeDefnCopy} defn
 * @param {string} _
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.copy = function copy (defn, _, highlighter) {
  return `${highlighter.operator('=')} ${defn.fromType}`
}

/**
 * @param {TypeDefnMap} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.map = function map (defn, indent, highlighter) {
  if (typeof defn.keyType !== 'string') {
    throw new Error('Invalid schema, map definition needs a "keyType"')
  }
  if (!defn.valueType) {
    throw new Error('Invalid schema, map definition needs a "keyType"')
  }

  const nullable = defn.valueNullable === true ? 'nullable ' : ''
  let str = `${highlighter.punctuation('{')}${printTypeTerm(defn.keyType, indent, highlighter)}:${nullable}${printTypeTerm(defn.valueType, indent, highlighter)}${highlighter.punctuation('}')}`
  if ('representation' in defn && typeof defn.representation === 'object') {
    const repr = reprStrategy(defn)
    if (repr === 'listpairs' && 'listpairs' in defn.representation) {
      str += ` ${highlighter.builtin('representation')} listpairs`
    } else if (repr === 'stringpairs' && 'stringpairs' in defn.representation) {
      str += stringpairs(indent, 'map', defn.representation.stringpairs, highlighter)
    } else if (repr === 'advanced' && 'advanced' in defn.representation) {
      str += ` ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
    }
  }
  return str
}

/**
 * @param {TypeDefnList} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.list = function list (defn, indent, highlighter) {
  if (!defn.valueType) {
    throw new Error('Invalid schema, list definition needs a "keyType"')
  }

  const nullable = defn.valueNullable === true ? 'nullable ' : ''
  let str = `${highlighter.punctuation('[')}${nullable}${printTypeTerm(defn.valueType, indent, highlighter)}${highlighter.punctuation(']')}`

  if ('representation' in defn && typeof defn.representation === 'object') {
    if (reprStrategy(defn) === 'advanced' && 'advanced' in defn.representation) {
      str += ` ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
    }
  }

  return str
}

/**
 * @param {TypeDefnStruct} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.struct = function struct (defn, indent, highlighter) {
  if (typeof defn.fields !== 'object') {
    throw new Error('Invalid schema, struct requires a "fields" map')
  }

  let str = highlighter.punctuation('{')

  for (const [name, fieldDefn] of Object.entries(defn.fields)) {
    const optional = fieldDefn.optional === true ? highlighter.keyword('optional') + ' ' : ''
    const nullable = fieldDefn.nullable === true ? highlighter.keyword('nullable') + ' ' : ''
    let fieldRepr = ''
    if ('representation' in defn && typeof defn.representation === 'object' && 'map' in defn.representation && 'fields' in defn.representation.map && typeof defn.representation.map.fields === 'object') {
      const fr = defn.representation.map.fields[name]
      if (typeof fr === 'object') {
        const hasRename = typeof fr.rename === 'string'
        const hasImplicit = fr.implicit !== undefined
        if (hasRename || hasImplicit) {
          fieldRepr = ` ${highlighter.punctuation('(')}`
          if (hasRename) {
            fieldRepr += `${highlighter.keyword('rename')} ${highlighter.string(`"${fr.rename}"`)}`
            if (hasImplicit) {
              fieldRepr += ' '
            }
          }
          if (fr.implicit !== undefined) {
            const impl =
              typeof fr.implicit === 'string'
                ? highlighter.string(`"${fr.implicit}"`)
                : typeof fr.implicit === 'number'
                  ? highlighter.number(String(fr.implicit))
                  : fr.implicit instanceof Uint8Array
                    ? highlighter.string(fr.implicit.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), ''))
                    : highlighter.string(fr.implicit.toString())
            fieldRepr += `${highlighter.keyword('implicit')} ${impl}`
          }
          fieldRepr += highlighter.punctuation(')')
        }
      }
    }

    const fieldType = typeof fieldDefn.type === 'string' ? fieldDefn.type : printTypeTerm(fieldDefn.type, indent, highlighter)
    str += `\n${indent}${name} ${optional}${nullable}${fieldType}${fieldRepr}`
  }

  if (str[str.length - 1] !== highlighter.punctuation('{')) {
    str += '\n'
  }
  str += highlighter.punctuation('}')

  if ('representation' in defn && typeof defn.representation === 'object') {
    const repr = reprStrategy(defn)
    if (repr === 'listpairs' && 'listpairs' in defn.representation) {
      str += ` ${highlighter.builtin('representation')} listpairs`
    } else if (repr === 'stringjoin' && 'stringjoin' in defn.representation) {
      if (typeof defn.representation.stringjoin.join !== 'string') {
        throw new Error('Invalid schema, struct stringjoin representations require an join string')
      }
      str += ` ${highlighter.builtin('representation')} stringjoin ${highlighter.punctuation('{')}\n`
      str += `${indent}join ${highlighter.string(`"${defn.representation.stringjoin.join}"`)}\n`
      str += fieldOrder(indent, defn.representation.stringjoin.fieldOrder, highlighter)
      str += highlighter.punctuation('}')
    } else if (repr === 'stringpairs' && 'stringpairs' in defn.representation) {
      str += stringpairs(indent, 'struct', defn.representation.stringpairs, highlighter)
    } else if (repr === 'tuple' && 'tuple' in defn.representation) {
      str += ` ${highlighter.builtin('representation')} tuple`
      if (Array.isArray(defn.representation.tuple.fieldOrder)) {
        str += ` ${highlighter.punctuation('{')}\n`
        str += fieldOrder(indent, defn.representation.tuple.fieldOrder, highlighter)
        str += highlighter.punctuation('}')
      }
    } else if (repr === 'advanced' && 'advanced' in defn.representation) {
      str += ` ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
    }
  }

  return str
}

/**
 * @param {string} indent
 * @param {FieldName[]|undefined} fieldOrder
 * @param {Highlighter} highlighter
 * @returns {string}
 */
function fieldOrder (indent, fieldOrder, highlighter) {
  let str = ''
  if (Array.isArray(fieldOrder)) {
    const fo = fieldOrder.map((f) => highlighter.string(`"${f}"`)).join(', ')
    str += `${indent}fieldOrder ${highlighter.punctuation('[')}${fo}${highlighter.punctuation(']')}\n`
  }
  return str
}

/**
 * @param {string} indent
 * @param {string} kind
 * @param {StructRepresentation_StringPairs|MapRepresentation_StringPairs} stringpairs
 * @param {Highlighter} highlighter
 * @returns {string}
 */
function stringpairs (indent, kind, stringpairs, highlighter) {
  let str = ''
  if (typeof stringpairs.innerDelim !== 'string') {
    throw new Error(`Invalid schema, ${kind} stringpairs representations require an innerDelim string`)
  }
  if (typeof stringpairs.entryDelim !== 'string') {
    throw new Error(`Invalid schema, ${kind} stringpairs representations require an entryDelim string`)
  }
  str += ` ${highlighter.builtin('representation')} stringpairs ${highlighter.punctuation('{')}\n`
  str += `${indent}innerDelim ${highlighter.string(`"${stringpairs.innerDelim}"`)}\n`
  str += `${indent}entryDelim ${highlighter.string(`"${stringpairs.entryDelim}"`)}\n`
  str += highlighter.punctuation('}')
  return str
}

/**
 * @param {TypeDefnString|TypeDefnBytes|TypeDefnStruct|TypeDefnList|TypeDefnMap|TypeDefnUnion|TypeDefnEnum} defn
 * @returns {string}
 */
function reprStrategy (defn) {
  if (!('representation' in defn) || typeof defn.representation !== 'object') {
    throw new Error('Expected \'representation\' property of definition')
  }
  const keys = Object.keys(defn.representation)
  if (keys.length !== 1) {
    throw new Error('Expected exactly one \'representation\' field')
  }
  const repr = keys[0]
  if (repr === 'advanced' && 'advanced' in defn.representation) {
    if (typeof defn.representation.advanced !== 'string') {
      throw new Error('Expected representation \'advanced\' to be an string')
    }
  }
  return repr
}

/**
 * @param {TypeDefnUnion} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.union = function union (defn, indent, highlighter) {
  if (typeof defn.representation !== 'object') {
    throw new Error('Invalid schema, unions require a representation')
  }

  let str = highlighter.punctuation('{')
  const repr = reprStrategy(defn)

  if (repr === 'kinded' && 'kinded' in defn.representation) {
    for (const [kind, type] of Object.entries(defn.representation.kinded)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${kind}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} kinded`
  } else if ((repr === 'stringprefix' && 'stringprefix' in defn.representation) || (repr === 'bytesprefix' && 'bytesprefix' in defn.representation)) {
    /** @type {UnionRepresentation_StringPrefix|UnionRepresentation_BytesPrefix} */
    const reprStrategy = 'stringprefix' in defn.representation ? defn.representation.stringprefix : defn.representation.bytesprefix
    if (typeof reprStrategy.prefixes !== 'object') {
      throw new Error(`Invalid schema, ${repr} unions require a representation prefixes map`)
    }
    for (const [key, type] of Object.entries(reprStrategy.prefixes)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${highlighter.string(`"${key}"`)}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} ${repr}`
  } else if (repr === 'keyed' && 'keyed' in defn.representation) {
    if (typeof defn.representation[repr] !== 'object') {
      throw new Error(`Invalid schema, ${repr} unions require a representation keyed map`)
    }
    for (const [key, type] of Object.entries(defn.representation[repr])) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${highlighter.string(`"${key}"`)}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} ${repr}`
  } else if (repr === 'inline' && 'inline' in defn.representation) {
    if (typeof defn.representation.inline.discriminantTable !== 'object') {
      throw new Error('Invalid schema, inline unions require a discriminantTable map')
    }
    if (typeof defn.representation.inline.discriminantKey !== 'string') {
      throw new Error('Invalid schema, inline unions require a discriminantKey string')
    }
    for (const [key, type] of Object.entries(defn.representation.inline.discriminantTable)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${highlighter.string(`"${key}"`)}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} inline ${highlighter.punctuation('{')}\n${indent}discriminantKey ${highlighter.string(`"${defn.representation.inline.discriminantKey}"`)}\n${highlighter.punctuation('}')}`
  } else if (repr === 'envelope' && 'envelope' in defn.representation) {
    if (typeof defn.representation.envelope.discriminantTable !== 'object') {
      throw new Error('Invalid schema, envelope unions require a discriminantTable map')
    }
    if (typeof defn.representation.envelope.discriminantKey !== 'string') {
      throw new Error('Invalid schema, envelope unions require a discriminantKey string')
    }
    if (typeof defn.representation.envelope.contentKey !== 'string') {
      throw new Error('Invalid schema, envelope unions require a contentKey string')
    }
    for (const [key, type] of Object.entries(defn.representation.envelope.discriminantTable)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${highlighter.string(`"${key}"`)}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} envelope ${highlighter.punctuation('{')}`
    str += `\n${indent}discriminantKey ${highlighter.string(`"${defn.representation.envelope.discriminantKey}"`)}`
    str += `\n${indent}contentKey ${highlighter.string(`"${defn.representation.envelope.contentKey}"`)}`
    str += `\n${highlighter.punctuation('}')}`
  } else {
    throw new Error(`Invalid schema, unknown union representation type ${Object.keys(defn.representation)[0]}`)
  }

  return str
}

/**
 * @param {TypeDefnEnum} defn
 * @param {string} indent
 * @param {Highlighter} highlighter
 * @returns {string}
 */
printTypeTerm.enum = function _enum (defn, indent, highlighter) {
  if (typeof defn.representation !== 'object') {
    throw new Error('Invalid schema, enum requires a "representation" map')
  }
  const repr = reprStrategy(defn)
  if (repr !== 'string' && repr !== 'int') {
    throw new Error('Invalid schema, enum requires a "string" or "int" representation map')
  }

  let str = highlighter.punctuation('{')

  for (const ev of defn.members) {
    str += `\n${indent}${highlighter.punctuation('|')} ${ev}`
    const sv = ('string' in defn.representation ? defn.representation.string[ev] : undefined) ||
      ('int' in defn.representation ? defn.representation.int[ev] : undefined)
    if (sv !== undefined) {
      str += ` ${highlighter.punctuation('(')}${highlighter.string(`"${sv}"`)}${highlighter.punctuation(')')}`
    }
  }

  str += `\n${highlighter.punctuation('}')}`
  if ('int' in defn.representation) {
    str += ` ${highlighter.builtin('representation')} int`
  }
  return str
}
