# schema-schema: `StructRepresentation_Tuple`

StructRepresentation_Tuple describes a way to map a struct type into a list
representation.

Tuple representations are less flexible than map representations:
field order can be specified in order to override the order defined
in the type, but optionals and implicits are not (currently) supported.
A `fieldOrder` list must include quoted strings (FieldName is a string
type) which are coerced to the names of the struct fields. e.g.:
  fieldOrder ["Foo", "Bar", "Baz"]


```ipldsch
type StructRepresentation_Tuple struct {
	fieldOrder optional [FieldName]
}
```
