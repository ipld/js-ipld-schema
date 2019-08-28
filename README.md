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


**ipld-schema also exports an executable**: if installed with `-g` you will get an `ipldschema2json` command in your `PATH`. Run this with an IPLD Schema file as an argument and it will print JSON to standard out.

```
$ ipldschema2json.js simple-struct.ipldsch
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

## License and Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
