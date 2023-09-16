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

const safeNameRe = /^\$*[a-z][a-z0-9_]*$/i

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

const KindsDefn =
`const Kinds = {
  Null: /** @returns {undefined|null} */ (/** @type {any} */ obj) => obj === null ? obj : undefined,
  Int: /** @returns {undefined|number} */ (/** @type {any} */ obj) => Number.isInteger(obj) ? obj : undefined,
  Float: /** @returns {undefined|number} */ (/** @type {any} */ obj) => typeof obj === 'number' && Number.isFinite(obj) ? obj : undefined,
  String: /** @returns {undefined|string} */ (/** @type {any} */ obj) => typeof obj === 'string' ? obj : undefined,
  Bool: /** @returns {undefined|boolean} */ (/** @type {any} */ obj) => typeof obj === 'boolean' ? obj : undefined,
  Bytes: /** @returns {undefined|Uint8Array} */ (/** @type {any} */ obj) => obj instanceof Uint8Array ? obj : undefined,
  Link: /** @returns {undefined|object} */ (/** @type {any} */ obj) => obj !== null && typeof obj === 'object' && obj.asCID === obj ? obj : undefined,
  List: /** @returns {undefined|Array<any>} */ (/** @type {any} */ obj) => Array.isArray(obj) ? obj : undefined,
  Map: /** @returns {undefined|object} */ (/** @type {any} */ obj) => obj !== null && typeof obj === 'object' && obj.asCID !== obj && !Array.isArray(obj) && !(obj instanceof Uint8Array) ? obj : undefined
}`

const ScalarKindNames = ['Null', 'Int', 'Float', 'String', 'Bool', 'Bytes', 'Link']
const ScalarKindNamesLower = ScalarKindNames.map((n) => n.toLowerCase())
// const TypeKindNames = ['string', 'bool', 'bytes', 'int', 'float', 'map', 'list', 'link', 'union', 'struct', 'enum', 'copy']

const emptyListTransformer = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    if (obj.length) {
      return undefined
    }
    return obj
  }`
const emptyMapTransformer = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    if (Object.keys(obj).length) {
      return undefined
    }
    return obj
  }`

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
 * @returns {{ toTyped: TypeTransformerFunction, toRepresentation: TypeTransformerFunction }}
 */
export function create (schema, root) {
  if (!root || typeof root !== 'string') {
    throw new TypeError('A root is required')
  }

  const builder = new Builder(schema)
  builder.addType(root)

  let fn = '\'use strict\'\n'
  fn += builder.dumpTypeTransformers()
  fn += `\nreturn {
  toTyped: (obj) => Types${safeReference(root)}(obj),
  toRepresentation: (obj) => Reprs${safeReference(root)}(obj)
}`
  // console.log(fn)
  return /** @type {{ toTyped: TypeTransformerFunction, toRepresentation: TypeTransformerFunction }} */ ((new Function(fn))())
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
    /** @type {Record<string, string>} */
    this.reprTransformers = {}
  }

  dumpTypeTransformers () {
    const objKey = (/** @type {string} */ name) => {
      return safeNameRe.test(name) ? name : `'${name}'`
    }
    const fn = `${KindsDefn}\n` +
      '/** @type {{ [k in string]: (obj:any)=>undefined|any}} */\n' +
      `const Types = {\n${Object.entries(this.typeTransformers).map(([name, fn]) => `  ${objKey(name)}: ${fn}`).join(',\n')}\n}\n` +
      '/** @type {{ [k in string]: (obj:any)=>undefined|any}} */\n' +
      `const Reprs = {\n${Object.entries(this.reprTransformers).map(([name, fn]) => `  ${objKey(name)}: ${fn}`).join(',\n')}\n}`
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
      this.reprTransformers.any = this.typeTransformers.any
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
      this.typeTransformers[typeName] = this.reprTransformers[typeName] = `Kinds.${tc(kind)}`
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
      for (const dir of ['Types', 'Reprs']) {
        let valueTransformer = `${dir}${safeReference(valueTypeName)}(v)`
        if (typeDef.list.valueNullable === true) {
          valueTransformer = `v === null ? v : ${valueTransformer}`
        }
        this[`${dir === 'Types' ? 'type' : 'repr'}Transformers`][typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    for (let i = 0; i < obj.length; i++) {
      let v = obj[i]
      v = ${valueTransformer}
      if (v === undefined) {
        return undefined
      }
      if (v !== obj[i]) {
        const ret = obj.slice(0, i)
        for (let j = i; j < obj.length; j++) {
          let v = obj[j]
          v = ${valueTransformer}
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
      }
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

      if (representation === 'listpairs') {
        let valueTransformer = `Types${safeReference(valueTypeName)}(v)`
        if (typeDef.map.valueNullable === true) {
          valueTransformer = `v === null ? v : ${valueTransformer}`
        }
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    /** @type {{[k in string]: any}} */
    const ret = {}
    for (let i = 0; i < obj.length; i++) {
      const e = obj[i]
      if (Kinds.List(e) === undefined || e.length !== 2 || Kinds.String(e[0]) === undefined) {
        return undefined
      }
      let v = e[1]
      v = ${valueTransformer}
      if (v === undefined) {
        return undefined
      }
      ret[e[0]] = v
    }
    return ret
  }`

        valueTransformer = `Reprs${safeReference(valueTypeName)}(entry[1])`
        if (typeDef.map.valueNullable === true) {
          valueTransformer = `entry[1] === null ? entry[1] : ${valueTransformer}`
        }
        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const ret = []
    for (const entry of Object.entries(obj)) {
      const v = ${valueTransformer}
      if (v === undefined) {
        return undefined
      }
      ret.push(entry[1] === v ? entry : [entry[0], v])
    }
    return ret
  }`
        return
      }

      // map representation
      for (const dir of ['Types', 'Reprs']) {
        let valueTransformer = `${dir}${safeReference(valueTypeName)}(v)`
        if (typeDef.map.valueNullable === true) {
          valueTransformer = `v === null ? v : ${valueTransformer}`
        }

        this[`${dir === 'Types' ? 'type' : 'repr'}Transformers`][typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      let v = obj[keys[i]]
      v = ${valueTransformer}
      if (v === undefined) {
        return undefined
      }
      if (v !== obj[keys[i]]) {
        /** @type {{[k in string]: any}} */
        const ret = {}
        for (let j = 0; j < keys.length; j++) {
          if (j < i) {
            ret[keys[j]] = obj[keys[i]]
          } else if (j === i) {
            ret[keys[j]] = v
          } else {
            let v = obj[keys[j]]
            v = ${valueTransformer}
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
      }
      return
    }

    if ('struct' in typeDef) {
      let representation = 'map'
      if (typeDef.struct.representation !== undefined) {
        if ('tuple' in typeDef.struct.representation && typeof typeDef.struct.representation.tuple === 'object') {
          representation = 'tuple'
        } else if ('listpairs' in typeDef.struct.representation && typeof typeDef.struct.representation.listpairs === 'object') {
          representation = 'listpairs'
        } else if (!('map' in typeDef.struct.representation) || typeof typeDef.struct.representation.map !== 'object') {
          throw new Error(`Unsupported struct representation for "${typeName}": "${Object.keys(typeDef.struct.representation).join(',')}"`)
        }
      }

      const typeMapFieldCases = []
      const reprMapFieldCases = []
      let hasRename = false
      let typeRequiredMapFieldCount = 0
      let reprRequiredMapFieldCount = 0
      const typeTupleFieldSetters = /** @type {{ fieldName: string, fn: string }[]} */([])
      const reprTupleFieldCases = /** @type {{ fieldName: string, fn: string }[]} */([])
      const typeListpairsFieldCases = /** @type {string[]} */([])
      const reprListpairsFieldCases = /** @type {string[]} */([])
      const implicitFields = /** @type {{ fieldName: string, value: AnyScalar }[]} */([])
      for (let [fieldName, fieldDef] of Object.entries(typeDef.struct.fields)) {
        let typeRequired = fieldDef.optional !== true
        if (typeRequired) {
          reprRequiredMapFieldCount++
        }
        const resultFieldName = fieldName

        if (typeDef.struct.representation !== undefined &&
            'map' in typeDef.struct.representation &&
            typeof typeDef.struct.representation.map === 'object' &&
            typeof typeDef.struct.representation.map.fields === 'object' &&
            typeof typeDef.struct.representation.map.fields[fieldName] === 'object') {
          if (typeDef.struct.representation.map.fields[fieldName].implicit !== undefined) {
            typeRequired = false
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

        if (typeRequired) {
          typeRequiredMapFieldCount++
        }

        if (representation !== 'map' && representation !== 'listpairs' && fieldDef.optional === true) {
          throw new Error(`Struct "${typeName}" includes "optional" fields for non-map struct`)
        }

        const fieldTypeName = defineType(fieldDef.type, fieldName)
        if (representation === 'map') {
          const nullCase = fieldDef.nullable ? 'value === null ? value : ' : ''
          let reqCDec = typeRequired ? 'requiredCount--\n            ' : ''
          typeMapFieldCases.push(`        case '${fieldName}':
          {
            ${reqCDec}const v = ${nullCase}Types${safeReference(fieldTypeName)}(obj[key])
            if (v === undefined) {
              return undefined
            }
            if (v !== value || ret !== obj) {
              if (ret === obj) {
                /** @type {{[k in string]: any}} */
                ret = {}
                for (let j = 0; j < i; j++) {
                  ret[entries[j][0]] = entries[j][1]
                }
              }
              ret${safeReference(resultFieldName)} = v
            }
          }
          break`)

          reqCDec = typeRequired ? 'requiredCount--\n            ' : ''
          reprMapFieldCases.push(`        case '${resultFieldName}':
          {
            ${reqCDec}const v = ${nullCase}Reprs${safeReference(fieldTypeName)}(value)
            if (v === undefined) {
              return undefined
            }
            if (v !== value || ret !== obj) {
              if (ret === obj) {
                /** @type {{[k in string]: any}} */
                ret = {}
                for (let j = 0; j < i; j++) {
                  ret[entries[j][0]] = entries[j][1]
                }
              }
              ret${safeReference(fieldName)} = v
            }
          }
          break`)
        } else if (representation === 'tuple') {
          let nullCase = fieldDef.nullable ? 'obj[{{POSITION}}] === null ? obj[{{POSITION}}] : ' : ''
          typeTupleFieldSetters.push({
            fieldName,
            fn: `    {
      const v = ${nullCase}Types${safeReference(fieldTypeName)}(obj[{{POSITION}}])
      if (v === undefined) {
        return undefined
      }
      ret${safeReference(fieldName)} = v
    }`
          })

          const reqCDec = 'requiredCount--\n            '
          nullCase = fieldDef.nullable ? 'value === null ? value : ' : ''
          reprTupleFieldCases.push({
            fieldName,
            fn: `        case '${fieldName}':
          {
            ${reqCDec}const v = ${nullCase}Reprs${safeReference(fieldTypeName)}(value)
            if (v === undefined) {
              return undefined
            }
            ret[{{POSITION}}] = v
          }
          break`
          })
        } else if (representation === 'listpairs') {
          const nullCase = fieldDef.nullable ? 'value === null ? value : ' : ''
          const reqCDec = typeRequired ? 'requiredCount--\n            ' : ''
          typeListpairsFieldCases.push(`        case '${fieldName}':
          {
            ${reqCDec}const v = ${nullCase}Types${safeReference(fieldTypeName)}(value)
            if (v === undefined) {
              return undefined
            }
            ret${safeReference(fieldName)} = v
          }
          break`)

          reprListpairsFieldCases.push(`        case '${fieldName}':
          {
            ${reqCDec}const v = ${nullCase}Reprs${safeReference(fieldTypeName)}(value)
            if (v === undefined) {
              return undefined
            }
            ret.push([key, v])
          }
          break`)
        }
      }

      if (representation === 'tuple') {
        /** @type {((tfo:any, i:number|void)=>void)|undefined} */
        let positionSetter
        if (typeDef.struct.representation &&
            'tuple' in typeDef.struct.representation &&
            Array.isArray(typeDef.struct.representation.tuple.fieldOrder)) {
          if (typeDef.struct.representation.tuple.fieldOrder.length !== typeTupleFieldSetters.length) {
            throw new Error(`Struct "${typeName}" with tuple representation "fieldOrder" does not match the struct field count`)
          }
          if (typeDef.struct.representation.tuple.fieldOrder.some((f) => !typeTupleFieldSetters.some(({ fieldName }) => f === fieldName))) {
            throw new Error(`Struct "${typeName}" with tuple representation "fieldOrder" does not match the struct field names`)
          }
          const fo = typeDef.struct.representation.tuple.fieldOrder
          positionSetter = (tfo) => {
            const pos = fo.indexOf(tfo.fieldName)
            /* c8 ignore next 3 */
            if (pos === -1) {
              throw new Error('Internal error: expected to find tuple field name, this check should have already passed')
            }
            tfo.fn = tfo.fn.replace(/\{\{POSITION\}\}/g, String(pos))
          }
        } else {
          positionSetter = (tfo, i) => {
            tfo.fn = tfo.fn.replace(/\{\{POSITION\}\}/g, String(i))
          }
        }
        typeTupleFieldSetters.forEach(positionSetter)
        reprTupleFieldCases.forEach(positionSetter)

        if (Object.keys(typeDef.struct.fields).length === 0) { // special case, empty struct
          this.typeTransformers.$$EmptyMap = emptyMapTransformer
          this.typeTransformers.$$EmptyList = emptyListTransformer
          this.typeTransformers[typeName] = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$EmptyList(obj) === undefined ? undefined : {}'
          this.reprTransformers[typeName] = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$EmptyMap(obj) === undefined ? undefined : []'
          return
        }

        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    if (obj.length !== ${typeTupleFieldSetters.length}) {
      return undefined
    }
    /** @type {{[k in string]: any}} */
    const ret = {}
${typeTupleFieldSetters.map((tfs) => tfs.fn).join('\n')}
    return ret
  }`

        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = Object.entries(obj)
    const ret = []${requiredCountInit(typeRequiredMapFieldCount)}
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]
      switch (key) {
${reprTupleFieldCases.map((tfs) => tfs.fn).join('\n')}
        default:
          return undefined
      }
    }${requiredCountCheck(typeRequiredMapFieldCount)}
    return ret
  }`
        return
      }

      const implicitSet = implicitFields.map((imf) => {
        const value = typeof imf.value === 'string'
          ? `'${imf.value}'`
          : String(imf.value)

        return `
    if (ret${safeReference(imf.fieldName)} === undefined) {
      ret${safeReference(imf.fieldName)} = ${value}
    }`
      })

      if (representation === 'listpairs') {
        if (Object.keys(typeDef.struct.fields).length === 0) { // special case, empty struct
          this.typeTransformers.$$EmptyMap = emptyMapTransformer
          this.typeTransformers.$$EmptyList = emptyListTransformer
          this.typeTransformers[typeName] = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$EmptyList(obj) === undefined ? undefined : {}'
          this.reprTransformers[typeName] = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$EmptyMap(obj) === undefined ? undefined : []'
          return
        }

        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.List(obj) === undefined) {
      return undefined
    }
    /** @type {{[k in string]: any}} */
    const ret = {}
    if (obj.length < ${typeRequiredMapFieldCount} || obj.length > ${Object.keys(typeDef.struct.fields).length}) {
      return undefined
    }${requiredCountInit(typeRequiredMapFieldCount)}
    for (const e of obj) {
      if (Kinds.List(e) === undefined || e.length !== 2) {
        return undefined
      }
      const [key, value] = e
      switch (key) {
${typeListpairsFieldCases.join('\n')}
        default:
          return undefined
      }
    }${implicitSet.join('\n')}${implicitSet.length ? '\n' : ''}${requiredCountCheck(typeRequiredMapFieldCount)}
    return ret
  }`

        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = Object.entries(obj)
    const ret = []${requiredCountInit(reprRequiredMapFieldCount)}
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]
      switch (key) {
${reprListpairsFieldCases.join('\n')}
        default:
          return undefined
      }
    }${requiredCountCheck(reprRequiredMapFieldCount)}
    return ret
  }`
        return
      }

      // representation=map
      if (Object.keys(typeDef.struct.fields).length === 0) { // special case, empty struct
        this.typeTransformers.$$EmptyMap = emptyMapTransformer
        this.typeTransformers[typeName] = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$EmptyMap(obj)'
        this.reprTransformers[typeName] = '/** @returns {undefined|any} */ (/** @type {any} */ obj) => Types.$$EmptyMap(obj)'
        return
      }

      this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = Object.entries(obj)
    /** @type {{[k in string]: any}} */
    let ret = ${hasRename ? '{}' : 'obj'}${requiredCountInit(typeRequiredMapFieldCount)}
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]
      switch (key) {
${typeMapFieldCases.join('\n')}
        default:
          return undefined
      }
    }
${implicitSet.join('\n')}${implicitSet.length ? '\n' : ''}${requiredCountCheck(typeRequiredMapFieldCount)}
    return ret
  }`

      this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = Object.entries(obj)
    /** @type {{[k in string]: any}} */
    let ret = ${hasRename ? '{}' : 'obj'}${requiredCountInit(reprRequiredMapFieldCount)}
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]
      switch (key) {
${reprMapFieldCases.join('\n')}
        default:
          return undefined
      }
    }${requiredCountCheck(reprRequiredMapFieldCount)}
    return ret
  }`
      return
    }

    if ('union' in typeDef) {
      if (typeof typeDef.union.representation !== 'object') {
        throw new Error(`Bad union definition for "${typeName}"`)
      }

      if ('keyed' in typeDef.union.representation && typeof typeDef.union.representation.keyed === 'object') {
        const keys = typeDef.union.representation.keyed
        const typeTransformers = /** @type {string[]} */([])
        const reprTransformers = /** @type {string[]} */([])
        Object.entries(keys).forEach(([key, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Keyed union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          typeTransformers.push(`    if (key === '${key}') {
      const v = Types${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`)
          reprTransformers.push(`    if (key === '${innerTypeName}') {
      const v = Reprs${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(key)}: v }
    }`)
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

        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = obj && Object.entries(obj)
    if (entries.length !== 1) {
      return undefined
    }
    const [key, value] = entries[0]
${reprTransformers.join('\n')}
    return undefined
  }`
        return
      }

      if ('kinded' in typeDef.union.representation && typeof typeDef.union.representation.kinded === 'object') {
        const kinds = typeDef.union.representation.kinded
        const typeTransformers = /** @type {string[]} */([])
        const reprTransformers = /** @type {string[]} */([])
        Object.entries(kinds).forEach(([kind, innerTypeName]) => {
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
          typeTransformers.push(`    if (Kinds.${tc(kind)}(obj) !== undefined) {
      const v = Types${safeReference(innerTypeName)}(obj)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`)
          reprTransformers.push(`    if (key === '${innerTypeName}') {
      return Reprs${safeReference(innerTypeName)}(value)
    }`)
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
${typeTransformers.join('\n')}
    return undefined
  }`
        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = obj && Object.entries(obj)
    if (entries.length !== 1) {
      return undefined
    }
    const [key, value] = entries[0]
${reprTransformers.join('\n')}
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
        const typeTransformers = /** @type {string[]} */([])
        const reprTransformers = /** @type {string[]} */([])
        Object.entries(inline.discriminantTable).forEach(([key, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Inline union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          typeTransformers.push(`    if (key === '${key}') {
      const v = Types${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`)

          reprTransformers.push(`      case '${innerTypeName}': {
        const v = Reprs${safeReference(innerTypeName)}(value)
        return v === undefined ? undefined : Object.assign({ ${safeFieldReference(inline.discriminantKey)}: '${key}' }, v)
      }`)
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

        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = obj && Object.entries(obj)
    if (entries.length !== 1) {
      return undefined
    }
    const [key, value] = entries[0]
    switch (key) {
${reprTransformers.join('\n')}
    }
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
        const typeTransformers = /** @type {string[]} */([])
        const reprTransformers = /** @type {string[]} */([])
        Object.entries(envelope.discriminantTable).forEach(([key, innerTypeName]) => {
          if (typeof innerTypeName !== 'string') {
            throw new Error(`Envelope union "${typeName}" refers to non-string type name: ${JSON.stringify(innerTypeName)}`)
          }
          this.addType(innerTypeName)
          typeTransformers.push(`    if (key === '${key}') {
      const v = Types${safeReference(innerTypeName)}(value)
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`)
          reprTransformers.push(`      case '${innerTypeName}': {
        const v = Reprs${safeReference(innerTypeName)}(value)
        return v === undefined ? undefined : { ${safeFieldReference(envelope.discriminantKey)}: '${key}', ${safeFieldReference(envelope.contentKey)}: v }
      }`)
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

        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = obj && Object.entries(obj)
    if (entries.length !== 1) {
      return undefined
    }
    const [key, value] = entries[0]
    switch (key) {
${reprTransformers.join('\n')}
    }
    return undefined
  }`

        return
      }

      if ('bytesprefix' in typeDef.union.representation && typeof typeDef.union.representation.bytesprefix === 'object') {
        const typeTransformers = /** @type {string[]} */([])
        const reprTransformers = /** @type {string[]} */([])
        Object.entries(typeDef.union.representation.bytesprefix.prefixes).forEach(([bytes, innerTypeName]) => {
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
          typeTransformers.push(`    if (${pfx.map((b, i) => `obj[${i}] === ${b}`).join(' && ')}) {
      const v = Types${safeReference(innerTypeName)}(obj.subarray(${pfx.length}))
      return v === undefined ? undefined : { ${safeFieldReference(innerTypeName)}: v }
    }`)

          reprTransformers.push(`      case '${innerTypeName}': {
        const v = Kinds.Bytes(Reprs${safeReference(innerTypeName)}(value))
        if (v === undefined) {
          return undefined
        }
        const ret = new Uint8Array(v.length + ${pfx.length})
        ret.set([${pfx.join(', ')}], 0)
        ret.set(v, ${pfx.length})
        return ret
      }`)
        })
        this.typeTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Bytes(obj) === undefined) {
      return undefined
    }
${typeTransformers.join('\n')}
    return undefined
  }`

        this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.Map(obj) === undefined) {
      return undefined
    }
    const entries = obj && Object.entries(obj)
    if (entries.length !== 1) {
      return undefined
    }
    const [key, value] = entries[0]
    switch (key) {
${reprTransformers.join('\n')}
    }
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
      /** @type {[string,string][]}} */
      let values
      let representation = 'string'
      if (typeof typeDef.enum.representation === 'object') {
        if ('string' in typeDef.enum.representation && typeof typeDef.enum.representation.string === 'object') {
          const renames = typeDef.enum.representation.string
          values = typeDef.enum.members.map((to) => {
            const from = renames[to] !== undefined ? renames[to] : to
            if (typeof from !== 'string') {
              throw new Error('Enum members must be strings')
            }
            return [`'${from}'`, `'${to}'`]
          })
        } else if ('int' in typeDef.enum.representation && typeof typeDef.enum.representation.int === 'object') {
          const renames = typeDef.enum.representation.int
          values = typeDef.enum.members.map((to) => {
            if (renames[to] === undefined || typeof renames[to] !== 'number' || !Number.isInteger(renames[to])) {
              throw new Error('Enum members must be ints')
            }
            return [String(renames[to]), `'${to}'`]
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
${values.map(([from, to]) => `    if (obj === ${from}) {
      return ${to}
    }`).join('\n')}
    return undefined
  }`

      this.reprTransformers[typeName] = `/** @returns {undefined|any} */ (/** @type {any} */ obj) => {
    if (Kinds.String(obj) === undefined) {
      return undefined
    }
${values.map(([from, to]) => `    if (obj === ${to}) {
      return ${from}
    }`).join('\n')}
    return undefined
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

/**
 * @param {number} c
 */
function requiredCountInit (c) {
  if (c > 0) {
    return `
    let requiredCount = ${c}`
  }
  return ''
}
/**
 * @param {number} c
 */
function requiredCountCheck (c) {
  if (c > 0) {
    return `
    if (requiredCount > 0) {
      return undefined
    }`
  }
  return ''
}
