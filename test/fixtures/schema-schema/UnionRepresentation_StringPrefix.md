# schema-schema: `UnionRepresentation_StringPrefix`

UnionRepresentation_StringPrefix describes a union representation for unions
whose member types are all strings. Strings used for this representation
strategy use the first characters as the discriminator, and the subsequent
characters as the discriminated type's value.

There is currently no limitation on prefix length, other than needing to be
at least one character. Nor is there a requirement that they all be of the
same length, although they must all represent unique prefixes.

stringprefix is an invalid representation for any union that contains a type
that does not have a string representation.


```ipldsch
type UnionRepresentation_StringPrefix struct {
	prefixes {String:TypeName}
}
```
