# ipld-schema

[IPLD](http://ipld.io/) Schema DSL Parser and CLI utilities

Read more about IPLD Schemas at https://github.com/ipld/specs/tree/master/schemas

For validation of JavaScript object forms against an IPLD schema, see [ipld-schema-validator](https://github.com/rvagg/js-ipld-schema-validator).

## Usage

```js
import { parse } from 'ipld-schema'

let schema = parse(`
  type SimpleStruct struct {
    foo Int
    bar Bool
    baz String
  }
  type MyMap { String: SimpleStruct }
`)

console.dir(schema, { depth: Infinity })

// →
// {
//   SimpleStruct: {
//     struct: {
//       fields: {
//         foo: { type: 'Int' },
//         bar: { type: 'Bool' },
//         baz: { type: 'String' }
//       },
//       representation: { map: {} }
//     }
//   },
//   MyMap: { map: { keyType: 'String', valueType: 'SimpleStruct' } }
// }
```

You can also convert the parsed form back to DSL form with the `print` function:

```js
import { print } from 'ipld-schema/print.js'

console.log(print(schema))
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
      "struct": {
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
      }
    },
    "MyMap": {
      "map": {
        "keyType": "String",
        "valueType": "SimpleStruct"
      }
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
