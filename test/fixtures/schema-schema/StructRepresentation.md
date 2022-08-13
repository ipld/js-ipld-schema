# schema-schema: `StructRepresentation`

StructRepresentation describes how a struct type should be mapped onto
its IPLD Data Model representation.

The default representation strategy for struct types is a map,
with the struct's field names as keys.
However, that can be configured.
For example, the map representation can be configured with
directives to use different keys in the representation form;
or, configured to consider some fields as having values which should be seen as the implicit value for that field,
meaning the entire field shouldn't get an entry in the representation map if that value is found in that field.
Or, wholly different representation strategies can be used
(such as the tuple strategy, which results in a data model list kind,
or stringjoin, which results a data model string kind!).


```ipldsch
type StructRepresentation union {
	| StructRepresentation_Map "map"
	| StructRepresentation_Tuple "tuple"
	| StructRepresentation_StringPairs "stringpairs"
	| StructRepresentation_StringJoin "stringjoin"
	| StructRepresentation_ListPairs "listpairs"
} representation keyed
```
