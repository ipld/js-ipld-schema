# schema-schema: `AdvancedDataLayout`

AdvancedDataLayout defines `advanced` definitions which are stored in the
top-level "advanced" map (AdvancedDataLayoutMap)

Used as `advanced Foo` rather than `type Foo` to indicate an advanced data
layout (ADL) with that name which can be used as a representation for type
definitions whose kind the ADL is able to support.

The AdvancedDataLayoutName is currently the only identifier that can be used
to make a connection with the algorithm/logic behind this ADL. Future
iterations may formalize this connection by some other means.


```ipldsch
type AdvancedDataLayout struct {}
```
