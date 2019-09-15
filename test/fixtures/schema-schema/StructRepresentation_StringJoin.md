# schema-schema: `StructRepresentation_StringJoin`

StructRepresentation_StringJoin describes a way to encode a struct to
a string in the IPLD Data Model. Similar to tuple representation, the
keys are dropped as they may be inferred from the struct definition.
values are concatenated, in order, and separated by a "join" delimiter.
For example, specifying ":" as the "join": "v1,v2,v3".

stringjoin is necessarily restrictive and therefore only valid for structs
whose values may all be encoded to string form without conflicts in "join"
character. It is recommended, therefore, that its use be limited to structs
containing values with the basic data model kinds that exclude multiple
values (i.e. no maps, lists, and therefore structs or unions).


```ipldsch
type StructRepresentation_StringJoin struct {
	join String
	fieldOrder optional [FieldName]
}
```
