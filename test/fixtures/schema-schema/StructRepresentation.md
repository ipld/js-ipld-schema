# schema-schema: `StructRepresentation`

StructRepresentation describes how a struct type should be mapped onto
its IPLD Data Model representation.  Typically, maps are the representation
kind, but other kinds and details can be configured.


```ipldsch
type StructRepresentation union {
	| StructRepresentation_Map "map"
	| StructRepresentation_Tuple "tuple"
	| StructRepresentation_StringPairs "stringpairs"
	| StructRepresentation_StringJoin "stringjoin"
	| StructRepresentation_ListPairs "listpairs"
} representation keyed
```
