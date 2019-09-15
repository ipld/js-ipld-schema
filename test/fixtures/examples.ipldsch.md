# Examples

This test is to test Markdown parsing.

This is `ExampleWithNullable`, embedded in an `ipldsch` code block:

```ipldsch
type ExampleWithNullable {String : nullable &Any}
```

This is `ExampleWithNullableGo`, embedded in an `go` code block and it should not be parsed:

```go
type ExampleWithNullableGo string
```

This is `ExampleWithAnonDefns`, embedded in an `sh` code block:

```sh
type ExampleWithAnonDefns struct {
	fooField optional {String:String} (rename "foo_field")
	barField nullable {String:String}
	bazField {String : nullable String}
	wozField {String:[nullable String]}
	boomField &ExampleWithNullable
} representation map
```

This is ExampleWithNullableInline in an inline code block and it should not be parsed:

`type ExampleWithNullableInline string`
