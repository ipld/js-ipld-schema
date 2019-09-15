# schema-schema: `StructRepresentation_Map`

StructRepresentation_Map describes a way to map a struct type onto a map
representation. Field serialization options may optionally be configured to
enable mapping serialized keys using the 'rename' option, or implicit values
specified where the field is omitted from the serialized form using the
'implicit' option.

See StructRepresentation_Map_FieldDetails for details on the 'rename' and
'implicit' options.


```ipldsch
type StructRepresentation_Map struct {
	fields optional {FieldName:StructRepresentation_Map_FieldDetails}
}
```
