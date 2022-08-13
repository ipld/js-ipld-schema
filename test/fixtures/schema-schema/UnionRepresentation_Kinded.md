# schema-schema: `UnionRepresentation_Kinded`

"Kinded" union representations describe a bidirectional mapping between
a RepresentationKind and the type which should be the
union member decoded when one sees this RepresentationKind.

The referenced type must of course produce the RepresentationKind it's
matched with!

```ipldsch
type UnionRepresentation_Kinded {RepresentationKind:UnionMember}
```
