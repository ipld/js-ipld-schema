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

Note that `create()` will _create_ a `toTyped()` / `toRepresentation()` function pair for you to run. For best performance results, you should do this just once with any given schema and reuse these functions whenever you need to process or validate data.

Typically, your application will want to interact with typed data, particularly when the representation form is terse and not as easy to modify. IPLD Schemas give you the ability to validate, decode and transform representation data to safely hand off to your application layer.

#### From representation form to typed form

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
if (typedData === undefined) {
  throw new TypeError('Invalid data form, does not match schema')
}

// what do we have?
console.log('Typed form:', typedData)

// →
// Typed form: {
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

#### From typed form to representation form

Once your application has a typed form of data and makes modifications, the data can be validated and transformed back into the representation form.

```js
// modify our typed form now we have it in a form that makes sense to our application
typedData.depth += 50
typedData.plants[0].height += 2
typedData.plants[1].height += 2
typedData.plants[2].height += 1
typedData.plants.push({ species: 'StarJasmine', height: 5 })

// validate and transform back into representation form
const newData = schemaTyped.toRepresentation(typedData)
if (newData === undefined) {
  throw new TypeError('Invalid data form, does not match schema')
}

// what do we have?
console.log('Modified representation data:', JSON.stringify(newData))

// →
// ["Home",460,250,[[1,32],[1,30],[1,30],[2,10],[2,11],[3,140],[4,230],[4,200],[2,5]]]
```

## Command line

**@ipld/schema also exports an executable**: if installed with `-g` you will get an `ipld-schema` command in your `PATH`.

This executable has two commands that operate on files or stdin.

  * `ipld-schema validate [files...]`: Accepts .ipldsch and .md files, if none are passed will read from stdin, returns exit code 0 on successful validation
  * `ipld-schema to-json [-t] [files...]`: Accepts .ipldsch files, if none are passed will read from stdin, prints the JSON form of the schema
  * `ipld-schema to-schema [-t] [files...]`: Accepts .ipldsch and .md files, if none are passed will read from stdin, prints the canonical IPLD Schema form of the schema
  * `ipld-schema json-to-schema [files...]`: Accepts .json files, if none are passed will read from stdin, prints the canonical IPLD Schema form of the schema represented by the JSON
  * `ipld-schema to-js [--cjs] [files...]`: Accepts .ipldsch files, if none are passed will read from stdin, prints a JavaScript module that exports a typed and representation converter/validator pair. If `--cjs` is passed, the returned JavaScript with be in CJS form, otherwise it will be in ESM form. These are the same pair that are generated from a `@ipld/schema/typed.js#create()` call for the schema in question, except that all types discovered within the schema will be exported as well.

`validate`, `to-json`, `to-schema`, and `to-js` take either .ipldsch or .md files. When using .md files, `ipld-schema` will extract any \`\`\` code blocks using the `ipldsch` or `sh` language codes.

## License & Copyright

Copyright 2019 Rod Vagg

Licensed under either of

 * Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / http://www.apache.org/licenses/LICENSE-2.0)
 * MIT ([LICENSE-MIT](LICENSE-MIT) / http://opensource.org/licenses/MIT)

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.