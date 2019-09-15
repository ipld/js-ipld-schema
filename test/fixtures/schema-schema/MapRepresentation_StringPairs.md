# schema-schema: `MapRepresentation_StringPairs`

MapRepresentation_StringPairs describes that a map should be encoded as a
string of delimited "k/v" entries, e.g. "k1=v1,k2=v2".
The separating delimiter may be specified with "entryDelim", and the k/v
delimiter may be specified with "innerDelim". So a "k=v" naive
comma-separated form would use an "innerDelim" of "=" and an "entryDelim"
of ",".

This serial representation is limited: the domain of keys must
exclude the "innerDelim" and values and keys must exclude ",".
There is no facility for escaping, such as in escaped CSV.
This also leads to a further restriction that this representation is only
valid for maps whose keys and values may all be encoded to string form
without conflicts in delimiter character. It is recommended, therefore,
that its use be limited to maps containing values with the basic data
model kinds that exclude multiple values (i.e. no maps, lists, and therefore
structs or unions).


```ipldsch
type MapRepresentation_StringPairs struct {
	innerDelim String
	entryDelim String
}
```
