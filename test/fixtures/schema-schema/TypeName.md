# schema-schema: `Type`

Type names are a simple alias of string.

There are some additional rules that should be applied:
  - Type names should by convention begin with a capital letter;
  - Type names must be all printable characters (no whitespace);
  - Type names must not contain punctuation other than underscores
    (dashes, dots, etc.).

Type names are strings meant for human consumption at a local scope.
When making a Schema, note that the TypeName is the key of the map:
a TypeName must be unique within the Schema.


```ipldsch
type TypeName string
```
