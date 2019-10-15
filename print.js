function print (schema, indent = '  ') {
  if (!schema || typeof schema.types !== 'object') {
    throw new Error('Invalid schema')
  }

  let str = ''

  str += printAdvanced(schema, indent)
  str += printTypes(schema, indent)

  return str
}

function printAdvanced (schema, indent) {
  let str = ''

  if (typeof schema.advanced === 'object') {
    for (const advanced of Object.keys(schema.advanced)) {
      str += `advanced ${advanced}\n\n`
    }
  }

  return str
}

function printTypes (schema, indent) {
  let str = ''

  for (const [type, defn] of Object.entries(schema.types)) {
    if (typeof defn.kind !== 'string') {
      throw new Error(`Invalid schema ${type} doesn't have a kind`)
    }

    str += `type ${type} ${printType(defn, indent)}\n\n`
  }

  return str.replace(/\n\n$/m, '')
}

function printType (defn, indent) {
  if (['map', 'list', 'link', 'copy'].includes(defn.kind)) {
    return printTypeTerm(defn, indent)
  }

  if (['struct', 'union', 'enum'].includes(defn.kind)) {
    return `${defn.kind} ${printTypeTerm(defn, indent)}`
  }

  if (defn.kind === 'bytes' && defn.representation && typeof defn.representation.advanced === 'string') {
    return `bytes representation advanced ${defn.representation.advanced}`
  }

  return defn.kind
}

function printTypeTerm (defn, indent) {
  if (typeof defn === 'string') {
    return defn
  }

  if (typeof printTypeTerm[defn.kind] !== 'function') {
    throw new Error(`Invalid schema unsupported kind (${defn.kind})`)
  }

  return printTypeTerm[defn.kind](defn, indent)
}

printTypeTerm.link = function link (defn) {
  return `&${printTypeTerm(defn.expectedType || 'Any')}`
}

printTypeTerm.copy = function copy (defn) {
  return `= ${defn.fromType}`
}

printTypeTerm.map = function map (defn, indent) {
  if (typeof defn.keyType !== 'string') {
    throw new Error('Invalid schema, map definition needs a "keyType"')
  }
  if (!defn.valueType) {
    throw new Error('Invalid schema, map definition needs a "keyType"')
  }

  const nullable = defn.valueNullable === true ? 'nullable ' : ''
  let str = `{${printTypeTerm(defn.keyType)}:${nullable}${printTypeTerm(defn.valueType)}}`
  if (defn.representation) {
    if (typeof defn.representation.listpairs === 'object') {
      str += ' representation listpairs'
    } else if (typeof defn.representation.stringpairs === 'object') {
      str += stringpairs(indent, 'map', defn.representation.stringpairs)
    } else if (typeof defn.representation.advanced === 'string') {
      str += ` representation advanced ${defn.representation.advanced}`
    }
  }
  return str
}

printTypeTerm.list = function list (defn) {
  if (!defn.valueType) {
    throw new Error('Invalid schema, list definition needs a "keyType"')
  }

  const nullable = defn.valueNullable === true ? 'nullable ' : ''
  let str = `[${nullable}${printTypeTerm(defn.valueType)}]`

  if (defn.representation) {
    if (typeof defn.representation.advanced === 'string') {
      str += ` representation advanced ${defn.representation.advanced}`
    }
  }

  return str
}

printTypeTerm.struct = function struct (defn, indent) {
  if (typeof defn.fields !== 'object') {
    throw new Error('Invalid schema, struct requires a "fields" map')
  }

  let str = '{'

  for (const [name, fieldDefn] of Object.entries(defn.fields)) {
    const optional = fieldDefn.optional === true ? 'optional ' : ''
    const nullable = fieldDefn.nullable === true ? 'nullable ' : ''
    let fieldRepr = ''
    if (defn.representation && defn.representation.map && typeof defn.representation.map.fields === 'object') {
      const fr = defn.representation.map.fields[name]
      if (typeof fr === 'object') {
        const hasRename = typeof fr.rename === 'string'
        const hasImplicit = fr.implicit !== undefined
        if (hasRename || hasImplicit) {
          fieldRepr = ' ('
          if (hasRename) {
            fieldRepr += `rename "${fr.rename}"`
            if (hasImplicit) {
              fieldRepr += ' '
            }
          }
          if (hasImplicit) {
            fieldRepr += `implicit "${fr.implicit}"`
          }
          fieldRepr += ')'
        }
      }
    }

    const fieldType = typeof fieldDefn.type === 'string' ? fieldDefn.type : printTypeTerm(fieldDefn.type)
    str += `\n${indent}${name} ${optional}${nullable}${fieldType}${fieldRepr}`
  }

  if (str[str.length - 1] !== '{') {
    str += '\n'
  }
  str += '}'

  if (defn.representation) {
    if (typeof defn.representation.listpairs === 'object') {
      str += ' representation listpairs'
    } else if (typeof defn.representation.stringjoin === 'object') {
      if (typeof defn.representation.stringjoin.join !== 'string') {
        throw new Error('Invalid schema, struct stringjoin representations require an join string')
      }
      str += ' representation stringjoin {\n'
      str += `${indent}join "${defn.representation.stringjoin.join}"\n`
      str += fieldOrder(indent, defn.representation.stringjoin.fieldOrder)
      str += '}'
    } else if (typeof defn.representation.stringpairs === 'object') {
      str += stringpairs(indent, 'struct', defn.representation.stringpairs)
    } else if (typeof defn.representation.tuple === 'object') {
      str += ' representation tuple'
      if (Array.isArray(defn.representation.tuple.fieldOrder)) {
        str += ' {\n'
        str += fieldOrder(indent, defn.representation.tuple.fieldOrder)
        str += '}'
      }
    } else if (typeof defn.representation.stringpairs === 'object') {
      str += stringpairs(indent, 'struct', defn.representation.stringpairs)
    } else if (typeof defn.representation.advanced === 'string') {
      str += ` representation advanced ${defn.representation.advanced}`
    }
  }

  return str
}

function fieldOrder (indent, fieldOrder) {
  let str = ''
  if (Array.isArray(fieldOrder)) {
    const fo = fieldOrder.map((f) => `"${f}"`).join(', ')
    str += `${indent}fieldOrder [${fo}]\n`
  }
  return str
}

function stringpairs (indent, kind, stringpairs) {
  let str = ''
  if (typeof stringpairs.innerDelim !== 'string') {
    throw new Error(`Invalid schema, ${kind} stringpairs representations require an innerDelim string`)
  }
  if (typeof stringpairs.entryDelim !== 'string') {
    throw new Error(`Invalid schema, ${kind} stringpairs representations require an entryDelim string`)
  }
  str += ' representation stringpairs {\n'
  str += `${indent}innerDelim "${stringpairs.innerDelim}"\n`
  str += `${indent}entryDelim "${stringpairs.entryDelim}"\n`
  str += '}'
  return str
}

printTypeTerm.union = function union (defn, indent) {
  if (typeof defn.representation !== 'object') {
    throw new Error('Invalid schema, unions require a representation')
  }

  let str = '{'

  if (typeof defn.representation.kinded === 'object') {
    for (const [kind, type] of Object.entries(defn.representation.kinded)) {
      str += `\n${indent}| ${printTypeTerm(type)} ${kind}`
    }
    str += '\n} representation kinded'
  } else if (typeof defn.representation.keyed === 'object') {
    for (const [key, type] of Object.entries(defn.representation.keyed)) {
      str += `\n${indent}| ${printTypeTerm(type)} "${key}"`
    }
    str += '\n} representation keyed'
  } else if (typeof defn.representation.byteprefix === 'object') {
    for (const [type, key] of Object.entries(defn.representation.byteprefix)) {
      str += `\n${indent}| ${printTypeTerm(type)} ${key}`
    }
    str += '\n} representation byteprefix'
  } else if (typeof defn.representation.inline === 'object') {
    if (typeof defn.representation.inline.discriminantTable !== 'object') {
      throw new Error('Invalid schema, inline unions require a discriminantTable map')
    }
    if (typeof defn.representation.inline.discriminantKey !== 'string') {
      throw new Error('Invalid schema, inline unions require a discriminantKey string')
    }
    for (const [key, type] of Object.entries(defn.representation.inline.discriminantTable)) {
      str += `\n${indent}| ${printTypeTerm(type)} "${key}"`
    }
    str += `\n} representation inline {\n${indent}discriminantKey "${defn.representation.inline.discriminantKey}"\n}`
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
      str += `\n${indent}| ${printTypeTerm(type)} "${key}"`
    }
    str += '\n} representation envelope {'
    str += `\n${indent}discriminantKey "${defn.representation.envelope.discriminantKey}"`
    str += `\n${indent}contentKey "${defn.representation.envelope.contentKey}"`
    str += '\n}'
  } else {
    throw new Error(`Invalid schema, unknown union representation type ${Object.keys(defn.representation)[0]}`)
  }

  return str
}

printTypeTerm.enum = function _enum (defn, indent) {
  if (typeof defn.representation !== 'object') {
    throw new Error('Invalid schema, enum requires a "representation" map')
  }
  if (typeof defn.representation.string !== 'object' && typeof defn.representation.int !== 'object') {
    throw new Error('Invalid schema, enum requires a "string" or "int" representation map')
  }

  let str = '{'

  for (const ev of Object.keys(defn.members)) {
    str += `\n${indent}| ${ev}`
    const sv = (defn.representation.string && defn.representation.string[ev]) ||
      (defn.representation.int && defn.representation.int[ev])
    if (sv !== undefined) {
      str += ` ("${sv}")`
    }
  }

  str += '\n}'
  if (defn.representation.int) {
    str += ' representation int'
  }
  return str
}

module.exports = print
