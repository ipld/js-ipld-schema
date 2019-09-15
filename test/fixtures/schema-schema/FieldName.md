# schema-schema: `FieldName`

FieldName is an alias of string.

There are some additional rules that should be applied:
  - Field names should by convention begin with a lower-case letter;
  - Field names must be all printable characters (no whitespace);
  - Field names must not contain punctuation other than underscores
    (dashes, dots, etc.).

Field names are strings meant for human consumption at a local scope.
When making a Schema, note that the FieldName is the key of the map:
a FieldName must be unique within the Schema.


```ipldsch
type FieldName string
```
