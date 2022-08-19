# @ipld/schema

JavaScript [IPLD](http://ipld.io/) Schema utilities.

**Since v4.0.0 this package has been renamed to `@ipld/schema`. It was previously published to npm as `ipld-schema`.**

Read more about IPLD Schemas at https://ipld.io/docs/schemas/

## Usage

### Parsing IPLD Schema DSL

IPLD Schemas have a parsed form, called a Data Model Tree (DMT), which is consumed where schemas are used. We can parse the DSL into the DMT with `from-dsl.js`:

```js
import { fromDSL } from '@ipld/schema/from-dsl.js'

let schema = fromDSL(`
  type SimpleStruct struct {
    foo Int
    bar Bool
    baz String
  }
  type MyMap { String: SimpleStruct }
`)

console.dir(schema.types, { depth: Infinity })

// →
// {
//   SimpleStruct: {
//     struct: {
//       fields: {
//         foo: { type: 'Int' },
//         bar: { type: 'Bool' },
//         baz: { type: 'String' }
//       }
//     }
//   },
//   MyMap: { map: { keyType: 'String', valueType: 'SimpleStruct' } }
// }
```

You can also convert the DMT form back to DSL form with `to-dsl.js`:

```js
import { toDSL } from '@ipld/schema/to-dsl.js'
const schema = {
  types: {
    SimpleStruct: {
      struct: {
        fields: {
          foo: { type: 'Int' },
          bar: { type: 'Bool' },
          baz: { type: 'String' }
        }
      }
    },
    MyMap: { map: { keyType: 'String', valueType: 'SimpleStruct' } }
  }
}

console.log(toDSL(schema))

// →
// type SimpleStruct struct {
//   foo Int
//   bar Bool
//   baz String
// }
//
// type MyMap {String:SimpleStruct}
```

### Typed converters / validators

Use `typed.js` to create a converter/validator from an IPLD Schema that can receive IPLD block data and return either `undefined` if the data form doesn't match the Schema, or the same data if the Schema doesn't involve any transformation, _or_ a transformed form of the data according to the Schema.

Note that `create()` will _create_ a `toTyped()` function for you to run. For best performance results, you should do this just once with any given schema and reuse function whenever you need to run it.

```js
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { create } from '@ipld/schema/typed.js'

// a schema for a terse data format
const schemaDsl = `
type Garden struct {
  name String
  width Int
  depth Int
  plants [Plant]
} representation tuple

type Plant struct {
  species PlantSpecies
  height Int
} representation tuple

type PlantSpecies enum {
  | Murraya     ("1")
  | StarJasmine ("2")
  | Lemon       ("3")
  | Camellia    ("4")
} representation int
`

// parse schema
const schemaDmt = fromDSL(schemaDsl)

// create a typed converter/validator
const schemaTyped = create(schemaDmt, 'Garden')

// some terse input data
const data = ['Home', 460, 200, [[1, 30], [1, 28], [1, 29], [2, 10], [2, 11], [3, 140], [4, 230], [4, 200]]]

// validate and transform
const typedData = schemaTyped.toTyped(data)

// what do we have?
console.dir(typedData)

// →
// {
//   name: 'Home',
//   width: 460,
//   depth: 200,
//   plants: [
//     { species: 'Murraya', height: 30 },
//     { species: 'Murraya', height: 28 },
//     { species: 'Murraya', height: 29 },
//     { species: 'StarJasmine', height: 10 },
//     { species: 'StarJasmine', height: 11 },
//     { species: 'Lemon', height: 140 },
//     { species: 'Camellia', height: 230 },
//     { species: 'Camellia', height: 200 }
//   ]
// }
```

## Command line

**@ipld/schema also exports an executable**: if installed with `-g` you will get an `ipld-schema` command in your `PATH`.

This executable has two commands that operate on files or stdin.

  * `ipld-schema validate [files...]`: Accepts .ipldsch and .md files, if none are passed will read from stdin, returns exit code 0 on successful validation
  * `ipld-schema to-json [-t] [files...]`: Accepts .ipldsch files, if none are passed will read from stdin, prints the JSON form of the schema
  * `ipld-schema to-schema [-t] [files...]`: Accepts .ipldsch and .md files, if none are passed will read from stdin, prints the canonical IPLD Schema form of the schema
  * `ipld-schema json-to-schema [files...]`: Accepts .json files, if none are passed will read from stdin, prints the canonical IPLD Schema form of the schema represented by the JSON

`validate` and `to-json` and `to-schema` take either .ipldsch or .md files. When using .md files, `ipld-schema` will extract any \`\`\` code blocks using the `ipldsch` or `sh` language codes.

## License and Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
