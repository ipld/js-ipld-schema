/**
 * @typedef {import('../../schema-schema').Schema} Schema
 * @typedef {import('../../schema-schema').FieldName} FieldName
 */

/**
 * @param {Schema} schema
 * @returns {string}
 */
export function generateTypeScript (schema) {
  /** @type {[string, string][]} */
  const imports = []

  let typesrc = ''
  for (const [typeName, typeDefn] of Object.entries(schema.types)) {
    if (Object.keys(typeDefn).length !== 1) {
      throw new Error('Unexpected type definition: ' + JSON.stringify(typeDefn))
    }
    const typeKind = Object.keys(typeDefn)[0]
    if ('struct' in typeDefn) {
      // Validate optional fields for tuple representation
      if (typeDefn.struct.representation && 'tuple' in typeDefn.struct.representation) {
        const fields = Object.entries(typeDefn.struct.fields)
        let foundOptional = false
        for (const [fieldName, fieldDefn] of fields) {
          if (foundOptional && !fieldDefn.optional) {
            throw new Error(`Struct "${typeName}": optional field must be at the end when using tuple representation, but field "${fieldName}" is required after optional fields`)
          }
          if (fieldDefn.optional) {
            foundOptional = true
          }
        }
      }

      typesrc += `export type ${typeName} = {\n`

      /** @type {string[]} */
      const fieldValidators = []
      let requiredFieldCount = 0
      for (let [fieldName, fieldDefn] of Object.entries(typeDefn.struct.fields)) {
        if (!fieldDefn.optional) {
          requiredFieldCount++
        }
        /** @type { { [k in string]: string }[]} */
        let annotations = []
        if (typeof typeDefn.struct.annotations === 'object' && typeof typeDefn.struct.annotations.type === 'object') {
          annotations = typeDefn.struct.annotations.type
        }
        /** @type {{ precomments: string, linecomment: string }|null} */
        let comments = null
        if (typeof typeDefn.struct.comments === 'object' && typeof typeDefn.struct.comments.fields === 'object') {
          if (fieldName in typeDefn.struct.comments.fields) {
            comments = typeDefn.struct.comments.fields[fieldName]
          }
        }
        let fieldType = ''
        let slice = false
        let elementNullable = false
        let isMap = false
        let mapValueType = ''
        let mapValueNullable = false
        if (typeof fieldDefn.type === 'string') {
          fieldType = fieldDefn.type
        } else if ('list' in fieldDefn.type) {
          if (typeof fieldDefn.type.list.valueType !== 'string') {
            throw new Error('Unhandled list field type: ' + JSON.stringify(fieldDefn))
          }
          fieldType = fieldDefn.type.list.valueType
          slice = true
          // Handle nullable elements
          if (fieldDefn.type.list.valueNullable) {
            elementNullable = true
          }
        } else if ('map' in fieldDefn.type) {
          if (typeof fieldDefn.type.map.valueType !== 'string') {
            throw new Error('Unhandled map value type: ' + JSON.stringify(fieldDefn))
          }
          mapValueType = fieldDefn.type.map.valueType
          isMap = true
          // Handle nullable values
          if (fieldDefn.type.map.valueNullable) {
            mapValueNullable = true
          }
        } else if ('link' in fieldDefn.type) {
          // &Any or &Foo form, just use 'Link' for now, no use for type hints here
          fieldType = 'Link'
        } else {
          throw new Error('Unhandled field type: ' + JSON.stringify(fieldDefn))
        }
        fieldType = getTypeScriptType(annotations, fieldType)

        let linecomment = ''
        if (comments) {
          if (comments.precomments) {
            for (const comment of comments.precomments.trim().split('\n')) {
              typesrc += `  // ${comment}\n`
            }
          }
          if (comments.linecomment) {
            linecomment = ' // ' + comments.linecomment
          }
        }
        if (isMap) {
          // Handle map types
          let valueType = getTypeScriptType([], mapValueType)
          valueType = fixTypeScriptType(imports, valueType, false)
          if (mapValueNullable) {
            fieldType = `{ [key: string]: ${valueType} | null }`
          } else {
            fieldType = `{ [key: string]: ${valueType} }`
          }
        } else {
          fieldType = fixTypeScriptType(imports, fieldType, slice)
          // Handle nullable elements in TypeScript
          if (elementNullable && slice) {
            // Change T[] to (T | null)[]
            fieldType = `(${fieldType.slice(0, -2)} | null)[]`
          }
        }
        fieldName = fixTypeScriptName(annotations, fieldName)
        // Handle optional and nullable fields
        if (fieldDefn.optional && fieldDefn.nullable) {
          // Both optional and nullable
          typesrc += `  ${fieldName}?: ${fieldType} | null${linecomment}\n`
        } else if (fieldDefn.optional) {
          // Just optional
          typesrc += `  ${fieldName}?: ${fieldType}${linecomment}\n`
        } else if (fieldDefn.nullable) {
          // Just nullable - field is required but can be null
          typesrc += `  ${fieldName}: ${fieldType} | null${linecomment}\n`
        } else {
          // Required field
          typesrc += `  ${fieldName}: ${fieldType}${linecomment}\n`
        }
        const inCheck = !fieldDefn.optional ? `'${fieldName}' in value &&` : `!('${fieldName}' in value) ||`
        if (isMap) {
          const kind = fixTypeScriptType(imports, '@ipld/schema/schema-schema.js#KindMap', false)
          let valueType = getTypeScriptType([], mapValueType)
          valueType = fixTypeScriptType(imports, valueType, false)
          if (mapValueNullable) {
            fieldValidators.push(`      (${inCheck} (${fieldDefn.nullable ? `value.${fieldName} === null || ` : ''}(${kind}.is${kind}(value.${fieldName}) && Object.values(value.${fieldName}).every(v => v === null || ${valueType}.is${valueType}(v)))))`)
          } else {
            fieldValidators.push(`      (${inCheck} (${fieldDefn.nullable ? `value.${fieldName} === null || ` : ''}(${kind}.is${kind}(value.${fieldName}) && Object.values(value.${fieldName}).every(v => ${valueType}.is${valueType}(v)))))`)
          }
        } else if (fieldType.endsWith('[]')) {
          // Need to get the base element type for validators
          let elementType
          if (elementNullable && fieldType.startsWith('(') && fieldType.endsWith(' | null)[]')) {
            // Extract base type from (Type | null)[]
            elementType = fieldType.slice(1, -10) // Remove '(' and ' | null)[]'
          } else {
            elementType = fieldType.slice(0, -2) // Remove the '[]'
          }
          if (elementNullable) {
            fieldValidators.push(`      (${inCheck} (${fieldDefn.nullable ? `value.${fieldName} === null || ` : ''}(Array.isArray(value.${fieldName}) && value.${fieldName}.every(v => v === null || ${elementType}.is${elementType}(v)))))`)
          } else {
            fieldValidators.push(`      (${inCheck} (${fieldDefn.nullable ? `value.${fieldName} === null || ` : ''}(Array.isArray(value.${fieldName}) && value.${fieldName}.every(${elementType}.is${elementType}))))`)
          }
        } else {
          fieldValidators.push(`      (${inCheck} (${fieldDefn.nullable ? `value.${fieldName} === null || ` : ''}(${fieldType}.is${fieldType}(value.${fieldName}))))`)
        }
      }

      typesrc += '}\n\n'

      const kind = fixTypeScriptType(imports, '@ipld/schema/schema-schema.js#KindMap', false)
      typesrc += `export namespace ${typeName} {\n`
      typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
      typesrc += `    if (!${kind}.is${kind}(value)) {\n`
      typesrc += '      return false\n'
      typesrc += '    }\n'
      typesrc += '    const keyCount = Object.keys(value).length\n'
      typesrc += '    return '
      if (requiredFieldCount === Object.keys(typeDefn.struct.fields).length) {
        typesrc += `keyCount === ${requiredFieldCount} &&\n`
      } else {
        // TODO: this isn't really a complete check, we probably should check for extra fields
        typesrc += `keyCount >= ${requiredFieldCount} && keyCount <= ${Object.keys(typeDefn.struct.fields).length} &&\n`
      }
      typesrc += fieldValidators.join(' &&\n')
      typesrc += '\n  }\n'
      typesrc += '}\n\n'
    } else if ('list' in typeDefn) {
      if (typeof typeDefn.list.valueType !== 'string') {
        throw new Error('Unhandled list value type: ' + JSON.stringify(typeDefn))
      }
      let valueType = getTypeScriptType([], typeDefn.list.valueType)
      valueType = fixTypeScriptType(imports, valueType, false)

      // Handle nullable elements
      if (typeDefn.list.valueNullable) {
        typesrc += `export type ${typeName} = (${valueType} | null)[]\n\n`
        typesrc += `export namespace ${typeName} {\n`
        typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
        typesrc += `    return Array.isArray(value) && value.every(v => v === null || ${valueType}.is${valueType}(v))\n`
        typesrc += '  }\n'
        typesrc += '}\n\n'
      } else {
        typesrc += `export type ${typeName} = ${valueType}[]\n\n`
        typesrc += `export namespace ${typeName} {\n`
        typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
        typesrc += `    return Array.isArray(value) && value.every(${valueType}.is${valueType})\n`
        typesrc += '  }\n'
        typesrc += '}\n\n'
      }
    } else if ('map' in typeDefn) {
      // Handle top-level map type definitions
      if (typeof typeDefn.map.valueType !== 'string') {
        throw new Error('Unhandled map value type: ' + JSON.stringify(typeDefn))
      }
      let valueType = getTypeScriptType([], typeDefn.map.valueType)
      valueType = fixTypeScriptType(imports, valueType, false)

      const kind = fixTypeScriptType(imports, '@ipld/schema/schema-schema.js#KindMap', false)

      // Handle nullable values
      if (typeDefn.map.valueNullable) {
        typesrc += `export type ${typeName} = { [key: string]: ${valueType} | null }\n\n`
        typesrc += `export namespace ${typeName} {\n`
        typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
        typesrc += `    if (!${kind}.is${kind}(value)) {\n`
        typesrc += '      return false\n'
        typesrc += '    }\n'
        typesrc += `    return Object.values(value).every(v => v === null || ${valueType}.is${valueType}(v))\n`
        typesrc += '  }\n'
        typesrc += '}\n\n'
      } else {
        typesrc += `export type ${typeName} = { [key: string]: ${valueType} }\n\n`
        typesrc += `export namespace ${typeName} {\n`
        typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
        typesrc += `    if (!${kind}.is${kind}(value)) {\n`
        typesrc += '      return false\n'
        typesrc += '    }\n'
        typesrc += `    return Object.values(value).every(v => ${valueType}.is${valueType}(v))\n`
        typesrc += '  }\n'
        typesrc += '}\n\n'
      }
    } else if ('copy' in typeDefn) {
      const { fromType } = typeDefn.copy
      typesrc += `export type ${typeName} = ${fromType}\n\n`
      typesrc += `export namespace ${typeName} {\n`
      typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
      typesrc += `    return ${fromType}.is${fromType}(value)\n`
      typesrc += '  }\n'
      typesrc += '}\n\n'
    } else if (['bool', 'string', 'bytes', 'int', 'float', 'link', 'null'].includes(typeKind)) {
      const kind = fixTypeScriptType(imports, `@ipld/schema/schema-schema.js#Kind${typeKind.charAt(0).toUpperCase()}${typeKind.slice(1)}`, false)
      typesrc += `export type ${typeName} = ${kind}\n\n`
      typesrc += `export namespace ${typeName} {\n`
      typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
      typesrc += `    return ${kind}.is${kind}(value)\n`
      typesrc += '  }\n'
      typesrc += '}\n\n'
    } else if ('union' in typeDefn) {
      if ('keyed' in typeDefn.union.representation) {
        // Handle keyed unions
        const variants = []
        for (const [discriminant, memberType] of Object.entries(typeDefn.union.representation.keyed)) {
          variants.push(`{ ${discriminant}: ${memberType} }`)
        }
        typesrc += `export type ${typeName} = ${variants.join(' | ')}\n\n`

        typesrc += `export namespace ${typeName} {\n`
        typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
        typesrc += '    if (typeof value !== \'object\' || value === null) {\n'
        typesrc += '      return false\n'
        typesrc += '    }\n'
        typesrc += '    const keys = Object.keys(value)\n'
        typesrc += '    if (keys.length !== 1) {\n'
        typesrc += '      return false\n'
        typesrc += '    }\n'

        for (const [discriminant, memberType] of Object.entries(typeDefn.union.representation.keyed)) {
          typesrc += `    if ('${discriminant}' in value) {\n`
          typesrc += `      return ${memberType}.is${memberType}(value.${discriminant})\n`
          typesrc += '    }\n'
        }

        typesrc += '    return false\n'
        typesrc += '  }\n'
        typesrc += '}\n\n'
      } else if ('kinded' in typeDefn.union.representation) {
        // Generate union types based on kinded representation
        const unionTypes = []
        const typeChecks = []

        for (const [, memberType] of Object.entries(typeDefn.union.representation.kinded)) {
          if (typeof memberType === 'string') {
            const tsType = fixTypeScriptType(imports, getTypeScriptType([], memberType), false)
            unionTypes.push(tsType)
            typeChecks.push(`${tsType}.is${tsType}(value)`)
          }
        }

        typesrc += `export type ${typeName} = ${unionTypes.join(' | ')}\n\n`
        typesrc += `export namespace ${typeName} {\n`
        typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`
        typesrc += `    return ${typeChecks.join(' || ')}\n`
        typesrc += '  }\n'
        typesrc += '}\n\n'
      } else {
        throw new Error('Unhandled union representation: ' + Object.keys(typeDefn.union.representation)[0])
      }
    } else if ('enum' in typeDefn) {
      const isIntRepr = typeDefn.enum.representation && 'int' in typeDefn.enum.representation

      // Generate union type
      const values = []
      const constants = []

      for (const member of typeDefn.enum.members) {
        let value
        if (isIntRepr && typeDefn.enum.representation && 'int' in typeDefn.enum.representation && member in typeDefn.enum.representation.int) {
          value = typeDefn.enum.representation.int[member]
          values.push(String(value))
        } else if (!isIntRepr && typeDefn.enum.representation && 'string' in typeDefn.enum.representation &&
                   typeDefn.enum.representation.string && member in typeDefn.enum.representation.string) {
          value = `"${typeDefn.enum.representation.string[member]}"`
          values.push(value)
        } else {
          // Default values
          value = isIntRepr ? '0' : `"${member}"`
          values.push(isIntRepr ? value : value)
        }
        constants.push({ name: member, value })
      }

      typesrc += `export type ${typeName} = ${values.join(' | ')}\n\n`

      // Generate namespace with constants and validator
      typesrc += `export namespace ${typeName} {\n`

      // Generate constants
      for (const { name, value } of constants) {
        typesrc += `  export const ${name}: ${typeName} = ${value}\n`
      }

      typesrc += '  \n'
      typesrc += `  export function is${typeName}(value: any): value is ${typeName} {\n`

      if (isIntRepr) {
        // For int enums with consecutive values, use range check
        const numValues = values.map(v => parseInt(v))
        const min = Math.min(...numValues)
        const max = Math.max(...numValues)
        const isConsecutive = numValues.length === (max - min + 1) &&
                              numValues.every(v => numValues.includes(v))

        if (isConsecutive && min === 0) {
          typesrc += `    return value >= ${min} && value <= ${max} && Number.isInteger(value)\n`
        } else {
          // For non-consecutive values, check each one
          const intValues = values.map(v => `value === ${v}`).join(' || ')
          typesrc += `    return ${intValues}\n`
        }
      } else {
        // For string enums, check if value is one of the valid strings
        const stringValues = values.map(v => `value === ${v}`).join(' || ')
        typesrc += `    return ${stringValues}\n`
      }

      typesrc += '  }\n'
      typesrc += '}\n\n'
    } else {
      throw new Error('Unimplemented type kind: ' + typeKind)
    }
  }

  let ts = ''
  const fixedImports = fixTypeScriptImports(imports)
  for (const imp of fixedImports) {
    if (imp[1].length === 1) {
      ts += `import { ${imp[1]} } from '${imp[0]}'\n`
    } else {
      ts += 'import {\n'
      for (const imported of imp[1]) {
        ts += `  ${imported},\n`
      }
      ts += `} from '${imp[0]}'\n`
    }
  }
  if (imports.length > 0) {
    ts += '\n'
  }
  ts += typesrc.replace(/\n\n$/, '\n')

  return ts
}
/**
 * @param {{ [k in string]: string }[]} annotations
 * @param {string} fieldName
 * @returns {string}
 */
function fixTypeScriptName (annotations, fieldName) {
  if (annotations.length > 0) {
    // if there is a 'tstype', use that
    for (const annotation of annotations) {
      if ('tsrename' in annotation) {
        return annotation.tsrename
      }
    }
  }
  return fieldName
}

/**
 * @param {{ [k in string]: string }[]} annotations
 * @param {string} ipldType
 * @returns {string}
 */
function getTypeScriptType (annotations, ipldType) {
  if (annotations.length > 0) {
    // if there is a 'tstype', use that
    for (const annotation of annotations) {
      if ('tstype' in annotation) {
        return annotation.tstype
      }
    }
  }
  switch (ipldType) {
    case 'Bool':
    case 'String':
    case 'Bytes':
    case 'Int':
    case 'Float':
    case 'Null':
    case 'Map':
    case 'List':
    case 'Link':
    case 'Union':
    case 'Struct':
    case 'Enum':
      return `@ipld/schema/schema-schema.js#Kind${ipldType}`
    case 'Any':
      return 'any' // TODO: something here?
  }

  return ipldType
}

/**
 * @param {[string, string][]} imports
 * @param {string} tstype
 * @param {boolean} slice
 * @returns {string}
 */
function fixTypeScriptType (imports, tstype, slice) {
  if (tstype.includes('#')) {
    const parts = tstype.split('#')
    if (parts.length !== 2) {
      throw new Error('Invalid type: ' + tstype)
    }
    imports.push([parts[0], parts[1]])
    tstype = parts[1]
  }
  if (slice) {
    return tstype + '[]'
  }
  return tstype
}

/**
 * @param {[string, string][]} imports
 * @returns {[string, string[]][]}
 */
function fixTypeScriptImports (imports) {
  /** @type {Record<string, string[]>} */
  const groupedImports = {}
  for (const [source, imported] of imports) {
    if (!groupedImports[source]) {
      groupedImports[source] = []
    }
    if (!groupedImports[source].includes(imported)) {
      groupedImports[source].push(imported)
    }
  }

  /** @type {[string, string[]][]} */
  const result = []
  for (const source in groupedImports) {
    result.push([source, groupedImports[source].sort()])
  }

  return result
}
