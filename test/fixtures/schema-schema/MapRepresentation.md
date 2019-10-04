# schema-schema: `MapRepresentation`

MapRepresentation describes how a map type should be mapped onto
its IPLD Data Model representation.  By default a map is a map in the
Data Model but other kinds can be configured.


```ipldsch
type MapRepresentation union {
	| MapRepresentation_Map "map"
	| MapRepresentation_StringPairs "stringpairs"
	| MapRepresentation_ListPairs "listpairs"
	| AdvancedDataLayoutName "advanced"
} representation keyed
```
