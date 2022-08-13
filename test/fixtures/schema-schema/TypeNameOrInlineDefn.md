# schema-schema: `TypeNameOrInlineDefn`

TypeNameOrInlineDefn is a union of either TypeName or an InlineDefn.
It's used for the value type in the recursive types (maps, lists, and the fields of structs),
which allows the use of InlineDefn in any of those positions.

TypeNameOrInlineDefn is simply a TypeName if the kind of data is a string;
this is simple and common case.
If the data is a map, then it requires further recognition as an InlineDefn.

Note that TypeNameOrInlineDefn isn't used to describe *keys* in the recursive types that
have them (maps, structs) -- recursive types in keys would not lend itself
well to serialization!
TypeNameOrInlineDefn also isn't used to describe members in Unions -- this is a choice
aimed to limit syntactical complexity (both at type definition authoring
time, as well as for the sake of error messaging during typechecking).


```ipldsch
type TypeNameOrInlineDefn union {
	| TypeName string
	| InlineDefn map
} representation kinded
```
