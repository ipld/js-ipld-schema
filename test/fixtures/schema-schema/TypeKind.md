# schema-schema: `TypeKind`

TypeKind enumerates all the major kinds of type.
Notice this enum's members are the same as the set of strings used as
discriminants in the TypeDefn union.
(Almost!  TypeDefn also contains TypeDefnCopy, which is a slight outlier.
(TypeDefnCopy can be used to define a type, but isn't a typekind itself.))

This enum is not actually used elsewhere in the schema-schema,
but does correspond to the discriminant values used in the TypeDefn union.

```ipldsch
type TypeKind enum {
	| Bool ("bool")
	| String ("string")
	| Bytes ("bytes")
	| Int ("int")
	| Float ("float")
	| Map ("map")
	| List ("list")
	| Link ("link")
	| Union ("union")
	| Struct ("struct")
	| Enum ("enum")
	| Unit ("unit")
	| Any ("any")
}
```
