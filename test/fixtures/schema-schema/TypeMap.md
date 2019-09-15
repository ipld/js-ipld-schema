# schema-schema: `TypeMap`

TypeMap describes a key-value map.
The keys and values of the map have some specific type of their own.


```ipldsch
type TypeMap struct {
	keyType TypeName # additionally, the referenced type must be reprkind==string.
	valueType TypeTerm
	valueNullable Bool (implicit "false")
	representation MapRepresentation
} representation map
```
