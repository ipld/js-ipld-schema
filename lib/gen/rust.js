/**
 * @typedef {import('../../schema-schema').Schema} Schema
 * @typedef {import('../../schema-schema').FieldName} FieldName
 */

/**
 * @param {Schema} schema
 * @returns {string}
 */
export function generateRust (schema) {
  /** @type {string[]} */
  let imports = ['serde::Deserialize', 'serde::Serialize']

  let typesrc = ''
  for (const [typeName, typeDefn] of Object.entries(schema.types)) {
    if ('struct' in typeDefn) {
      /** @type {string[]} */
      const derive = []
      if ('representation' in typeDefn.struct && typeof typeDefn.struct.representation === 'object' && 'tuple' in typeDefn.struct.representation) {
        imports.push('serde_tuple::Deserialize_tuple', 'serde_tuple::Serialize_tuple')
        derive.push('Deserialize_tuple', 'Serialize_tuple')
      } else {
        // Default representation is map, add regular Serialize/Deserialize
        derive.push('Deserialize', 'Serialize')
      }
      /** @type { { [k in string]: string }[]} */
      let annotations = []
      if (typeof typeDefn.struct.annotations === 'object' && typeof typeDefn.struct.annotations.type === 'object') {
        annotations = typeDefn.struct.annotations.type
      }
      for (const annotation of annotations) {
        if ('rustderive' in annotation) {
          derive.push(...annotation.rustderive.split(',').map((d) => d.trim()))
        }
      }
      if (derive.length) {
        derive.sort()
        typesrc += `#[derive(${derive.join(', ')})]\n`
      }
      typesrc += `pub struct ${typeName} {\n`

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
        } else if ('link' in fieldDefn.type) {
          // &Any or &Foo form, just use 'Link' for now, no use for type hints here
          fieldType = 'Link'
        } else {
          throw new Error('Unhandled field type: ' + JSON.stringify(fieldDefn))
        }
        fieldType = getRustType(annotations, fieldType)

        let linecomment = ''
        if (comments) {
          if (comments.precomments) {
            for (const comment of comments.precomments.trim().split('\n')) {
              typesrc += `    /// ${comment}\n`
            }
          }
          if (comments.linecomment) {
            linecomment = ' // ' + comments.linecomment
          }
        }
        // Handle nullable elements before fixing type
        if (elementNullable && !slice) {
          fieldType = `Option<${fieldType}>`
        }
        fieldType = fixRustType(imports, fieldType, slice)
        // For nullable list elements, wrap the element type in Option
        if (elementNullable && slice) {
          // fieldType is now Vec<T>, we need Vec<Option<T>>
          fieldType = fieldType.replace(/^Vec<(.+)>$/, 'Vec<Option<$1>>')
        }
        fieldName = fixRustName(annotations, fieldName)
        typesrc += `    pub ${fieldName}: ${fieldType},${linecomment}\n`
      }

      typesrc += '}\n\n'
    } else if ('list' in typeDefn) {
      // Handle top-level list type definitions
      if (typeof typeDefn.list.valueType !== 'string') {
        throw new Error('Unhandled list value type: ' + JSON.stringify(typeDefn))
      }
      let valueType = getRustType([], typeDefn.list.valueType)
      valueType = fixRustType(imports, valueType, false)

      // Handle nullable elements
      if (typeDefn.list.valueNullable) {
        valueType = `Option<${valueType}>`
      }

      typesrc += `pub type ${typeName} = Vec<${valueType}>;\n\n`
    } else if ('enum' in typeDefn) {
      // Check for type override annotation
      /** @type { { [k in string]: string }[]} */
      let annotations = []
      if (typeof typeDefn.enum.annotations === 'object' && typeof typeDefn.enum.annotations.type === 'object') {
        annotations = typeDefn.enum.annotations.type
      }

      // Check if we have a rusttype annotation
      const rusttypeAnnotation = annotations.find(a => 'rusttype' in a)
      if (rusttypeAnnotation) {
        // Type alias to external type - preserve the full path
        imports.push(rusttypeAnnotation.rusttype)
        typesrc += `pub type ${typeName} = ${rusttypeAnnotation.rusttype};\n\n`
      } else {
        // Generate native Rust enum
        const isIntRepr = typeDefn.enum.representation && 'int' in typeDefn.enum.representation

        // Add derives
        const derives = ['Deserialize', 'Serialize']
        if (annotations.find(a => 'rustderive' in a)) {
          const customDerives = annotations.find(a => 'rustderive' in a).rustderive.split(',').map(d => d.trim())
          derives.push(...customDerives)
        }
        typesrc += `#[derive(${derives.join(', ')})]\n`

        // Add serde repr attribute for int enums
        if (isIntRepr) {
          typesrc += '#[serde(repr = "int")]\n'
        }

        typesrc += `pub enum ${typeName} {\n`

        for (const member of typeDefn.enum.members) {
          // Check if we need a rename attribute
          let needsRename = false
          let renameValue = ''

          if (!isIntRepr && typeDefn.enum.representation && 'string' in typeDefn.enum.representation &&
              typeDefn.enum.representation.string && member in typeDefn.enum.representation.string) {
            renameValue = typeDefn.enum.representation.string[member]
            needsRename = renameValue !== member
          }

          if (needsRename) {
            typesrc += `    #[serde(rename = "${renameValue}")]\n`
          }

          typesrc += `    ${member}`

          // Add int value for int representation
          if (isIntRepr && typeDefn.enum.representation.int && member in typeDefn.enum.representation.int) {
            typesrc += ` = ${typeDefn.enum.representation.int[member]}`
          }

          typesrc += ',\n'
        }

        typesrc += '}\n\n'
      }
    }
  }

  let rust = ''
  imports = fixRustImports(imports)
  for (const imp of imports) {
    rust += `use ${imp};\n`
  }
  if (imports.length > 0) {
    rust += '\n'
  }
  rust += typesrc.replace(/\n\n$/, '\n')

  return rust
}

/**
 * @param {{ [k in string]: string }[]} annotations
 * @param {string} fieldName
 * @returns {string}
 */
function fixRustName (annotations, fieldName) {
  if (annotations.length > 0) {
    // if there is a 'rusttype', use that
    for (const annotation of annotations) {
      if ('rustrename' in annotation) {
        return annotation.rustrename
      }
    }
  }
  // snake case
  fieldName = fieldName
    // handle consecutive capitals as a single group
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    // ensure uppercase letters at the start or after a lowercase letter are preceded by an underscore
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase()
  if (fieldName.startsWith('_')) {
    fieldName = fieldName.slice(1)
  }
  return fieldName
}

/**
 * @param {{ [k in string]: string }[]} annotations
 * @param {string} ipldType
 * @returns {string}
 */
function getRustType (annotations, ipldType) {
  if (annotations.length > 0) {
    // if there is a 'rusttype', use that
    for (const annotation of annotations) {
      if ('rusttype' in annotation) {
        return annotation.rusttype
      }
    }
    if (ipldType === 'Int' && annotations.find((a) => 'unsigned' in a)) {
      return 'u64'
    }
  }
  switch (ipldType) {
    case 'Int':
      return 'i64'
    case 'Float':
      return 'f64'
    case 'Bool':
      return 'bool'
    case 'String':
      return 'String'
    case 'Bytes':
      return 'Vec<u8>'
    case 'Link':
      return 'cid::Cid'
    case 'Map':
      return 'HashMap<String, Value>' // TODO: Value is a placeholder
    case 'List':
      return 'Vec<Value>' // TODO: Value is a placeholder
    case 'Union':
      return 'Value' // TODO: Value is a placeholder
    case 'Any':
      return 'Value' // TODO: Value is a placeholder
  }

  return ipldType
}

/**
 * @param {string[]} imports
 * @param {string} rusttype
 * @param {boolean} slice
 * @returns {string}
 */
function fixRustType (imports, rusttype, slice) {
  if (rusttype.includes('::')) {
    imports.push(rusttype)
    // type is everything after the final '::'
    rusttype = rusttype.replace(/^.+::/, '')
  }
  if (slice) {
    return `Vec<${rusttype}>`
  }
  return rusttype
}

/**
 * @param {string[]} imports
 * @returns {string[]}
 */
function fixRustImports (imports) {
  // TODO: do this the way rustfmt wants
  imports = imports.sort()
  // remove duplicates
  imports = imports.filter((imp, i) => imports.indexOf(imp) === i)

  // collapse imports
  const collapsedImports = imports.reduce((/** @type {{[k: string]: string[]}} */ acc, imp) => {
    const parts = imp.split('::')
    const item = parts.pop()
    const modulePath = parts.join('::')

    if (!acc[modulePath]) {
      acc[modulePath] = []
    }
    if (item) {
      acc[modulePath].push(item)
    }
    return acc
  }, {})

  // convert collapsed imports into the final format
  imports = Object.entries(collapsedImports).map(([modulePath, items]) => {
    if (items.length > 1) {
      items.sort()
      return `${modulePath}::{${items.join(', ')}}`
    } else {
      return `${modulePath}::${items[0]}`
    }
  })

  // organise into std, external, crate
  const ext = imports.filter((imp) => !imp.startsWith('crate'))
  const crate = imports.filter((imp) => imp.startsWith('crate'))
  imports = ext.concat(crate)
  return imports
}
