# schema-schema: `RepresentationKind`

RepresentationKind is similar to TypeKind, but includes only those concepts
which exist at the IPLD *Data Model* level.

In other words, structs, unions, and enumerations are not present:
those concepts are introduced in the IPLD Schema system, and when serialized,
all of them must be transformable to one of these representation kinds
(e.g. a "struct" TypeKind will usually be transformed to a "map"
RepresentationKind; "enum" TypeKind are typically a "string" RepresentationKind;
and so on; exactly what RepresentationKind a type defintion will have
is determined by its representation strategy).

RepresentationKind strings are sometimes used to to indicate part of the
definition in the details of TypeDefn; for example, they're used describing
some of the detailed behaviors of a "kinded"-style union type.

```ipldsch
type RepresentationKind enum {
	| Bool ("bool")
	| String ("string")
	| Bytes ("bytes")
	| Int ("int")
	| Float ("float")
	| Map ("map")
	| List ("list")
	| Link ("link")
}
```
