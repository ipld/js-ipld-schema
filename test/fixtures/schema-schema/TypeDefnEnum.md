# schema-schema: `TypeDefnEnum`

TypeDefnEnum describes a type which has a known, pre-defined set of possible values.
Each of the member values is named by a string (of EnumMember type).

Enums can have either string or int-based representations.
Integer and string values (for int and string representations respectively)
are provided in parens in the DSL. Where the string used in serialization is
the same as the EnumMember, it may be omitted. For int representation enums,
all int values are required.


```ipldsch
type TypeDefnEnum struct {
	members [EnumMember]
	representation EnumRepresentation
}
```
