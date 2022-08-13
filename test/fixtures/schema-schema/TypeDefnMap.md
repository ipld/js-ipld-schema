# schema-schema: `TypeDefnMap`

TypeDefnMap describes a key-value map.
The keys and values of the map have some specific type of their own.

A constraint on keyType is that the referenced type must have a string
representation kind. The IPLD Data Model only allows for string keys on maps,
so this constraint is imposed here.


```ipldsch
type TypeDefnMap struct {
	keyType TypeName
	valueType TypeNameOrInlineDefn
	valueNullable Bool (implicit false)
	representation optional MapRepresentation
}
```
