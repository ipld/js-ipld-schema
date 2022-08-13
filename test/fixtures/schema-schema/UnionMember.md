# schema-schema: `UnionMember`

UnionMember is a type for identifying the members of a union.
Most commonly, this is simply a TypeName string;
however, it can also be a UnionMemberInlineDefn,
which is used to allow inline link definitions within a kinded union as a shorthand
(rather than requiring all links be declared as a named type before being usable within a union).

```ipldsch
type UnionMember union {
	| TypeName string
	| UnionMemberInlineDefn map
} representation kinded
```
