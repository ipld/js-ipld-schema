# schema-schema: `StructField`

StructField describes the properties of each field declared by a TypeDefnStruct.

StructField contains properties similar to TypeDefnMap -- namely, it describes
a content type (as a TypeNameOrInlineDefn -- it supports inline definitions) -- and
has a boolean property for whether or not the value is permitted to be null.

In addition, StructField also has a property called "optional".
An "optional" field is one which is permitted to be absent entirely.
This is distinct from "nullable": a field can be optional=false and
nullable=true, in which case it's an error if the key is missing entirely,
but null is of course valid.  Conversely, if a field is optional=true and
nullable=false, it's an error if the field is present and assigned null, but
fine for a map to be missing a key of the field's name entirely and still be
recognized as this struct.
(The specific behavior of optionals may vary per StructRepresentation.)

Note that the 'optional' and 'nullable' properties are not themselves
optional... however, in the IPLD serial representation of schemas, you'll
often see them absent from the map encoding a StructField.  This is because
these fields are specified to be implicitly false.
Implicits in a map representation of a struct mean that those entries may
be missing from the map encoding... but unlike with "optional" fields, there
is no "undefined" value; absence is simply interpreted as the value specified
as the implicit.
(With implicit fields, an explicitly encoded implicit value is actually an
error instead!)  "Optional" fields give rise to N+1 cardinality logic,
just like "nullable" fields; "implicit" fields *do not*.


```ipldsch
type StructField struct {
	type TypeNameOrInlineDefn
	optional Bool (implicit false)
	nullable Bool (implicit false)
}
```
