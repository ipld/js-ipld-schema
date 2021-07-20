# schema-schema: `TypeList`

TypeList describes a list.
The values of the list have some specific type of their own.


```ipldsch
type TypeList struct {
	valueType TypeTerm
	valueNullable Bool (implicit "false")
	representation ListRepresentation
}
```
