# schema-schema: `TypeName`

Type names are a simple alias of string.

There are some additional rules that should be applied. Type names:
  - *Must* only contain alphanumeric ASCII characters and underscores
  - *Must* begin with a capital letter
  - *Should* avoid more than one connected underscore character,
    multiple-underscores may be used for codegen

Type names are strings meant for human consumption at a local scope.
When making a Schema, note that the TypeName is the key of the map:
a TypeName must be unique within the Schema.


```ipldsch
type TypeName string
```
