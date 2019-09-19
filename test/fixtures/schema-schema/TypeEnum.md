# schema-schema: `TypeEnum`

TypeEnum describes a type which has a known, pre-defined set of possible
values. Each of the values must be representable as a string (EnumValue)
when using the default "string" representation, or when using an "int"
representation, an integer must also be supplied along with the EnumValue.

Integer and string values (for int and string representations respectively)
are provided in parens in the DSL. Where the string used in serialization is
the same as the EnumValue, it may be omitted. For int representation enums,
all int values are required.


```ipldsch
type TypeEnum struct {
  members {EnumValue:Null}
	representation EnumRepresentation
}
```
