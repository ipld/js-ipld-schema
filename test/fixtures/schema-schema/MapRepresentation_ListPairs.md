# schema-schema: `MapRepresentation_ListPairs`

MapRepresentation_ListPairs describes that a map should be encoded as a
list in the IPLD Data Model. This list comprises a sub-list for each entry,
in the form: [[k1,v1],[k2,v2]].

This representation type is similar to StructRepresentation_Tuple except
it includes the keys. This is critical for maps since the keys are not
defined in the schema (hence "tuple" representation isn't available for
maps).


```ipldsch
type MapRepresentation_ListPairs struct {}
```
