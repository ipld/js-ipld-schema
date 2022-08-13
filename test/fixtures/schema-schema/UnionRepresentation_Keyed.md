# schema-schema: `UnionRepresentation_Keyed`

"Keyed" union representations will encode as a map, where the map has
exactly one entry, the key string of which will be used to look up the name
of the Type; and the value should be the content, and be of that Type.

Note: when writing a new protocol, it may be wise to prefer keyed unions
over the other styles wherever possible; keyed unions tend to have good
performance characteristics, as they have most "mechanical sympathy" with
parsing and deserialization implementation order.

```ipldsch
type UnionRepresentation_Keyed {String:UnionMember}
```
