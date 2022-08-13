# schema-schema: `UnionRepresentation_Envelope`

"Envelope" union representations will encode as a map, where the map has
exactly two entries: the two keys should be of the exact strings specified
for this envelope representation.  The value for the discriminant key
should be one of the strings in the discriminant table.  The value for
the content key should be the content, and be of the Type matching the
lookup in the discriminant table.

```ipldsch
type UnionRepresentation_Envelope struct {
	discriminantKey String
	contentKey String
	discriminantTable {String:UnionMember}
}
```
