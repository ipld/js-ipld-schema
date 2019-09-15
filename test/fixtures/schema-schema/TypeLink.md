# schema-schema: `TypeLink`

TypeLink describes a hash linking to another object (a CID).

A link also has an "expectedType" that provides a hinting mechanism
suggesting what we should find if we were to follow the link. This
cannot be strictly enforced by a node or block-level schema
validation but may be enforced elsewhere in an application relying on
a schema.

The expectedType is specified with the `&Any` link shorthand, where
`Any` may be replaced with a specific type.

Unlike other kinds, we use `&Type` to denote a link Type rather than
`Link`. In this usage, we replace `Type` the expected Type, with `&Any`
being shorthand for "a link which may resolve to a type of any kind".

`expectedType` is a String, but it should validate as "Any" or a TypeName
found somewhere in the schema.


```ipldsch
type TypeLink struct {
	expectedType String (implicit "Any")
}
```
