# schema-schema: `Kinded`

"Kinded" union representations describe a bidirectional mapping between
a RepresentationKind and a Type (referenced by name) which should be the
union member decoded when one sees this RepresentationKind.

The referenced type must of course produce the RepresentationKind it's
matched with!

```ipldsch
type UnionRepresentation_Kinded {RepresentationKind:TypeName}
```
