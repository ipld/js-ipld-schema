# schema-schema: `ListRepresentation`

ListRepresentation describes how a map type should be mapped onto
its IPLD Data Model representation.  By default a list is a list in the
data model but it may be replaced with an ADL.

Note that the `TypeDefnList.representation` field is optional --
the default behavior is demarcated by the lack of any of these values.


```ipldsch
type ListRepresentation union {
	| AdvancedDataLayoutName "advanced"
} representation keyed
```
