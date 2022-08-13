# schema-schema: `UnitRepresentation`

UnitRepresentation is an enum for describing how a TypeDefnUnit should be represented in the data model.

Unit types are commonly seen represented in several ways.
A null token is a common one.
A true token is sometimes seen (especially, when people encode "sets" in json:
often this will be seen as a map where the values are keys and the map values are 'true').
Also, an empty map can be a useful unit value;
an empty map accurately communicates a lack of data.
(The emptymap strategy can be a particularly interesting choice if you want to
have a schema that is evolvable in the future to start using a struct or map
in the same place as the unit type currently stands, while having older documents
continue to be parsable by the evolved schema.)

Unlike many of the other representation information types seen in the schema-schema,
this one is just an enum, rather than being a union.
That's because there's no possibility of every needing to annotate more customization
onto values in the unit type... because there are no possible values in the unit type.

Note that there is no discernible logical difference between
`type Foo struct {}` and `type Foo unit representation emptymap`;
only that the latter can be said to be a more explicit description of intent.
Both will result in identical representations, and both have identical cardinality (which is 1).


```ipldsch
type UnitRepresentation enum {
	| Null ("null")
	| True ("true")
	| False ("false")
	| Emptymap ("emptymap")
}
```
