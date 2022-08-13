# schema-schema: `TypeDefnLink`

TypeDefnLink describes an IPLD link, which is a content-addressable pointer to more data.
(Links in IPLD are implemented by CIDs: they're a hash that identifies another another block of data,
plus a codec hint for how to parse it into IPLD Data Model).

A typed link can optionally state an "expectedType".
This provides a mechanism for suggesting what we should expect find
if we were to follow the link.
(Note that this cannot be strictly enforced by a node or block-level schema validation!
But may be enforced elsewhere in an application using a schema, and
is generally enforced as soon as possible when traversing typed links.)

In the Schema DSL, links are specified with the `&FooBar` syntax --
The ampersand character denotes a link, and the rest of the declaration
is the name of the expected type for the linked content.

If you want the equivalent of untyped links, in the DSL, you can say `&Any`.
This is also available in the Prelude, and that type is simply name "Link"
(in other words, the Prelude contains `type Link &Any`).


```ipldsch
type TypeDefnLink struct {
	expectedType TypeName (implicit "Any")
}
```
