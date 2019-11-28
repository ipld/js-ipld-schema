const is = {
  object: (o, name, msg) => {
    if (typeof o !== 'object') {
      throw new TypeError(`${name} is not an object` + (msg ? `: ${msg}` : ''))
    }
  },

  string: (o, name, msg) => {
    if (typeof o !== 'string') {
      throw new TypeError(`${name} is not an string` + (msg ? `: ${msg}` : ''))
    }
  },

  _typeNameish: (s, type, warnings) => {
    if ((/[^a-z0-9_]/i).test(s)) {
      throw new TypeError(`Invalid ${type} "${s}": may only contain ASCII alphanumeric and underscore characters`)
    }
    if (warnings && /^[^A-Z]/.test(s)) {
      warnings(`${type} "${s}" should begin with an upper-case ASCII alphabetic character`)
    }
  },

  typeName: (s, warnings) => {
    is._typeNameish(s, 'TypeName', warnings)
  },

  advancedDataLayoutName: (s, warnings) => {
    is._typeNameish(s, 'AdvancedDataLayoutName ', warnings)
  }
}

function checkSchema (descriptor, warnings) {
  is.object(descriptor, 'descriptor')

  if (descriptor.advanced) {
    is.object(descriptor.advanced, 'advanced')
    for (const [advancedName, advanced] of Object.entries(descriptor.advanced)) {
      is.advancedDataLayoutName(advancedName, warnings)
      is.object(advanced, `${advancedName} advanced descriptor`)
      is.string(advanced.kind, `${advancedName} kind`, 'every advanced requires a "kind"')
      if (advanced.kind !== 'advanced') {
        throw new TypeError(`${advancedName} kind must be "advanced"`)
      }
    }
  }

  is.object(descriptor.types, 'types')

  for (const [typeName, type] of Object.entries(descriptor.types)) {
    is.typeName(typeName, warnings)
    is.object(type, `${typeName} type descriptor`)
    is.string(type.kind, `${typeName} kind`, 'every type requires a "kind"')
  }

  return true
}

module.exports = checkSchema
