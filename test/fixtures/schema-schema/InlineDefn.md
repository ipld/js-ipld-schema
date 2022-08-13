# schema-schema: `InlineDefn`

InlineDefn represents a declaration of an anonymous type of one of the simple
recursive kinds (e.g. map or list) which is found "inline" in another type's definition.
InlineDefn also allows description of anonymous but typed links for similar reasons.
InlineDefn is the more complex option of the TypeNameOrInlineDefn union.

Note that the representation of this union -- the use of a keyed representation,
as well as the keywords for its members -- align exactly with those
in the TypeNameOrInlineDefn union.  Technically, this isn't a necessary property (in that
nothing would break if that sameness was violated) but it's awfully nice for
sanity; what we're saying here is that the representation of the types in an
InlineDefn should look *exactly the same* as the top-level type declarations...
it's just that within an InlineDefn, we're restricted to a subset of the members.


```ipldsch
type InlineDefn union {
	| TypeDefnMap "map"
	| TypeDefnList "list"
	| TypeDefnLink "link"
} representation keyed
```
