# schema-schema: `TypeCopy`

TypeCopy describes a special "copy" unit that indicates that a type name
should copy the type descriptor of another type. TypeCopy does not redirect a
name to another type. Instead, it copies the entire type definition and
assigns it to another type.

The DSL defines a TypeCopy as `type NewThing = CopiedThing`, where
"CopiedThing" refers to a `type` defined elsewhere in a schema and is not
one of TypeKind or an inline type descriptor (`{}`, `[]`, `&`).


```ipldsch
type TypeCopy struct {
	fromType TypeName
}
```
