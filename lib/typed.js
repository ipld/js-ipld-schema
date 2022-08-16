/* eslint-disable no-new-func */

/**
 * @typedef {import('../schema-schema').EnumMember} EnumMember
 * @typedef {import('../schema-schema').KindInt} KindInt
 * @typedef {import('../schema-schema').KindString} KindString
 * @typedef {import('../schema-schema').AnyScalar} AnyScalar
 * @typedef {import('../schema-schema').Schema} Schema
 * @typedef {import('../schema-schema').TypeDefn} TypeDefn
 * @typedef {import('../schema-schema').InlineDefn} InlineDefn
 * @typedef {import('../schema-schema').TypeName} TypeName
 * @typedef {import('../schema-schema').TypeNameOrInlineDefn} TypeNameOrInlineDefn
 * @typedef {(obj:any)=>undefined|any} TypeTransformerFunction
 */

const safeNameRe = /^\$*[a-z][a-z0-9_]+$/i

/**
 * @param {string} name
 * @returns {string}
 */
export function safeReference (name) {
  return safeNameRe.test(name) ? `.${name}` : `['${name}']`
}

/**
 * @param {string} name
 * @returns {string}
 */
export function safeFieldReference (name) {
  return safeNameRe.test(name) ? `${name}` : `'${name}'`
}

/**
 * @param {string[]|number[]} list
 * @returns {string}
 */
function fromArray (list) {
  return JSON.stringify(list).replace(/"/g, '\'').replace(/,/g, ', ')
}

const KindsDefn =
`const Kinds = {
  Null: /** @returns {undefined|null} */ (/** @type {any} */ obj) => obj === null ? obj : undefined,
  Int: /** @returns {undefined|number} */ (/** @type {any} */ obj) => Number.isInteger(obj) ? obj : undefined,
  Float: /** @returns {undefined|number} */ (/** @type {any} */ obj) => typeof obj === 'number' && Number.isFinite(obj) ? obj : undefined,
  String: /** @returns {undefined|string} */ (/** @type {any} */ obj) => typeof obj === 'string' ? obj : undefined,
  Bool: /** @returns {undefined|boolean} */ (/** @type {any} */ obj) => typeof obj === 'boolean' ? obj : undefined,
  Bytes: /** @returns {undefined|Uint8Array} */ (/** @type {any} */ obj) => obj instanceof Uint8Array ? obj : undefined,
  Link: /** @returns {undefined|object} */ (/** @type {any} */ obj) => obj !== null && typeof obj === 'object' && obj.asCID === obj ? obj : undefined,
  List: /** @returns {undefined|Array} */ (/** @type {any} */ obj) => Array.isArray(obj) ? obj : undefined,
  Map: /** @returns {undefined|object} */ (/** @type {any} */ obj) => obj !== null && typeof obj === 'object' && obj.asCID !== obj && !Array.isArray(obj) && !(obj instanceof Uint8Array) ? obj : undefined
}`

const ScalarKindNames = ['Null', 'Int', 'Float', 'String', 'Bool', 'Bytes', 'Link']
const ScalarKindNamesLower = ScalarKindNames.map((n) => n.toLowerCase())
// const TypeKindNames = ['string', 'bool', 'bytes', 'int', 'float', 'map', 'list', 'link', 'union', 'struct', 'enum', 'copy']

/** @type {{ [ k in string]: TypeDefn }} */
const implicits = {
  Null: /** @type {TypeDefnNull} */ { null: {} },
  Int: /** @type {TypeDefnInt} */ { int: {} },
  Float: /** @type {TypeDefnFloat} */ { float: {} },
  String: /** @type {TypeDefnString} */ { string: {} },
  Bool: /** @type {TypeDefnBool} */ { bool: {} },
  Bytes: /** @type {TypeDefnBytes} */ { bytes: {} },
  Link: /** @type {TypeDefnLink} */ { link: {} }
}

implicits.AnyScalar = /** @type {TypeDefnUnion} */ {
  union: {
    members: [
      'Bool',
      'String',
      'Bytes',
      'Int',
      'Float'
    ],
    representation: {
      kinded: {
        bool: 'Bool',
        string: 'String',
        bytes: 'Bytes',
        int: 'Int',
        float: 'Float'
      }
    }
  }
}
implicits.$$AnyMap = /** @type {TypeDefnMap} */ {
  map: {
    keyType: 'String',
    valueType: '$$Any'
  }
}
implicits.$$AnyList = /** @type {TypeDefnList} */ {
  list: {
    valueType: '$$Any'
  }
}
implicits.$$Any = /** @type {TypeDefnUnion} */ {
  union: {
    members: [
      'Bool',
      'String',
      'Bytes',
      'Int',
      'Float',
      'Null',
      'Link',
      '$$AnyMap',
      '$$AnyList'
    ],
    representation: {
      kinded: {
        bool: 'Bool',
        string: 'String',
        bytes: 'Bytes',
        int: 'Int',
        float: 'Float',
        null: 'Null',
        link: 'Link',
        map: '$$AnyMap',
        list: '$$AnyList'
      }
    }
  }
}

/**
 * @param {string} s
 * @returns {string}
 */
function tc (s) {
  return s.charAt(0).toUpperCase() + s.substring(1)
}

/**
 * @param {Schema} schema
 * @param {string} root
 * @returns {{ toTyped: TypeTransformerFunction }}
 */
export function create (schema, root) {
  if (!root || typeof root !== 'string') {
    throw new TypeError('A root is required')
  }

  const builder = new Builder(schema)
  builder.addType(root)

  let fn = builder.dumpTypeTransformers()
  fn += `return Types${safeReference(root)}(obj)`
  // console.log(fn)

  return { toTyped: /** @type {TypeTransformerFunction} */ (new Function('obj', fn)) }
}

export class Builder {
  /**
   * @param {Schema} schema
   */
  constructor (schema) {
    if (!schema || typeof schema.types !== 'object') {
      throw new TypeError('Invalid schema definition')
    }

    // new schema with implicits
    this.schema = {
      types: Object.assign({}, implicits, schema.types)
    }

    /** @type {Record<string, string>} */
    this.typeTransformers = {}
  }

  dumpTypeTransformers () {
    const objKey = (/** @type {string} */ name) => {
      return safeNameRe.test(name) ? name : `'${name}'`
    }
    const fn = `${KindsDefn}\n` +
      '/** @type {{ [k in string]: (obj:any)=>undefined|any}} */\n' +
      `const Types = {\n${Object.entries(this.typeTransformers).map(([name, fn]) => `  ${objKey(name)}: ${fn}`).join(',\n')}\n}\n`
    return fn
  }

  /**
   * @param {TypeName} typeName
   * @param {TypeDefn} [typeDef]
   * @returns {void}
   */
  addType (typeName, typeDef) {
    if (this.typeTransformers[typeName]) { // already added this one
      return
    }

    if (typeName === '$$Any') {
      // special case for $$Any because it's a recursive definition, so we set up a dummy in place so
      // any recursive attempt to add finds a definition before it's set
      this.typeTransformers.$$Any = '() => false'
    }

    if (typeName === 'any') {
      this.addType('$$Any')
      this.typeTransformers.any = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$Any(obj) === undefined ? undefined : obj'
      return
    }

    if (typeDef === undefined && typeName in this.schema.types && this.schema.types[typeName] !== undefined) {
      typeDef = this.schema.types[typeName]
    }
    if (typeDef === undefined) {
      throw new TypeError(`A type must match an existing type definition ("${typeName}")`)
    }
    if (Array.isArray(typeDef) || typeDef == null || typeof typeDef !== 'object') {
      throw new TypeError(`Malformed type definition: not an object: ("${typeName}")`)
    }

    const kind = typeKind(typeDef, typeName)

    if (ScalarKindNamesLower.includes(kind)) {
      this.typeTransformers[typeName] = `Kinds.${tc(kind)}`
      return
    }

    /**
     * @param {TypeNameOrInlineDefn} defType
     * @param {TypeName} name
     * @returns {string}
     */
    const defineType = (defType, name) => {
      if (defType === typeName) {
        throw new Error(`Recursive typedef in type "${typeName}"`)
      }
      let innerTypeName = defType
      if (typeof innerTypeName === 'string') {
        this.addType(innerTypeName)
      } else if (defType != null && !Array.isArray(defType) && typeof defType === 'object') { // anonymous inline map or list!
        typeKind(defType, name) // called for check
        innerTypeName = `${typeName} > ${name} (anon)`
        this.addType(innerTypeName, defType)
      } else {
        throw new Error(`Bad type for "${name}" in "${typeName}"`)
      }
      return innerTypeName
    }

    if ('list' in typeDef) {
      const valueTypeName = defineType(typeDef.list.valueType, 'valueType')
      let valueTypeTransformer = `Types${safeReference(valueTypeName)}(v)`
      if (typeDef.list.valueNullable === true) {
        valueTypeTransformer = `v === null ? v : ${valueTypeTransformer}`
      }
      this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    for (let i = 0; i < obj.length; i++) {
      let v = obj[i]
      v = ${valueTypeTransformer}
      if (v === undefined) {
        return undefined
      }
      if (v !== obj[i]) {
        const ret = obj.slice(0, i)
        for (let j = i; j < obj.length; j++) {
          let v = obj[j]
          v = ${valueTypeTransformer}
          if (v === undefined) {
            return undefined
          }
          ret.push(v)
        }
        return ret
      }
    }
    return obj
  }`

      return
    }

    if ('map' in typeDef) {
      if (typeDef.map.keyType !== 'String') {
        throw new Error(`Invalid keyType for Map "${typeName}", expected String, found "${typeDef.map.keyType}"`)
      }

      let representation = 'map'
      if (typeDef.map.representation !== undefined) {
        if ('listpairs' in typeDef.map.representation && typeof typeDef.map.representation.listpairs === 'object') {
          representation = 'listpairs'
        } else if (!('map' in typeDef.map.representation) || typeof typeDef.map.representation.map !== 'object') {
          throw new Error(`Unsupported map representation "${Object.keys(typeDef.map.representation).join(',')}"`)
        }
      }

      const valueTypeName = defineType(typeDef.map.valueType, 'valueType')
      let valueTypeTransformer = `Types${safeReference(valueTypeName)}(v)`
      if (typeDef.map.valueNullable === true) {
        valueTypeTransformer = `v === null ? v : ${valueTypeTransformer}`
      }

      if (representation === 'listpairs') {
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    const ret = {}
    for (let i = 0; i < obj.length; i++) {
      const e = obj[i]
      if (Kinds.List(e) === undefined || e.length !== 2 || Kinds.String(e[0]) === undefined) {
        return undefined
      }
      let v = e[1]
      v = ${valueTypeTransformer}
      if (v === undefined) {
        return undefined
      }
      ret[e[0]] = v
    }
    return ret
  }`
        return
      }

      this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      let v = obj[keys[i]]
      v = ${valueTypeTransformer}
      if (v === undefined) {
        return undefined
      }
      if (v !== obj[keys[i]]) {
        const ret = {}
        for (let j = 0; j < keys.length; j++) {
          if (j < i) {
            ret[keys[j]] = obj[keys[i]]
          } else if (j === i) {
            ret[keys[j]] = v
          } else {
            let v = obj[keys[j]]
            v = ${valueTypeTransformer}
            if (v === undefined) {
              return undefined
            }
            ret[keys[j]] = v
          }
        }
        return ret
      }
    }
    return obj
  }`

      return
    }

    if ('struct' in typeDef) {
      let representation = 'map'
      if (typeDef.struct.representation !== undefined) {
        if ('tuple' in typeDef.struct.representation && typeof typeDef.struct.representation.tuple === 'object') {
          representation = 'tuple'
        } else if (!('map' in typeDef.struct.representation) || typeof typeDef.struct.representation.map !== 'object') {
          throw new Error(`Unsupported struct representation for "${typeName}": "${Object.keys(typeDef.struct.representation).join(',')}"`)
        }
      }

      const mapFieldCases = []
      let hasRename = false
      let requiredMapFieldCount = 0
      const tupleFieldSetters = /** @type {{ fieldName: string, fn: string }[]} */([])
      const implicitFields = /** @type {{ fieldName: string, value: AnyScalar }[]} */([])
      for (let [fieldName, fieldDef] of Object.entries(typeDef.struct.fields)) {
        let required = representation !== 'map' || fieldDef.optional !== true
        const resultFieldName = fieldName

        if (typeDef.struct.representation !== undefined &&
            'map' in typeDef.struct.representation &&
            typeof typeDef.struct.representation.map === 'object' &&
            typeof typeDef.struct.representation.map.fields === 'object' &&
            typeof typeDef.struct.representation.map.fields[fieldName] === 'object') {
          if (typeDef.struct.representation.map.fields[fieldName].implicit !== undefined) {
            required = false
            const value = /** @type {AnyScalar} */(typeDef.struct.representation.map.fields[fieldName].implicit)
            if (typeof value !== 'string' && typeof value !== 'number' && parseInt(String(value), 10) !== Number(value) && value !== true && value !== false) {
              throw new Error(`Unsupported implicit type for "${typeName}" -> "${fieldName}": ${value}`)
            }
            implicitFields.push({ fieldName, value })
          }
          const fieldDef = typeDef.struct.representation.map.fields[fieldName]
          if (typeof fieldDef.rename === 'string') {
            fieldName = fieldDef.rename
            hasRename = true
          }
        }

        if (required) {
          requiredMapFieldCount++
        }

        if (representation !== 'map' && fieldDef.optional === true) {
          throw new Error(`Struct "${typeName}" includes "optional" fields for non-map struct`)
        }

        const fieldTypeName = defineType(fieldDef.type, fieldName)
        if (representation === 'map') {
          const nullCase = fieldDef.nullable ? 'value === null ? value : ' : ''
          const reqCDec = required ? 'requiredCount--\n            ' : ''
          mapFieldCases.push(`        case '${fieldName}':
          {
            ${reqCDec}const v = ${nullCase}Types${safeReference(fieldTypeName)}(obj[key])
            if (v === undefined) {
              return undefined
            }
            if (v !== value || ret !== obj) {
              if (ret === obj) {
                ret = {}
                for (let j = 0; j < i; j++) {
                  ret[entries[j][0]] = entries[j][1]
                }
              }
              ret${safeReference(resultFieldName)} = v
            }
          }
          break`)
        }
        if (representation === 'tuple') {
          const nullCase = fieldDef.nullable ? 'obj[{{POSITION}}] === null ? obj[{{POSITION}}] : ' : ''
          tupleFieldSetters.push({
            fieldName,
            fn: `    {
      const v = ${nullCase}Types${safeReference(fieldTypeName)}(obj[{{POSITION}}])
      if (v === undefined) {
        return undefined
      }
      ret${safeReference(fieldName)} = v
    }`
          })
        }
      }

      if (representation === 'tuple') {
        if (typeDef.struct.representation &&
            'tuple' in typeDef.struct.representation &&
            Array.isArray(typeDef.struct.representation.tuple.fieldOrder)) {
          if (typeDef.struct.representation.tuple.fieldOrder.length !== tupleFieldSetters.length) {
            throw new Error(`Struct "${typeName}" with tuple representation "fieldOrder" does not match the struct field count`)
          }
          if (typeDef.struct.representation.tuple.fieldOrder.some((f) => !tupleFieldSetters.some(({ fieldName }) => f === fieldName))) {
            throw new Error(`Struct "${typeName}" with tuple representation "fieldOrder" does not match the struct field names`)
          }
          const fo = typeDef.struct.representation.tuple.fieldOrder
          tupleFieldSetters.forEach((tfo) => {
            const pos = fo.indexOf(tfo.fieldName)
            /* c8 ignore next 3 */
            if (pos === -1) {
              throw new Error('Internal error: expected to find tuple field name, this check should have already passed')
            }
            tfo.fn = tfo.fn.replace(/\{\{POSITION\}\}/g, String(pos))
          })
        } else {
          tupleFieldSetters.forEach((tfo, i) => { tfo.fn = tfo.fn.replace(/\{\{POSITION\}\}/g, String(i)) })
        }

        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    if (obj.length !== ${tupleFieldSetters.length}) {
      return undefined
    }
    const ret = {}
${tupleFieldSetters.map((tfs) => tfs.fn).join('\n')}
    return ret
  }`
      } else {
        const implicitSet = implicitFields.map((imf) => {
          const value = typeof imf.value === 'string'
            ? `'${imf.value}'`
            : String(imf.value)

          return `    if (ret${safeReference(imf.fieldName)} === undefined) {
      ret${safeReference(imf.fieldName)} = ${value}
    }`
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = Object.entries(obj)
    let ret = ${hasRename ? '{}' : 'obj'}
    let requiredCount = ${requiredMapFieldCount}
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]
      switch (key) {
${mapFieldCases.join('\n')}
        default:
          return undefined
      }
    }
${implicitSet.join('\n')}${implicitSet.length ? '\n' : ''}    if (requiredCount > 0) {
      return undefined
    }
    return ret
  }`
      }
      return
    }

    if ('union' in typeDef) {
      if (typeof typeDef.union.representation !== 'object') {
        throw new Error(`Bad union definition for "${typeName}"`)
      }

      if ('keyed' in typeDef.union.representation && typeof typeDef.union.representation.keyed === 'object') {
        const keys = typeDef.union.representation.keyed
        const typeTransformers = Object.entries(keys).map(([key, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Keyed union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          return `    if (key === '${key}') {
      const v = Types${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = obj && Object.entries(obj)
    if (entries.length !== 1) {
      return undefined
    }
    const [key, value] = entries[0]
${typeTransformers.join('\n')}
    return undefined
  }`
        return
      }

      if ('kinded' in typeDef.union.representation && typeof typeDef.union.representation.kinded === 'object') {
        const kinds = typeDef.union.representation.kinded
        const typeTransformers = Object.entries(kinds).map(([kind, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Kinded union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          // the Kinds.X(obj) prefix here results in a double-check in practice once we go into Types["Y"],
          // because we should be able to presume that the type in question will do a kind check of its own.
          // _But_, it makes sure that a broken schema that uses a bad kind discriminator will properly fail
          // instead of erroneously passing
          // .. but where it's just a Kind being used as a Type, we _could_ take a shortcut here and avoid
          // the double check through Kinds.X() and Types.X()
          return `    if (Kinds.${tc(kind)}(obj) !== undefined) {
      const v = Types${safeReference(innerTypeName)}(obj)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
${typeTransformers.join('\n')}
    return undefined
  }`

        return
      }

      if ('inline' in typeDef.union.representation && typeof typeDef.union.representation.inline === 'object') {
        const inline = typeDef.union.representation.inline
        if (typeof inline.discriminantKey !== 'string') {
          throw new Error(`Expected "discriminantKey" for inline union "${typeName}"`)
        }
        if (typeof inline.discriminantTable !== 'object') {
          throw new Error(`Expected "discriminantTable" for inline union "${typeName}"`)
        }
        const typeTransformers = Object.entries(inline.discriminantTable).map(([key, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Inline union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          return `    if (key === '${key}') {
      const v = Types${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    if (!('${inline.discriminantKey}' in obj)) {
      return undefined
    }
    const key = obj${safeReference(inline.discriminantKey)}
    const value = Object.assign({}, obj)
    delete value${safeReference(inline.discriminantKey)}
${typeTransformers.join('\n')}
    return undefined
  }`
        return
      }

      if ('envelope' in typeDef.union.representation && typeof typeDef.union.representation.envelope === 'object') {
        const envelope = typeDef.union.representation.envelope
        if (typeof envelope.discriminantKey !== 'string') {
          throw new Error(`Expected "discriminantKey" for envelope union "${typeName}"`)
        }
        if (typeof envelope.contentKey !== 'string') {
          throw new Error(`Expected "contentKey" for envelope union "${typeName}"`)
        }
        if (typeof envelope.discriminantTable !== 'object') {
          throw new Error(`Expected "discriminantTable" for envelope union "${typeName}"`)
        }
        const typeTransformers = Object.entries(envelope.discriminantTable).map(([key, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Envelope union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          return `    if (key === '${key}') {
      const v = Types${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    if (!('${envelope.discriminantKey}' in obj)) {
      return undefined
    }
    const key = obj${safeReference(envelope.discriminantKey)}
    const value = obj${safeReference(envelope.contentKey)}
    if (value === undefined) {
      return undefined
    }
${typeTransformers.join('\n')}
    return undefined
  }`
        return
      }

      if ('bytesprefix' in typeDef.union.representation && typeof typeDef.union.representation.bytesprefix === 'object') {
        const typeTransformers = Object.entries(typeDef.union.representation.bytesprefix).map(([bytes, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Bytesprefix union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          if (typeof bytes !== 'string' || !/^([0-9a-f][0-9a-f])+$/.test(bytes)) {
            throw new Error(`Invalid bytesprefix byte for "${typeName}": "${bytes}"`)
          }
          const hexes = bytes.match(/[0-9a-f][0-9a-f]/ig)
          /* c8 ignore next 3 */
          if (!hexes) {
            throw new Error(`Invalid bytesprefix byte for "${typeName}": "${bytes}"`)
          }
          this.addType(innerTypeName)
          const pfx = hexes.map(b => parseInt(b, 16))
          return `    if (${pfx.map((b, i) => `obj[${i}] === ${b}`).join(' && ')}) {
      const v = Types${safeReference(innerTypeName)}(obj.subarray(${pfx.length}))
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Bytes(obj) === undefined) {
      return undefined
    }
${typeTransformers.join('\n')}
    return undefined
  }`
        return
      }

      throw new Error(`Unsupported union type for "${typeName}": "${Object.keys(typeDef.union.representation).join(',')}"`)
    }

    if ('enum' in typeDef) {
      if (!Array.isArray(typeDef.enum.members)) {
        throw new Error('Enum needs a "members" list')
      }
      /** @type {string[]|number[]}} */
      let values
      let representation = 'string'
      if (typeof typeDef.enum.representation === 'object') {
        if ('string' in typeDef.enum.representation && typeof typeDef.enum.representation.string === 'object') {
          const renames = typeDef.enum.representation.string
          values = typeDef.enum.members.map((v) => {
            v = renames[v] !== undefined ? renames[v] : v
            if (typeof v !== 'string') {
              throw new Error('Enum members must be strings')
            }
            return v
          })
        } else if ('int' in typeDef.enum.representation && typeof typeDef.enum.representation.int === 'object') {
          const renames = typeDef.enum.representation.int
          values = typeDef.enum.members.map((v) => {
            if (renames[v] === undefined || typeof renames[v] !== 'number' || !Number.isInteger(renames[v])) {
              throw new Error('Enum members must be ints')
            }
            return renames[v]
          })
          representation = 'int'
        } else {
          throw new Error('Enum doesn\'t have a valid representation')
        }
      } else {
        throw new Error('Enum doesn\'t have a valid representation')
      }
      this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.${tc(representation)}(obj) === undefined) {
      return undefined
    }
    return ${fromArray(values)}.includes(obj) ? obj : undefined
  }`

      return
    }

    throw new Error(`Can't deal with type kind: "${kind}"`)
  }
}

/**
 * @param {TypeDefn|InlineDefn} typeDef
 * @param {TypeName} typeName
 * @returns
 */
function typeKind (typeDef, typeName) {
  const keys = Object.keys(typeDef)
  if (!keys.length) {
    throw new TypeError(`Malformed type definition: empty ("${typeName}")`)
  }
  if (keys.length > 1) {
    throw new TypeError(`Malformed type definition: expected single kind key ("${typeName}")`)
  }
  return keys[0]
}
