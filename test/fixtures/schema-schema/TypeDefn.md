# schema-schema: `TypeDefn`

TypeDefn is a union type, where each of the possible members describes one kind of type.
For example, TypeDefnBool is a member of the TypeDefn union, as is TypeDefnMap.

The TypeDefn union is serialized using "keyed" union representation,
which means in the serial form, we will always see a map with one key,
and that key will indicate which member type is coming up as the value.

Some of the kinds of type are so simple the union discriminant is the only
content at all, e.g. strings:

```
{
  "string": {}
}
```

Other types have more content.  Consider this example of a map type:

```
{
  "map": {
    "keyType": "String",
    "valueType": "Int"
  }
}
```


```ipldsch
type TypeDefn union {
	| TypeDefnBool "bool"
	| TypeDefnString "string"
	| TypeDefnBytes "bytes"
	| TypeDefnInt "int"
	| TypeDefnFloat "float"
	| TypeDefnMap "map"
	| TypeDefnList "list"
	| TypeDefnLink "link"
	| TypeDefnUnion "union"
	| TypeDefnStruct "struct"
	| TypeDefnEnum "enum"
	| TypeDefnUnit "unit"
	| TypeDefnAny "any"
	| TypeDefnCopy "copy"
} representation keyed
```
