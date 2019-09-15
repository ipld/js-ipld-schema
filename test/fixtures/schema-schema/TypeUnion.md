# schema-schema: `TypeUnion`

TypeUnion describes a union (sometimes called a "sum type", or
more verbosely, a "discriminated union").
A union is a type that can have a value of several different types, but
unlike maps or structs, in a union only one of those values may be present
at a time.

Unions can be defined as representing in several different ways: see
the documentation on the UnionRepresentation type for details.

The set of types which the union can contain are specified in a map
inside the representation field.  (The key type of the map varies per
representation strategy, so it's not possible to keep on this type directly.)


```ipldsch
type TypeUnion struct {
	representation UnionRepresentation
}
```
