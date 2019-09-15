# schema-schema: `SchemaMap`

SchemaMap is a complete set of types;
it is simply a map of TypeName to detailed declaration of that Type.

A simple schema map with one type might look like this:

```
{
  "MyFooType": {
    "type": "string"
  }
}
```


```ipldsch
type SchemaMap {TypeName:Type}
```
