# schema-schema: `UnionRepresentation_BytePrefix`

UnionRepresentation_BytePrefix describes a union representation for unions
whose member types are all bytes. It is encoded to a byte array whose
first byte is the discriminator and subsequent bytes form the discriminated
type.

byteprefix is an invalid representation for any union that contains a type
that does not have a bytes representation.


```ipldsch
type UnionRepresentation_BytePrefix struct {
	discriminantTable {TypeName:Int}
}
```
