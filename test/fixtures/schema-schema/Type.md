# schema-schema: `Type`

The types of Type are a union.

The Type union is serialized using "inline" union representation,
which means all of its members have map representations, and there will be
an entry in that map called "type" which contains the union discriminant.

Some of the kinds of type are so simple the union discriminant is the only
content at all, e.g. strings:

```
{
  "type": "string"
}
```

Other types have more content.  Consider this example of a map type:

```
{
  "type": "map",
  "keyType": "String",
  "valueType": "Int"
}
```


```ipldsch
type Type union {
	| TypeBool "bool"
	| TypeString "string"
	| TypeBytes "bytes"
	| TypeInt "int"
	| TypeFloat "float"
	| TypeMap "map"
	| TypeList "list"
	| TypeLink "link"
	| TypeUnion "union"
	| TypeStruct "struct"
	| TypeEnum "enum"
	| TypeCopy "copy"
} representation inline {
	discriminantKey "kind"
}
```
