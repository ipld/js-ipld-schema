# schema-schema: `Schema`

Schema is a single-member union, which can be used in serialization
to make a form of "nominative type declaration".

A complete (if quite short) Schema might look like this:

```
{
  "schema": {
    "MyFooType": {
      "type": "string"
    }
  }
}
```


```ipldsch
type Schema union {
	| SchemaMap "schema"
} representation keyed
```
