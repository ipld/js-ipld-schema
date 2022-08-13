# schema-schema: `TypeDefnUnion`

TypeDefnUnion describes a union (sometimes called a "sum type", or
more verbosely, a "discriminated union", or in yet other literature, a "variant" type).
A union is a type that can have a value of several different types, but
unlike maps or structs, in a union, only one of those values may be present
at a time.

Unions can be represented in several significantly different ways:
see the documentation of the UnionRepresentation type for details.
Also note that there is no default representation for union types --
you must _always_ explicitly specify a representation strategy when defining unions!


```ipldsch
type TypeDefnUnion struct {
	members [UnionMember]
	representation UnionRepresentation
}
```
