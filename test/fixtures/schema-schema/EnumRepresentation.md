# schema-schema: `EnumRepresentation`

EnumRepresentation describes how an enum type should be mapped onto
its IPLD Data Model representation. By default an enum is represented as a
string kind but it may also be represented as an int kind.


```ipldsch
type EnumRepresentation union {
	| EnumRepresentation_String "string"
	| EnumRepresentation_Int "int"
} representation keyed
```
