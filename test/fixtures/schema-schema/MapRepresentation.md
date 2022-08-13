# schema-schema: `MapRepresentation`

MapRepresentation describes how a map type should be mapped onto
its IPLD Data Model representation.

By default, a map type is also represented as a map in the Data Model,
but other representation strategies can be configured

Note that the `TypeDefnMap.representation` field is optional --
the default behavior is demarcated by the lack of any of these values.


```ipldsch
type MapRepresentation union {
	| MapRepresentation_StringPairs "stringpairs"
	| MapRepresentation_ListPairs "listpairs"
	| AdvancedDataLayoutName "advanced"
} representation keyed
```
