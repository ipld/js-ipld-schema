# schema-schema: `StructRepresentation_ListPairs`

StructRepresentation_ListPairs describes that a struct, should be encoded as
a list in the IPLD Data Model. This list comprises a sub-list for each
entry, in the form: [[k1,v1],[k2,v2]].

This representation type encodes in the same way as
MapStructRepresentation_Tuple. It is also similar to
StructRepresentation_Tuple except it includes the keys in nested lists.
A tuple representation for a struct will encode more compact than listpairs.


```ipldsch
type StructRepresentation_ListPairs struct {}
```
