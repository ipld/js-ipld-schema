# schema-schema: `TypeKind`

TypeKind enumerates all the major kinds of type.
Notice this enum's members are the same as the set of strings used as
discriminants in the Type union.

TODO: not actually sure we'll need to declare this.  Only usage is
in the Type union representation details?

```ipldsch
type TypeKind enum {
	| "bool"
	| "string"
	| "bytes"
	| "int"
	| "float"
	| "map"
	| "list"
	| "link"
	| "union"
	| "struct"
	| "enum"
	| "copy"
}
```
