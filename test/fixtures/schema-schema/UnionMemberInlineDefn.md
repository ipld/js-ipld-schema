# schema-schema: `UnionMemberInlineDefn`

UnionMemberInlineDefn is a very similar purpose to InlineDefn,
but found specifically within UnionMember.
It only allows describing a link type (and not maps nor lists, as InlineDefn does),
which is a constraint applied to union membership largely to make sure
if there are errors in processing unions, we can make legible messages about it!

```ipldsch
type UnionMemberInlineDefn union {
	| TypeDefnLink "link"
} representation keyed
```
