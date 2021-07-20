# schema-schema: `UnionRepresentation_Inline`

"Inline" union representations require that all of their members encode
as a map, and encode their type info into the same map as the member data.
Thus, the map for an inline union may have any number of entries: it is
however many fields the member value has, plus one (for the discriminant).

All members of an inline union must be struct types and must encode to
the map RepresentationKind.  Other types which encode to map (such as map
types themselves!) cannot be used: the potential for content values with
with keys overlapping with the discriminantKey would result in undefined
behavior!  Similarly, the member struct types may not have fields which
have names that collide with the discriminantKey.

When designing a new protocol, use inline unions sparingly; despite
appearing simple, they have the most edge cases of any kind of union
representation, and their implementation is generally the most complex and
is difficult to optimize deserialization to support.

```ipldsch
type UnionRepresentation_Inline struct {
	discriminantKey String
	discriminantTable {String:TypeName}
}
```
