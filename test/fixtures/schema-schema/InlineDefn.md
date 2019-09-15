# schema-schema: `InlineDefn`

InlineDefn represents a declaration of an anonymous type of one of the simple
recursive kinds (e.g. map or list) which is found "inline" in another type's
definition.  It's the more complex option of the TypeTerm union.

Note that the representation of this union -- `representation inline "kind"`
-- as well as the keywords for its members -- align exactly with those
in the Type union.  Technically, this isn't a necessary property (in that
nothing would break if that sameness was violated) but it's awfully nice for
sanity; what we're saying here is that the representation of the types in an
InlineDefn should look *exactly the same* as the top-level Types... it's just
that we're restricted to a subset of the members.


```ipldsch
type InlineDefn union {
	| TypeMap "map"
	| TypeList "list"
} representation inline {
	discriminantKey "kind"
}
```
