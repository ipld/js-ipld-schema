# schema-schema: `TypeDefnAny`

TypeDefnAny describes a type which can contain data of any kind.
It's essentially an escape valve; it says "we don't really know what lies beyond here".
The type-level data model kind of an "any" type can be anything;
it depends on what the inhabitant value is.
The representation-level kind can similarly be anything;
it will match whatever the type-level kind is.

It is not possible to regain useful types on deeper values after using an 'any' type;
from then on, the rest of the data is locked in on having exactly that 'any' type,
and having no further ability to have separate type-level and representation-level behaviors.

'any' was introduced as a typekind after discovering it is not possible
to emulate its behavior by constructing a union; see
https://github.com/ipld/specs/issues/318 for some discussion of this.

```ipldsch
type TypeDefnAny struct {}
```
