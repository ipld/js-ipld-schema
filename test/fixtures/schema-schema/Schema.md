# schema-schema: `Schema`

Schema is a the root element of an IPLD Schema document.

A complete (if quite short) Schema might look like this:

```
{
  "types": {
    "MyFooType": {
      "type": "string"
    }
  }
}
```

The main bulk of a schema is the types map,
which is TypeName mapped to TypeDefn.

Some additional top level fields are optional,
such as some maps which may store data about where ADLs
should be expected to be used within the data described by the schema.
However, not all schemas use these features.


```ipldsch
type Schema struct {
	types {TypeName:TypeDefn}
	advanced optional AdvancedDataLayoutMap
}
```
