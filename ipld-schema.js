const parser = require('./parser')
const is = require('@sindresorhus/is')

const kindTypes = {
  String: { kind: 'string' },
  Int: { kind: 'int' }
}

class Schema {
  constructor (schemaText) {
    this.descriptor = parser.parse(schemaText).schema
  }

  load (block, rootType) {
    return loadBlock(this, block, rootType)
  }

  validate (block, rootType) {
    validateType(this, block, rootType)
  }
}

function findTypeDescriptor (schema, typeName) {
  const type = schema.descriptor[typeName] || kindTypes[typeName]

  if (typeof type !== 'object') {
    throw new Error(`Root type '${typeName}' not found in schema`)
  }

  return type
}

function loadBlock (schema, block, typeName) {
  console.log('loading', block, `as schema#${typeName}`)
  const type = findTypeDescriptor(schema, typeName)

  if (type.kind === 'int' || type.kind === 'float' || type.kind === 'string' || type.kind === 'bool') {
    return block
  } else if (type.kind === 'enum') {
    return block
  } else if (type.kind === 'list') {
    // TODO: load complex valueTypes
    return block
  } else if (type.kind === 'map') {
    // TODO: load complex keyType and valueTypes
    return block
  } else if (type.kind === 'struct') {
    let struct = {}
    let fields = Object.entries(type.fields) // TODO: ensure we have a "fields"
    for (let [ fieldName, fieldDescriptor ] of fields) {
      loadField(struct, block, fieldName, fieldDescriptor, typeName)
    }
    return struct
  } else if (type.kind === 'union') {
    // TODO: verify `type.representation` exists
    if (isKeyedUnion(type)) {
      let union = {}
      let fields = Object.entries(type.representation.keyed)
      for (let [ field, fieldType ] of fields) {
        if (block[field] !== undefined) {
          loadField(union, block, field, { type: fieldType }, typeName)
        }
      }
      return union
    }

    if (isInlineUnion(type)) {
      // TODO: verify representation discriminatorKey exists and is a string
      let discriminatorKey = type.representation.inline.discriminatorKey
      // TODO: verify and discriminantTable exists and is a {String:String}
      let discriminantTable = type.representation.inline.discriminantTable
      let discriminator = block[discriminatorKey]
      let subTypeName = discriminantTable[discriminator]
      // TODO: ensure our discriminator doesn't get included in the loading of subTypeName
      // does it matter if it's a struct and will be ignored?
      return loadBlock(schema, block, subTypeName)
    }

    if (isKindedUnion(type)) {
      // TODO: only works for primitive types, not objets or arrays that should be copied
      // or further parsed
      return block
    }

    if (isEnvelopeUnion(type)) {
      // TODO: verify representation discriminatorKey exists and is a string
      let discriminatorKey = type.representation.envelope.discriminatorKey
      let contentKey = type.representation.envelope.contentKey
      // TODO: verify and discriminantTable exists and is a {String:String}
      let discriminantTable = type.representation.envelope.discriminantTable
      let discriminator = block[discriminatorKey]
      let subTypeName = discriminantTable[discriminator]
      return loadBlock(schema, block[contentKey], subTypeName)
    }
  }

  throw new Error(`Unimplemented kind ${type.kind}`)
}

function loadField (struct, part, fieldName, fieldDescriptor, typeName) {
  if (fieldDescriptor.type === 'Int') { // TODO: ensure we have a "type"
    loadIntField(struct, part, fieldName, typeName)
  } else if (fieldDescriptor.type === 'String') {
    loadStringField(struct, part, fieldName, typeName)
  } else if (fieldDescriptor.type === 'Bool') {
    loadBoolField(struct, part, fieldName, typeName)
  }
}

function loadIntField (struct, part, fieldName, typeName) {
  // TODO: is it OK for string to int coercion? is a decimal point with 0 OK?
  struct[fieldName] = typeof part[fieldName] === 'number' ? part[fieldName] : parseInt(part[fieldName], 10)
}

function loadStringField (struct, part, fieldName, typeName) {
  struct[fieldName] = part[fieldName]
}

function loadBoolField (struct, part, fieldName, typeName) {
  struct[fieldName] = !!part[fieldName]
}

function validateType (schema, block, typeName) {
  const type = findTypeDescriptor(schema, typeName)

  console.log('validating', block, `against schema#${typeName} (${type.kind})`)

  if (type.kind === 'int') {
    validateInt(block, typeName)
  } else if (type.kind === 'float') {
    validateFloat(block, typeName)
  } else if (type.kind === 'string') {
    validateString(block, typeName)
  } else if (type.kind === 'bool') {
    validateBool(block, typeName)
  } else if (type.kind === 'enum') {
    // TODO: verify type.members exists and is an object with keys
    validateEnum(block, Object.keys(type.members), typeName)
  } else if (type.kind === 'list') {
    // TODO: verify type.valueType exists
    validateList(schema, block, type.valueType, typeName)
  } else if (type.kind === 'map') {
    // TODO: verify type.keyType and type.valueType exists
    // TODO: verify that type.keyType has a 'string' representation
    validateMap(schema, block, type.keyType, type.valueType, typeName)
  } else if (type.kind === 'struct') {
    let fields = Object.entries(type.fields) // TODO: ensure we have a "fields"
    for (let [ fieldName, fieldDescriptor ] of fields) {
      validateField(block, fieldName, fieldDescriptor, typeName)
    }
    return true
  } else if (type.kind === 'union') {
    // TODO: verify `type.representation` exists
    if (isKeyedUnion(type)) {
      let found = false
      let fields = Object.entries(type.representation.keyed)
      for (let [ field, fieldType ] of fields) {
        if (block[field] !== undefined) {
          found = true
          validateField(block, field, { type: fieldType }, typeName)
        }
      }
      if (!found) {
        throw new Error(`Schema validation error: no key of keyed union ${typeName} found`)
      }
    }

    if (isInlineUnion(type)) {
      // TODO: verify representation discriminatorKey exists and is a string
      let discriminatorKey = type.representation.inline.discriminatorKey
      validateDiscriminatorKey(block, discriminatorKey, typeName)
      // TODO: verify and discriminantTable exists and is a {String:String}
      let discriminantTable = type.representation.inline.discriminantTable
      let discriminator = block[discriminatorKey]
      validateDiscriminator(block, discriminator, discriminantTable, typeName)
      let subTypeName = discriminantTable[discriminator]
      // TODO: for strict validation we'll need to remove the discriminator from a copy
      // before passing it on to be validated as subTypeName
      validateType(schema, block, subTypeName)
    }

    if (isKindedUnion(type)) {
      let allowedKinds = Object.keys(type.representation.kinded)
      validateKinded(block, allowedKinds, typeName)
    }

    if (isEnvelopeUnion(type)) {
      // TODO: verify representation discriminatorKey exists and is a string
      let discriminatorKey = type.representation.envelope.discriminatorKey
      validateDiscriminatorKey(block, discriminatorKey, typeName)
      let contentKey = type.representation.envelope.contentKey
      validateContentKey(block, contentKey, typeName)
      // TODO: verify and discriminantTable exists and is a {String:String}
      let discriminantTable = type.representation.envelope.discriminantTable
      let discriminator = block[discriminatorKey]
      validateDiscriminator(block, discriminator, discriminantTable, typeName)
      let subTypeName = discriminantTable[discriminator]
      validateType(schema, block[contentKey], subTypeName)
    }

    return true
  }

  return true
}

function validateField (part, fieldName, fieldDescriptor, typeName) {
  validateExists(part, fieldName, typeName)
  if (fieldDescriptor.type === 'Int') { // TODO: ensure we have a "type"
    validateIntField(part, fieldName, typeName)
  } else if (fieldDescriptor.type === 'String') {
    validateStringField(part, fieldName, typeName)
  } else if (fieldDescriptor.type === 'Bool') {
    validateBoolField(part, fieldName, typeName)
  }
}

function validateList (schema, block, valueType, typeName) {
  if (!is.array(block)) {
    throw new Error(`Schema validation error: expected ${typeName} enum to be a array`)
  }
  for (let e of block) {
    validateType(schema, e, valueType)
  }
}

function validateMap (schema, block, keyType, valueType, typeName) {
  if (!is.object(block) || is.array(block)) {
    throw new Error(`Schema validation error: expected ${typeName} enum to be an object`)
  }
  for (let [ k, v ] of Object.entries(block)) {
    validateType(schema, k, keyType)
    validateType(schema, v, valueType)
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

function validateIntField (part, fieldName, typeName) {
  // TODO: is it OK for string to int coercion? is a decimal point with 0 OK?
  /* eslint-disable-next-line */
  if (typeof part[fieldName] !== 'number' && parseInt(part[fieldName], 10) != part[fieldName]) {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to be an int`)
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

function validateStringField (part, fieldName, typeName) {
  if (typeof part[fieldName] !== 'string') {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to be a string`)
  }
}

function validateString (value, typeName) {
  if (!is.string(value)) {
    throw new Error(`Schema validation error: expected ${typeName} to be a string`)
  }
}

function validateBoolField (part, fieldName, typeName) {
  if (typeof part[fieldName] !== 'boolean') {
    throw new Error(`Schema validation error: expected '${fieldName}' of ${typeName} to be a boolean`)
  }
}

function validateBool (value, typeName) {
  if (!is.boolean(value)) {
    throw new Error(`Schema validation error: expected ${typeName} to be a boolean`)
  }
}

function validateDiscriminatorKey (part, discriminatorKey, typeName) {
  if (typeof part[discriminatorKey] !== 'string') {
    throw new Error(`Schema validation error: discriminator key '${discriminatorKey}' of ${typeName} is not a String`)
  }
}

function validateContentKey (part, contentKey, typeName) {
  if (part[contentKey] === undefined) {
    throw new Error(`Schema validation error: content key '${contentKey}' of ${typeName} does not exist`)
  }
}

function validateDiscriminator (part, discriminator, discriminantTable, typeName) {
  if (typeof discriminantTable[discriminator] !== 'string') {
    throw new Error(`Schema validation error: discriminator '${discriminator}' of ${typeName} does not exist in the discriminator table`)
  }
}

function validateKinded (block, allowedKinds, typeName) {
  for (let kind of allowedKinds) {
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

module.exports = Schema
