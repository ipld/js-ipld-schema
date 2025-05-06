# schema-schema: `BytesRepresentation`

BytesRepresentation specifies how a TypeDefnBytes is to be serialized. By
default it will be stored as bytes in the data model but it may be replaced
with an ADL.


```ipldsch
## BytesRepresentation specifies how a TypeDefnBytes is to be serialized. By
## default it will be stored as bytes in the data model but it may be replaced
## with an ADL.
##
type BytesRepresentation union {
	| BytesRepresentation_Bytes "bytes"
	| AdvancedDataLayoutName "advanced"
} representation keyed
```
