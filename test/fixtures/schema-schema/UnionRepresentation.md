# schema-schema: `UnionRepresentation`

UnionRepresentation is a union of all the distinct ways a TypeDefnUnion's values
can be mapped onto a serialized format for the IPLD Data Model.

There are six strategies that can be used to encode a union:
"keyed", "envelope", "inline", "stringprefix", "bytesprefix", and "kinded".
The "keyed", "envelope", and "inline" strategies are all ways to produce
representations in a map format, using map keys as type discriminators
(some literature may describe this as a "tagged" style of union).
The "stringprefix" strategy, only available for unions in which all member
types themselves represent as strings in the data model, uses a prefix
string as the type discrimination hint (and like the map-oriented strategies,
may also be seen as a form of "tagged" style unions).
The "bytesprefix" strategy, only available for unions in which all member
types themselves represent as bytes in the data model, similar to
"stringprefix" but with bytes.
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
	| UnionRepresentation_StringPrefix "stringprefix"
	| UnionRepresentation_BytesPrefix "bytesprefix"
} representation keyed
```
