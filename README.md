# ipld-schema

[IPLD](http://ipld.io/) Schema Implementation: parser and utilities

IPLD Schemas are a work in progress but are already useful. Read more about IPLD Schemas at https://github.com/ipld/specs/tree/master/schemas

This project is also a work in progress, but should parse schemas as they are defined at the time of last publish.

## Usage

```js
const Schema = require('ipld-schema')

let schema = new Schema(`
  type SimpleStruct struct {
    foo Int
    bar Bool
    baz String
  }
  type MyMap { String: SimpleStruct }
`)

console.dir(schema.descriptor, { depth: Infinity })

// →
// {
//   SimpleStruct: {
//     kind: 'struct',
//     fields: {
//       foo: { type: 'Int' },
//       bar: { type: 'Bool' },
//       baz: { type: 'String' }
//     },
//     representation: { map: {} }
//   },
//   MyMap: { kind: 'map', keyType: 'String', valueType: 'SimpleStruct' }
// }
```

**`Schema#validate(block, rootType)`** can be used to validate an in-memory block representation against the schema defined by the `schema` object. It will throw an error if the block does not match the schema provided.

Continuing from the previous example:

```js
const myMap = {
  one: { foo: 100, bar: true, baz: 'one' },
  two: { foo: -100, bar: false, baz: 'two' },
  three: { foo: 1, bar: true, baz: 'three' },
}

// validate that 'one' is of type 'SimpleStruct'
schema.validate(myMap.one, 'SimpleStruct')

// validate that the whole 'myMap' object is of type 'MyMap'
schema.validate(myMap, 'MyMap')
```

## Command line

**ipld-schema also exports an executable**: if installed with `-g` you will get an `ipld-schema` command in your `PATH`.

This executable has two commands that operate on files or stdin.

  * `ipld-schema validate [files...]`
  * `ipld-schema to-json [-t] [files...]`

Both commands take either .ipldsch or .md files. When using .md files, `ipld-schema` will extract any \`\`\` code blocks using the `ipldsch` or `sh` language codes.

### Validation

The `validate` command will take an `.ipldsch` or `.md` file and validate its schema contents.

```
$ ipld-schema validate simple-struct.ipldsch
Validated simple-struct.ipldsch ...
```

or

```
$ ipld-schema validate README.md
Validated README.md ...
```

Alternatively, you can provide IPLD schema data via stdin:

```
$ cat simple-struct.ipldsch | ipld-schema validate
Validated <stdin> ...
```

### JSONification

The `to-json` command will take one or more .ipldsch or .md files and print a JSON form of the schemas found within.

```
$ ipld-schema to-json simple-struct.ipldsch
{
  "schema": {
    "SimpleStruct": {
      "kind": "struct",
      "fields": {
        "foo": {
          "type": "Int"
        },
        "bar": {
          "type": "Bool"
        },
        "baz": {
          "type": "String"
        }
      },
      "representation": {
        "map": {}
      }
    },
    "MyMap": {
      "kind": "map",
      "keyType": "String",
      "valueType": "SimpleStruct"
    }
  }
}
```

Provide a `-t` to print with tabs instead of two-spaces.

`ipld-schema to-json` also accepts input via stdin:

```
$ cat simple-struct.ipldsch | ipld-schema to-json
...
```

## License and Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
