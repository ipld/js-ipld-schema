# schema-schema: `EnumRepresentation_Int`

EnumRepresentation_Int describes the way an enum is represented as an int
in the data model. A mapping of names to ints is required to perform the
conversion from int to enum value. In the DSL, int values _must_ be provided
for each EnumMember (with `Foo ("100")`, those are stored here.


```ipldsch
type EnumRepresentation_Int {EnumMember:Int}
```
