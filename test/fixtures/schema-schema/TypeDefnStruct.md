# schema-schema: `TypeDefnStruct`

TypeDefnStruct describes a type which has a group of fields of varying Type.
Each field has a name, which is used to access its value, similarly to
accessing values in a map.

The most typical representation of a struct is as a map, in which case field
names also serve as the the map keys (though this is a default, and details
of this representation may be configured; and other representation strategies
also exist).


```ipldsch
type TypeDefnStruct struct {
	fields {FieldName:StructField}
	representation StructRepresentation
}
```
