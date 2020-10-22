const noop = (s) => s

// based on prism.js syntax categories, except 'class-name' -> className
const noopHighlighter = {
  keyword: noop,
  builtin: noop,
  operator: noop,
  // number: noop,
  string: noop,
  // comment: noop,
  className: noop,
  punctuation: noop
}

function print (schema, indent = '  ', highlighter = {}) {
  if (!schema || typeof schema.types !== 'object') {
    throw new Error('Invalid schema')
  }

  highlighter = Object.assign({}, noopHighlighter, highlighter)

  let str = ''

  str += printAdvanced(schema, indent, highlighter)
  str += printTypes(schema, indent, highlighter)

  return str
}

function printAdvanced (schema, indent, highlighter) {
  let str = ''

  if (typeof schema.advanced === 'object') {
    for (const advanced of Object.keys(schema.advanced)) {
      str += `${highlighter.keyword('advanced')} ${highlighter.className(advanced)}\n\n`
    }
  }

  return str
}

function printTypes (schema, indent, highlighter) {
  let str = ''

  for (const [type, defn] of Object.entries(schema.types)) {
    if (typeof defn.kind !== 'string') {
      throw new Error(`Invalid schema ${type} doesn't have a kind`)
    }

    str += `${highlighter.keyword('type')} ${highlighter.className(type)} ${printType(defn, indent, highlighter)}\n\n`
  }

  return str.replace(/\n\n$/m, '')
}

function printType (defn, indent, highlighter) {
  if (['map', 'list', 'link', 'copy'].includes(defn.kind)) {
    return printTypeTerm(defn, indent, highlighter)
  }

  if (['struct', 'union', 'enum'].includes(defn.kind)) {
    return `${highlighter.builtin(defn.kind)} ${printTypeTerm(defn, indent, highlighter)}`
  }

  if (defn.kind === 'bytes' && defn.representation && typeof defn.representation.advanced === 'string') {
    return `bytes ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
  }

  return defn.kind
}

function printTypeTerm (defn, indent, highlighter) {
  if (typeof defn === 'string') {
    return defn
  }

  if (typeof printTypeTerm[defn.kind] !== 'function') {
    throw new Error(`Invalid schema unsupported kind (${defn.kind})`)
  }

  return printTypeTerm[defn.kind](defn, indent, highlighter)
}

printTypeTerm.link = function link (defn, indent, highlighter) {
  return `${highlighter.punctuation('&')}${printTypeTerm(defn.expectedType || 'Any', indent, highlighter)}`
}

printTypeTerm.copy = function copy (defn, indent, highlighter) {
  return `${highlighter.operator('=')} ${defn.fromType}`
}

printTypeTerm.map = function map (defn, indent, highlighter) {
  if (typeof defn.keyType !== 'string') {
    throw new Error('Invalid schema, map definition needs a "keyType"')
  }
  if (!defn.valueType) {
    throw new Error('Invalid schema, map definition needs a "keyType"')
  }

  const nullable = defn.valueNullable === true ? 'nullable ' : ''
  let str = `${highlighter.punctuation('{')}${printTypeTerm(defn.keyType, indent, highlighter)}:${nullable}${printTypeTerm(defn.valueType, indent, highlighter)}${highlighter.punctuation('}')}`
  if (defn.representation) {
    if (typeof defn.representation.listpairs === 'object') {
      str += ` ${highlighter.builtin('representation')} listpairs`
    } else if (typeof defn.representation.stringpairs === 'object') {
      str += stringpairs(indent, 'map', defn.representation.stringpairs, highlighter)
    } else if (typeof defn.representation.advanced === 'string') {
      str += ` ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
    }
  }
  return str
}

printTypeTerm.list = function list (defn, indent, highlighter) {
  if (!defn.valueType) {
    throw new Error('Invalid schema, list definition needs a "keyType"')
  }

  const nullable = defn.valueNullable === true ? 'nullable ' : ''
  let str = `${highlighter.punctuation('[')}${nullable}${printTypeTerm(defn.valueType, indent, highlighter)}${highlighter.punctuation(']')}`

  if (defn.representation) {
    if (typeof defn.representation.advanced === 'string') {
      str += ` ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
    }
  }

  return str
}

printTypeTerm.struct = function struct (defn, indent, highlighter) {
  if (typeof defn.fields !== 'object') {
    throw new Error('Invalid schema, struct requires a "fields" map')
  }

  let str = highlighter.punctuation('{')

  for (const [name, fieldDefn] of Object.entries(defn.fields)) {
    const optional = fieldDefn.optional === true ? highlighter.keyword('optional') + ' ' : ''
    const nullable = fieldDefn.nullable === true ? highlighter.keyword('nullable') + ' ' : ''
    let fieldRepr = ''
    if (defn.representation && defn.representation.map && typeof defn.representation.map.fields === 'object') {
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
          if (hasImplicit) {
            fieldRepr += `${highlighter.keyword('implicit')} ${highlighter.string(`"${fr.implicit}"`)}`
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

  if (defn.representation) {
    if (typeof defn.representation.listpairs === 'object') {
      str += ` ${highlighter.builtin('representation')} listpairs`
    } else if (typeof defn.representation.stringjoin === 'object') {
      if (typeof defn.representation.stringjoin.join !== 'string') {
        throw new Error('Invalid schema, struct stringjoin representations require an join string')
      }
      str += ` ${highlighter.builtin('representation')} stringjoin ${highlighter.punctuation('{')}\n`
      str += `${indent}join ${highlighter.string(`"${defn.representation.stringjoin.join}"`)}\n`
      str += fieldOrder(indent, defn.representation.stringjoin.fieldOrder, highlighter)
      str += highlighter.punctuation('}')
    } else if (typeof defn.representation.stringpairs === 'object') {
      str += stringpairs(indent, 'struct', defn.representation.stringpairs, highlighter)
    } else if (typeof defn.representation.tuple === 'object') {
      str += ` ${highlighter.builtin('representation')} tuple`
      if (Array.isArray(defn.representation.tuple.fieldOrder)) {
        str += ` ${highlighter.punctuation('{')}\n`
        str += fieldOrder(indent, defn.representation.tuple.fieldOrder, highlighter)
        str += highlighter.punctuation('}')
      }
    } else if (typeof defn.representation.advanced === 'string') {
      str += ` ${highlighter.builtin('representation')} advanced ${defn.representation.advanced}`
    }
  }

  return str
}

function fieldOrder (indent, fieldOrder, highlighter) {
  let str = ''
  if (Array.isArray(fieldOrder)) {
    const fo = fieldOrder.map((f) => highlighter.string(`"${f}"`)).join(', ')
    str += `${indent}fieldOrder ${highlighter.punctuation('[')}${fo}${highlighter.punctuation(']')}\n`
  }
  return str
}

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

printTypeTerm.union = function union (defn, indent, highlighter) {
  if (typeof defn.representation !== 'object') {
    throw new Error('Invalid schema, unions require a representation')
  }

  let str = highlighter.punctuation('{')

  if (typeof defn.representation.kinded === 'object') {
    for (const [kind, type] of Object.entries(defn.representation.kinded)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${kind}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} kinded`
  } else if (typeof defn.representation.keyed === 'object') {
    for (const [key, type] of Object.entries(defn.representation.keyed)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${highlighter.string(`"${key}"`)}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} keyed`
  } else if (typeof defn.representation.byteprefix === 'object') {
    for (const [type, key] of Object.entries(defn.representation.byteprefix)) {
      str += `\n${indent}${highlighter.punctuation('|')} ${printTypeTerm(type, indent, highlighter)} ${key}`
    }
    str += `\n${highlighter.punctuation('}')} ${highlighter.builtin('representation')} byteprefix`
  } else if (typeof defn.representation.inline === 'object') {
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
  } else if (typeof defn.representation.envelope === 'object') {
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

printTypeTerm.enum = function _enum (defn, indent, highlighter) {
  if (typeof defn.representation !== 'object') {
    throw new Error('Invalid schema, enum requires a "representation" map')
  }
  if (typeof defn.representation.string !== 'object' && typeof defn.representation.int !== 'object') {
    throw new Error('Invalid schema, enum requires a "string" or "int" representation map')
  }

  let str = highlighter.punctuation('{')

  for (const ev of Object.keys(defn.members)) {
    str += `\n${indent}${highlighter.punctuation('|')} ${ev}`
    const sv = (defn.representation.string && defn.representation.string[ev]) ||
      (defn.representation.int && defn.representation.int[ev])
    if (sv !== undefined) {
      str += ` ${highlighter.punctuation('(')}${highlighter.string(`"${sv}"`)}${highlighter.punctuation(')')}`
    }
  }

  str += `\n${highlighter.punctuation('}')}`
  if (defn.representation.int) {
    str += ` ${highlighter.builtin('representation')} int`
  }
  return str
}

module.exports = print
