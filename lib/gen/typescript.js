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
  let imports = []

  let typesrc = ''
  for (const [typeName, typeDefn] of Object.entries(schema.types)) {
    if ('struct' in typeDefn) {
      typesrc += `export type ${typeName} = {\n`

      for (let [fieldName, fieldDefn] of Object.entries(typeDefn.struct.fields)) {
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
        if (typeof fieldDefn.type === 'string') {
          fieldType = fieldDefn.type
        } else if ('list' in fieldDefn.type) {
          if (typeof fieldDefn.type.list.valueType !== 'string') {
            throw new Error('Unhandled list field type: ' + JSON.stringify(fieldDefn))
          }
          fieldType = fieldDefn.type.list.valueType
          slice = true
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
            for (const comment of comments.precomments.split('\n')) {
              typesrc += `  // ${comment}\n`
            }
          }
          if (comments.linecomment) {
            linecomment = ' // ' + comments.linecomment
          }
        }
        fieldType = fixTypeScriptType(imports, fieldType, slice)
        fieldName = fixTypeScriptName(annotations, fieldName)
        typesrc += `  ${fieldName}: ${fieldType}${linecomment}\n`
      }

      typesrc += '}\n\n'
    }
  }

  let ts = ''
  imports = fixTypeScriptImports(imports)
  for (const imp of imports) {
    ts += `import { ${imp[1]} } from '${imp[0]}'\n`
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
  // snakeCase with lower-case first letter
  return fieldName.charAt(0).toLowerCase() + fieldName.slice(1)
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
    case 'Int':
      return 'number'
    case 'Float':
      return 'number'
    case 'Bool':
      return 'boolean'
    case 'String':
      return 'string'
    case 'Bytes':
      return 'Uint8Array'
    case 'Link':
      return 'multiformats/cid#CID'
    case 'Map':
      return 'object'
    case 'List':
      return 'any[]'
    case 'Union':
      return 'any' // TODO:
    case 'Any':
      return 'any' // TODO:
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
 * @returns {[string, string][]}
 */
function fixTypeScriptImports (imports) {
  // TODO: implement for user imports
  return imports
}
