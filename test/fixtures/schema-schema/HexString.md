# schema-schema: `HexString`

HexString is an alias for string, to denote and clarify that it's not a regular freetext string.
It's seen used in the UnionRepresentation_BytesPrefix type.

(We use hexadecimal strings in the schema-schema in some places,
even though we could've used bytes types, because the schema DSL also uses hex strings,
and consistency (and, the ability to keep the schema-schema in plain JSON!) is valuable.)

```ipldsch
type HexString string
```
