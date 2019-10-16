# schema-schema: `RepresentationKind`

RepresentationKind is similar to TypeKind, but includes only those concepts
which exist at the IPLD *Data Model* level.

In other words, structs, unions, and enumerations are not present:
those concepts are introduced in the IPLD Schema system, and when serialized,
all of them must be transformable to one of these representation kinds
(e.g. a "struct" TypeKind will usually be transformed to a "map"
RepresentationKind; "enum" TypeKind are always "string" RepresentationKind;
and so on.)

RepresentationKind strings are sometimes used to to indicate part of the
definition in the details of Type; for example, they're used describing
some of the detailed behaviors of a "kinded"-style union type.

```ipldsch
type RepresentationKind enum {
	| Bool
	| String
	| Bytes
	| Int
	| Float
	| Map
	| List
	| Link
}
```
