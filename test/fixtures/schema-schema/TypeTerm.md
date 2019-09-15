# schema-schema: `TypeTerm`

TypeTerm is a union of either TypeName or an InlineDefn. th It's used for the
value type in the recursive types (maps, lists, and the fields of structs),
which allows the use of InlineDefn in any of those positions.

TypeTerm is simply a TypeName if the kind of data is a string; this is the
simple case.

Note that TypeTerm isn't used to describe *keys* in the recursive types that
have them (maps, structs) -- recursive types in keys would not lend itself
well to serialization!
TypeTerm also isn't used to describe members in Unions -- this is a choice
aimed to limit syntactical complexity (both at type definition authoring
time, as well as for the sake of error messaging during typechecking).


```ipldsch
type TypeTerm union {
	| TypeName string
	| InlineDefn map
} representation kinded
```
