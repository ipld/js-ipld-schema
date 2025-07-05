/**
 * @typedef {import('../../schema-schema').Schema} Schema
 * @typedef {import('../../schema-schema').FieldName} FieldName
 */

/**
 * @param {Schema} schema
 * @param {Record<string, string>} [options]
 * @returns {string}
 */
export function generateGo (schema, options = {}) {
  /** @type {string[]} */
  let imports = []

  let typesrc = ''
  /** @type {Map<string, Set<string>>} */
  const unionMethods = new Map() // Track which types need union methods

  // First pass: collect union information
  for (const [typeName, typeDefn] of Object.entries(schema.types)) {
    if ('union' in typeDefn) {
      if (!typeDefn.union.representation || !('keyed' in typeDefn.union.representation)) {
        // For now, only support keyed unions
        continue
      }

      // Track which types need methods
      for (const member of Object.values(typeDefn.union.representation.keyed)) {
        // member can be TypeName (string) or UnionMemberInlineDefn
        if (typeof member === 'string') {
          if (!unionMethods.has(member)) {
            unionMethods.set(member, new Set())
          }
          unionMethods.get(member)?.add(typeName)
        }
      }
    }
  }

  // Second pass: generate types with proper ordering
  for (const [typeName, typeDefn] of Object.entries(schema.types)) {
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

      typesrc += `type ${typeName} struct {\n`

      for (let [fieldName, fieldDefn] of Object.entries(typeDefn.struct.fields)) {
        /** @type { { [k in string]: string }[]} */
        let annotations = []
        if (typeof typeDefn.struct.annotations === 'object' && typeof typeDefn.struct.annotations.fields === 'object') {
          if (fieldName in typeDefn.struct.annotations.fields) {
            annotations = typeDefn.struct.annotations.fields[fieldName]
          }
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
          fieldType = fieldDefn.type.map.valueType
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
        fieldType = getGoType(annotations, fieldType)

        let linecomment = ''
        if (comments) {
          if (comments.precomments) {
            for (const comment of comments.precomments.trim().split('\n')) {
              typesrc += `\t// ${comment}\n`
            }
          }
          if (comments.linecomment) {
            linecomment = ' // ' + comments.linecomment
          }
        }
        if (isMap) {
          // Handle map types
          let valueType = getGoType(annotations, fieldType)
          valueType = fixGoType(imports, valueType, false)
          if (mapValueNullable) {
            valueType = '*' + valueType
          }
          fieldType = `map[string]${valueType}`
        } else {
          fieldType = fixGoType(imports, fieldType, slice)
          // Handle nullable elements in lists
          if (elementNullable && slice) {
            // In Go, nullable list elements are represented as []*Type
            fieldType = fieldType.replace(/^\[\]/, '[]*')
          }
        }
        fieldName = fixGoName(annotations, fieldName)
        const gotag = annotations.reduce((acc, a) => 'gotag' in a ? ' ' + a.gotag : acc, '')
        // Handle nullable and optional fields by making them pointers
        if (fieldDefn.nullable || fieldDefn.optional) {
          fieldType = '*' + fieldType
        }
        typesrc += `\t${fieldName} ${fieldType}${gotag}${linecomment}\n`
      }

      typesrc += '}\n\n'

      // Add union methods for this struct if it's a union member
      if (unionMethods.has(typeName)) {
        for (const unionType of unionMethods.get(typeName) || []) {
          typesrc += `func (${typeName}) ${unionType.charAt(0).toLowerCase() + unionType.slice(1)}() {}\n\n`
        }
      }
    } else if ('list' in typeDefn) {
      // Handle top-level list type definitions
      if (typeof typeDefn.list.valueType !== 'string') {
        throw new Error('Unhandled list value type: ' + JSON.stringify(typeDefn))
      }
      let valueType = getGoType([], typeDefn.list.valueType)
      valueType = fixGoType(imports, valueType, false)

      // Handle nullable elements
      if (typeDefn.list.valueNullable) {
        valueType = '*' + valueType
      }

      typesrc += `type ${typeName} []${valueType}\n\n`
    } else if ('map' in typeDefn) {
      // Handle top-level map type definitions
      if (typeof typeDefn.map.valueType !== 'string') {
        throw new Error('Unhandled map value type: ' + JSON.stringify(typeDefn))
      }
      let valueType = getGoType([], typeDefn.map.valueType)
      valueType = fixGoType(imports, valueType, false)

      // Handle nullable values
      if (typeDefn.map.valueNullable) {
        valueType = '*' + valueType
      }

      typesrc += `type ${typeName} map[string]${valueType}\n\n`
    } else if ('enum' in typeDefn) {
      // Check for type override annotation
      /** @type { { [k in string]: string }[]} */
      let annotations = []
      // @ts-ignore - annotations exist in the parsed data even if not in type definition
      if (typeof typeDefn.enum.annotations === 'object' && typeof typeDefn.enum.annotations.type === 'object') {
        // @ts-ignore
        annotations = typeDefn.enum.annotations.type
      }

      // Check if we have a gotype annotation
      const gotypeAnnotation = annotations.find(a => 'gotype' in a)
      if (gotypeAnnotation) {
        // Type alias to external type
        const externalType = fixGoType(imports, gotypeAnnotation.gotype, false)
        typesrc += `type ${typeName} = ${externalType}\n\n`

        // Generate constants for the enum values
        const isIntRepr = typeDefn.enum.representation && 'int' in typeDefn.enum.representation

        // Generate constants in a const block
        typesrc += 'const (\n'
        for (const member of typeDefn.enum.members) {
          let value
          if (isIntRepr && typeDefn.enum.representation && 'int' in typeDefn.enum.representation && member in typeDefn.enum.representation.int) {
            value = typeDefn.enum.representation.int[member]
          } else if (!isIntRepr && typeDefn.enum.representation && 'string' in typeDefn.enum.representation && member in typeDefn.enum.representation.string) {
            value = `"${typeDefn.enum.representation.string[member]}"`
          } else {
            // Default values
            value = isIntRepr ? '0' : `"${member}"`
          }
          typesrc += `\t${typeName}${member} ${typeName} = ${value}\n`
        }
        typesrc += ')\n\n'
      } else {
        // Generate native Go enum
        const isIntRepr = typeDefn.enum.representation && 'int' in typeDefn.enum.representation
        const baseType = isIntRepr ? 'int64' : 'string'

        typesrc += `type ${typeName} ${baseType}\n\n`
        typesrc += 'const (\n'

        for (const member of typeDefn.enum.members) {
          let value
          if (isIntRepr && typeDefn.enum.representation && 'int' in typeDefn.enum.representation && member in typeDefn.enum.representation.int) {
            value = typeDefn.enum.representation.int[member]
          } else if (!isIntRepr && typeDefn.enum.representation && 'string' in typeDefn.enum.representation && member in typeDefn.enum.representation.string) {
            value = `"${typeDefn.enum.representation.string[member]}"`
          } else {
            // Default values
            value = isIntRepr ? '0' : `"${member}"`
          }
          typesrc += `\t${typeName}${member} ${typeName} = ${value}\n`
        }

        typesrc += ')\n\n'
      }
    } else if ('union' in typeDefn) {
      if (!typeDefn.union.representation) {
        continue
      }

      if ('keyed' in typeDefn.union.representation) {
        // Generate interface for the union
        typesrc += `type ${typeName} interface {\n`
        typesrc += `\t${typeName.charAt(0).toLowerCase() + typeName.slice(1)}()\n`
        typesrc += '}\n\n'
      } else if ('kinded' in typeDefn.union.representation) {
        // Generate interface for the union
        typesrc += `type ${typeName} interface {\n`
        typesrc += `\t${typeName.charAt(0).toLowerCase() + typeName.slice(1)}()\n`
        typesrc += '}\n\n'

        // Generate wrapper types for each kind
        for (const [, memberType] of Object.entries(typeDefn.union.representation.kinded)) {
          // Generate wrapper type
          let goType = memberType
          // Check if memberType is a basic IPLD type
          if (['Bool', 'Int', 'Float', 'String', 'Bytes', 'Link'].includes(memberType)) {
            goType = getGoType([], memberType)
            goType = fixGoType(imports, goType, false)
          }
          typesrc += `type ${typeName}_${memberType} ${goType}\n`
          typesrc += `func (${typeName}_${memberType}) ${typeName.charAt(0).toLowerCase() + typeName.slice(1)}() {}\n\n`
        }
      }
    }
  }

  let go = `package ${options.package || 'main'}\n\n`
  imports = sortGoImports(imports)
  if (imports.length > 0) {
    go += 'import (\n'
    for (const imp of imports) {
      go += `\t${imp}\n`
    }
    go += ')\n\n'
  }
  go += typesrc.replace(/\n\n$/, '\n')

  return go
}

/**
 * @param {{ [k in string]: string }[]} annotations
 * @param {string} fieldName
 * @returns {string}
 */
function fixGoName (annotations, fieldName) {
  if (annotations.length > 0) {
    // if there is a 'gotype', use that
    for (const annotation of annotations) {
      if ('gorename' in annotation) {
        return annotation.gorename
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
function getGoType (annotations, ipldType) {
  if (annotations.length > 0) {
    // if there is a 'gotype', use that
    for (const annotation of annotations) {
      if ('gotype' in annotation) {
        return annotation.gotype
      }
    }
    if (ipldType === 'Int' && annotations.find((a) => 'unsigned' in a)) {
      return 'uint64'
    }
  }
  switch (ipldType) {
    case 'Int':
      return 'int64'
    case 'Float':
      return 'float64'
    case 'Bool':
      return 'bool'
    case 'String':
      return 'string'
    case 'Bytes':
      return '[]byte'
    case 'Link':
      return 'github.com/ipfs/go-cid.Cid'
    case 'Map':
      return 'map[string]interface{}'
    case 'List':
      return '[]interface{}'
    case 'Union':
      return 'interface{}'
    case 'Any':
      return 'interface{}'
  }
  return ipldType
}

/**
 * @param {string[]} imports
 * @param {string} gotype
 * @param {boolean} slice
 * @returns {string}
 */
function fixGoType (imports, gotype, slice) {
  if (gotype.includes('.') || gotype.includes('/')) {
    // import is everything up to the final '.'
    const imp = gotype.replace(/\.[^.]+$/, '')
    imports.push(`"${imp}"`)
    // type is everything after the final '/'
    const pkgTyp = gotype.replace(/^.+\//, '').split('.')
    if (pkgTyp.length > 2) {
      throw new Error('Can\'t parse package type: ' + gotype)
    }
    // TODO: alias handling is really basic atm, this needs a lot of attention to apply the
    // various Go rules for implicit and explicit aliasing
    let [pkg, typ] = pkgTyp
    let aliased = false
    if (pkg.startsWith('go-')) {
      pkg = pkg.slice(3)
    }
    if (pkg.includes('-')) {
      aliased = true
      pkg = pkg.replace('-', '')
    }
    if (aliased) {
      imports[imports.length - 1] = `${pkg} "${imp}"`
    }
    gotype = `${pkg}.${typ}`
  }
  return (slice ? '[]' : '') + gotype
}

/**
 * @param {string[]} imports
 * @returns {string[]}
 */
function sortGoImports (imports) {
  // TODO: do this the way Go wants
  imports = imports.sort()
  // remove duplicates
  imports = imports.filter((imp, i) => imports.indexOf(imp) === i)
  return imports
}
