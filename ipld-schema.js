const is = require('@sindresorhus/is')
const parser = require('./parser')
const { transformError } = require('./util')
const print = require('./print')
const check = require('./check')

const kindTypes = {
  String: { kind: 'string' },
  Int: { kind: 'int' }
}

class Schema {
  constructor (schemaText) {
    this.descriptor = parse(schemaText)
  }

  load (block, rootType) {
    return loadAndValidateType(true, this, block, rootType)
  }

  validate (block, rootType) {
    return loadAndValidateType(false, this, block, rootType)
  }
}

function findTypeDescriptor (schema, typeName) {
  const type = schema.descriptor.types[typeName] || kindTypes[typeName]

  if (typeof type !== 'object') {
    throw new Error(`Root type '${typeName}' not found in schema`)
  }

  return type
}

function loadAndValidateType (load, schema, value, typeName) {
  // console.log('loading', value, `as schema#${typeName}`)
  const type = findTypeDescriptor(schema, typeName)

  if (type.kind === 'int') {
    validateInt(value, typeName)
    return load ? value : true
  } else if (type.kind === 'float') {
    validateFloat(value, typeName)
    return load ? value : true
  } else if (type.kind === 'string') {
    validateString(value, typeName)
    return load ? value : true
  } else if (type.kind === 'bool') {
    validateBool(value, typeName)
    return load ? value : true
  } else if (type.kind === 'enum') {
    // TODO: verify type.representation.string exists and is an object with keys
    // TODO: support representation.int too
    // TOOD: support renamed values for string enums too
    validateEnum(value, Object.keys(type.members), typeName)
    return load ? value : true
  } else if (type.kind === 'list') {
    // TODO: verify type.valueType exists
    validateList(schema, value, type.valueType, typeName)
    // TODO: load complex valueTypes
    return load ? value : true
  } else if (type.kind === 'map') {
    // TODO: verify type.keyType and type.valueType exists
    // TODO: verify that type.keyType has a 'string' representation
    validateMap(schema, value, type.keyType, type.valueType, typeName)
    // TODO: load complex keyType and valueTypes
    return load ? value : true
  } else if (type.kind === 'struct') {
    const fields = Object.entries(type.fields) // TODO: ensure we have a "fields"
    const struct = load ? {} : null
    for (const [fieldName, fieldDescriptor] of fields) {
      loadAndValidateField(struct, value, fieldName, fieldDescriptor, typeName)
    }
    return load ? struct : true
  } else if (type.kind === 'union') {
    // TODO: verify `type.representation` exists
    if (isKeyedUnion(type)) {
      let found = false
      const union = load ? {} : null
      const fields = Object.entries(type.representation.keyed)
      for (const [field, fieldType] of fields) {
        if (value[field] !== undefined) {
          found = true
          loadAndValidateField(union, value, field, { type: fieldType }, typeName)
        }
      }

      if (!found) {
        throw new Error(`Schema validation error: no key of keyed union ${typeName} found`)
      }

      return load ? union : true
    }

    if (isInlineUnion(type)) {
      // TODO: verify representation discriminantKey exists and is a string
      const discriminantKey = type.representation.inline.discriminantKey
      validatediscriminantKey(value, discriminantKey, typeName)
      // TODO: verify and discriminantTable exists and is a {String:String}
      const discriminantTable = type.representation.inline.discriminantTable
      const discriminant = value[discriminantKey]
      validatediscriminant(value, discriminant, discriminantTable, typeName)
      const subTypeName = discriminantTable[discriminant]
      // TODO: ensure our discriminant doesn't get included in the loading of subTypeName
      // does it matter if it's a struct and will be ignored?
      return loadAndValidateType(load, schema, value, subTypeName)
    }

    if (isKindedUnion(type)) {
      // TODO: only works for primitive types, not objets or arrays that should be copied
      // or further parsed
      const allowedKinds = Object.keys(type.representation.kinded)
      validateKinded(value, allowedKinds, typeName)
      return load ? value : true
    }

    if (isEnvelopeUnion(type)) {
      // TODO: verify representation discriminantKey exists and is a string
      const discriminantKey = type.representation.envelope.discriminantKey
      validatediscriminantKey(value, discriminantKey, typeName)
      const contentKey = type.representation.envelope.contentKey
      validateContentKey(value, contentKey, typeName)
      // TODO: verify and discriminantTable exists and is a {String:String}
      const discriminantTable = type.representation.envelope.discriminantTable
      const discriminant = value[discriminantKey]
      validatediscriminant(value, discriminant, discriminantTable, typeName)
      const subTypeName = discriminantTable[discriminant]
      return loadAndValidateType(load, schema, value[contentKey], subTypeName)
    }
  }

  throw new Error(`Unimplemented kind ${type.kind}`)
}

function loadAndValidateField (obj, part, fieldName, fieldDescriptor, typeName) {
  validateExists(part, fieldName, typeName)
  if (fieldDescriptor.type === 'Int') { // TODO: ensure we have a "type"
    loadAndValidateIntField(obj, part, fieldName, typeName)
  } else if (fieldDescriptor.type === 'String') {
    loadAndValidateStringField(obj, part, fieldName, typeName)
  } else if (fieldDescriptor.type === 'Bool') {
    loadAndValidateBoolField(obj, part, fieldName, typeName)
  }
}

function validateList (schema, block, valueType, typeName) {
  if (!is.array(block)) {
    throw new Error(`Schema validation error: expected ${typeName} enum to be a array`)
  }
  for (const e of block) {
    loadAndValidateType(false, schema, e, valueType)
  }
}

function validateMap (schema, block, keyType, valueType, typeName) {
  if (!is.object(block) || is.array(block)) {
    throw new Error(`Schema validation error: expected ${typeName} enum to be an object`)
  }
  for (const [k, v] of Object.entries(block)) {
    loadAndValidateType(false, schema, k, keyType)
    loadAndValidateType(false, schema, v, valueType)
  }
}

function validateEnum (value, members, typeName) {
  if (!is.string(value)) {
    throw new Error(`Schema validation error: expected ${typeName} enum to be a string`)
  }
  if (!members.includes(value)) {
    throw new Error(`Schema validation error: ${typeName} not a valid string`)
  }
}

function loadAndValidateIntField (obj, part, fieldName, typeName) {
  // TODO: is it OK for string to int coercion? is a decimal point with 0 OK?
  /* eslint-disable-next-line */
  if (typeof part[fieldName] !== 'number' && parseInt(part[fieldName], 10) != part[fieldName]) {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to be an int`)
  }

  if (obj) {
    // TODO: is it OK for string to int coercion? is a decimal point with 0 OK?
    obj[fieldName] = typeof part[fieldName] === 'number' ? part[fieldName] : parseInt(part[fieldName], 10)
  }
}

function validateInt (value, typeName) {
  if (!is.integer(value)) {
    throw new Error(`Schema validation error: expected ${typeName} to be an int`)
  }
}

function validateFloat (value, typeName) {
  if (!is.number(value)) {
    throw new Error(`Schema validation error: expected ${typeName} to be a number`)
  }
}

function loadAndValidateStringField (obj, part, fieldName, typeName) {
  if (typeof part[fieldName] !== 'string') {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to be a string`)
  }

  if (obj) {
    obj[fieldName] = part[fieldName]
  }
}

function validateString (value, typeName) {
  if (!is.string(value)) {
    throw new Error(`Schema validation error: expected ${typeName} to be a string`)
  }
}

function loadAndValidateBoolField (obj, part, fieldName, typeName) {
  if (typeof part[fieldName] !== 'boolean') {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to be a boolean`)
  }

  if (obj) {
    obj[fieldName] = !!part[fieldName]
  }
}

function validateBool (value, typeName) {
  if (!is.boolean(value)) {
    throw new Error(`Schema validation error: expected ${typeName} to be a boolean`)
  }
}

function validatediscriminantKey (part, discriminantKey, typeName) {
  if (typeof part[discriminantKey] !== 'string') {
    throw new Error(`Schema validation error: discriminant key '${discriminantKey}' of ${typeName} is not a String`)
  }
}

function validateContentKey (part, contentKey, typeName) {
  if (part[contentKey] === undefined) {
    throw new Error(`Schema validation error: content key '${contentKey}' of ${typeName} does not exist`)
  }
}

function validatediscriminant (part, discriminant, discriminantTable, typeName) {
  if (typeof discriminantTable[discriminant] !== 'string') {
    throw new Error(`Schema validation error: discriminant '${discriminant}' of ${typeName} does not exist in the discriminant table`)
  }
}

function validateKinded (block, allowedKinds, typeName) {
  for (const kind of allowedKinds) {
    if (kind === 'int') {
      if (is.integer(block)) {
        return
      }
    } else if (kind === 'string') {
      if (is.string(block)) {
        return
      }
    } else if (kind === 'bool') {
      if (is.boolean(block)) {
        return
      }
    } else if (kind === 'map') {
      if (is.object(block) && !is.buffer(block) && !is.array(block)) { // anything else?
        return
      }
    } else {
      throw new Error(`Unsupported kinded check kind ${kind}`)
    }
  }
  throw new Error(`Schema validation error: could not match any kind allowed by ${typeName}`)
}

function validateExists (part, fieldName, typeName) {
  if (part[fieldName] === undefined) {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to exist`)
  }
}

function isKeyedUnion (type) {
  return typeof type.representation.keyed === 'object'
}

function isInlineUnion (type) {
  return typeof type.representation.inline === 'object'
}

function isEnvelopeUnion (type) {
  return typeof type.representation.envelope === 'object'
}

function isKindedUnion (type) {
  return typeof type.representation.kinded === 'object'
}

function parse (text) {
  try {
    return parser.parse(text)
  } catch (err) {
    throw transformError(err)
  }
}

module.exports = Schema
module.exports.parse = parse
module.exports.print = function _print (descriptor) {
  check(descriptor, true)
  return print(descriptor)
}
