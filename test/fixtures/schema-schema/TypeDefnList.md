# schema-schema: `TypeDefnList`

TypeDefnList describes a list.
The values of the list have some specific type of their own.


```ipldsch
type TypeDefnList struct {
	valueType TypeNameOrInlineDefn
	valueNullable Bool (implicit false)
	representation optional ListRepresentation
}
```
