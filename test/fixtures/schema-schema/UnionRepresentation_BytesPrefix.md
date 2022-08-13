# schema-schema: `UnionRepresentation_BytesPrefix`

UnionRepresentation_BytesPrefix describes a union representation for unions
whose member types are all bytes. It is encoded to a byte array whose
first bytes are the discriminator and subsequent bytes form the discriminated
type.

Discriminators are represented as hexadecimal strings. There is currently
no limitation on their length, other than needing to be at least one byte.
Nor is there a requirement that they all be of the same length, although
they must all represent unique prefixes.

Only valid, upper-case, hexadecimal strings representing at least one byte
are allowed.

bytesprefix is an invalid representation for any union that contains a type
that does not have a bytes representation.


```ipldsch
type UnionRepresentation_BytesPrefix struct {
	prefixes {HexString:TypeName}
}
```
