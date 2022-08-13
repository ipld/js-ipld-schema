# schema-schema: `TypeDefnUnit`

TypeDefnUnit describes a type which contains no data at all (other than that fact of its existence).
(If this seems strange, consider that the cardinality of a bool type is 2;
the cardinality of a unit type is simply 1.)


```ipldsch
type TypeDefnUnit struct {
	representation UnitRepresentation
}
```
