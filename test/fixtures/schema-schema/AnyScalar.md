# schema-schema: `AnyScalar`

AnyScalar defines a union of the basic non-complex kinds.

Useful defining usage of IPLD nodes that do compose from other nodes.


```ipldsch
type AnyScalar union {
	| Bool bool
	| String string
	| Bytes bytes
	| Int int
	| Float float
} representation kinded
```
