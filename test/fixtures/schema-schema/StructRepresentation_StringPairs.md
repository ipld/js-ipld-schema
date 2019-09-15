# schema-schema: `StructRepresentation_StringPairs`

StructRepresentation_StringPairs describes that a struct should be encoded
as a string of delimited "k/v" entries, e.g. "k1=v1,k2=v2".
The separating delimiter may be specified with "entryDelim", and the k/v
delimiter may be specified with "innerDelim". So a "k=v" naive
comma-separated form would use an "innerDelim" of "=" and an "entryDelim"
of ",".

Serialization a struct with stringpairs works the same way as serializing
a map with stringpairs and the same character limitations exist. See
MapRepresentation_StringPairs for more details on these limitations.


```ipldsch
type StructRepresentation_StringPairs struct {
	innerDelim String
	entryDelim String
}
```
