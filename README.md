# ipld-schema

[IPLD](http://ipld.io/) Schema Implementation: parser and utilities

_This is a work in progress and IPLD Schemas are a work in progress. Don't expect this to be useful. See https://github.com/ipld/specs/pull/113 for ongoing IPLD Schema spec definition and https://github.com/ipld/go-ipld-prime/tree/master/typed/declaration for some of the original IPLD Schema spec material._

## Usage

```js
const parser = require('ipld-schema')

const schema = parser.parse(`
  type SimpleStruct struct {
    foo Int
    bar Bool
    baz String
  }
  type MyMap map { String: SimpleStruct }
`)

console.dir(schema, { depth: Infinity })

// →
// { schema:
//    { SimpleStruct:
//       { kind: 'struct',
//         fields:
//          { foo: { type: 'Int' },
//            bar: { type: 'Bool' },
//            baz: { type: 'String' } },
//         representation: { map: {} } },
//      MyMap:
//       { kind: 'map',
//         keyType: 'String',
//         valueType: 'SimpleStruct',
//         representation: { map: {} } } } }
```

**ipld-schema also exports an executable**: if installed with `-g` you will get an `ipldschema2json` command in your `PATH`. Run this with an IPLD Schema file as an argument and it will print JSON to standard out.

```
$ ipldschema2json.js simple-struct.ipldsch
# →
# {
#   "schema": {
#     "SimpleStruct": {
#       "kind": "struct",
#       "fields": {
#         "foo": {
#           "type": "Int"
#         },
#         "bar": {
#           "type": "Bool"
#         },
#         "baz": {
#           "type": "String"
#         }
#       },
#       "representation": {
#         "map": {}
#       }
#     },
#     "MyMap": {
#       "kind": "map",
#       "keyType": "String",
#       "valueType": "SimpleStruct",
#       "representation": {
#         "map": {}
#       }
#     }
#   }
# }
```

## License and Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
