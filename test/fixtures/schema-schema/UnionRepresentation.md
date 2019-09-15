# schema-schema: `UnionRepresentation`

UnionRepresentation is a union of all the distinct ways a TypeUnion's values
can be mapped onto a serialized format for the IPLD Data Model.

There are "keyed", "envelop", and "inline" strategies, which are all ways
to produce representations in a map format (some literature may describe
this as "tagged" style unions), and a fourth style, "kinded" unions, may
actually encode itself as any of the other representation kinds!

Note: Unions can be used to produce a "nominative" style of type declarations
-- yes, even given that IPLD Schema systems are natively "structural" typing!


```ipldsch
type UnionRepresentation union {
	| UnionRepresentation_Kinded "kinded"
	| UnionRepresentation_Keyed "keyed"
	| UnionRepresentation_Envelope "envelope"
	| UnionRepresentation_Inline "inline"
} representation keyed
```
