# schema-schema: `UnionRepresentation`

UnionRepresentation is a union of all the distinct ways a TypeUnion's values
can be mapped onto a serialized format for the IPLD Data Model.

There are five strategies that can be used to encode a union:
"keyed", "envelope", "inline", "byteprefix", and "kinded".
The "keyed", "envelope", and "inline" strategies are all ways to produce
representations in a map format, using map keys as type discriminators
(some literature may describe this as a "tagged" style of union).
The "byteprefix" strategy, only available only for unions in which all
member types themselves represent as bytes in the data model, uses another
byte as the type discrimination hint (and like the map-oriented strategies,
may also be seen as a form of "tagged" style unions).
The "kinded" strategy can describe a union in which member types have
several different representation kinds, and uses the representation kind
itself as the type discrimination hint to do so.

Note: Unions can be used to produce a "nominative" style of type declarations
-- yes, even given that IPLD Schema systems are natively "structural" typing!


```ipldsch
type UnionRepresentation union {
	| UnionRepresentation_Kinded "kinded"
	| UnionRepresentation_Keyed "keyed"
	| UnionRepresentation_Envelope "envelope"
	| UnionRepresentation_Inline "inline"
	| UnionRepresentation_BytePrefix "byteprefix"
} representation keyed
```
