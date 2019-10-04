# schema-schema: `ListRepresentation`

ListRepresentation describes how a map type should be mapped onto
its IPLD Data Model representation.  By default a list is a list in the
data model but it may be replaced with an ADL.


```ipldsch
type ListRepresentation union {
	| ListRepresentation_List "list"
	| AdvancedDataLayoutName "advanced"
} representation keyed
```
