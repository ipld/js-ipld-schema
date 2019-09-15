# schema-schema: `StructRepresentation_Map_FieldDetails`

StructRepresentation_Map_FieldDetails describes additional properties of a
struct field when represented as a map.  For example, fields may be renamed,
or implicit values associated.

If an implicit value is defined, then during marshalling, if the actual value
is the implicit value, that field will be omitted from the map; and during
unmarshalling, correspondingly, the absence of that field will be interpreted
as being the implicit value.

Note that fields with implicits are distinct from fields which are optional!
The cardinality of membership of an optional field is is incremented:
e.g., the cardinality of "fieldname Bool" is 2; "fieldname optional Bool" is
membership cardinality *3*, because it may also be undefined.
By contrast, the cardinality of membership of a field with an implicit value
remains unchanged; there is serial state which can map to an undefined value.

Note that 'rename' supports exactly one string, and not a list: this is
intentional.  The rename feature is meant to allow serial representations
to use a different key string than the schema type definition field name;
it is not intended to be used for migration purposes.


```ipldsch
type StructRepresentation_Map_FieldDetails struct {
	rename optional String
	implicit optional AnyScalar
}
```
