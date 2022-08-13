# schema-schema: `EnumRepresentation_String`

EnumRepresentation_String describes the way an enum is represented as a
string in the data model. By default, the strings used as EnumMember will be
used at the serialization. A custom string may be provided (with `Foo ("x")`
in the DSL) which will be stored here in the representation block. Missing
entries in this map will use the default.


```ipldsch
type EnumRepresentation_String {EnumMember:String}
```
