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
  for (const [typeName, typeDefn] of Object.entries(schema.types)) {
    if ('struct' in typeDefn) {
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
        fieldType = getGoType(annotations, fieldType)

        let linecomment = ''
        if (comments) {
          if (comments.precomments) {
            for (const comment of comments.precomments.split('\n')) {
              typesrc += `\t// ${comment}\n`
            }
          }
          if (comments.linecomment) {
            linecomment = ' // ' + comments.linecomment
          }
        }
        fieldType = fixGoType(imports, fieldType, slice)
        fieldName = fixGoName(annotations, fieldName)
        const gotag = annotations.reduce((acc, a) => 'gotag' in a ? ' ' + a.gotag : acc, '')
        typesrc += `\t${fieldName} ${fieldType}${gotag}${linecomment}\n`
      }

      typesrc += '}\n\n'
    }
  }

  let go = `package ${options.package || 'main'}\n\n`
  imports = sortGoImports(imports)
  if (imports.length === 1) {
    go += `import ${imports[0]}\n\n`
  } else if (imports.length > 1) {
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
