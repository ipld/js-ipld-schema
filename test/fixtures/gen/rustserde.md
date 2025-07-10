# Test @rustserde annotation

This tests the generic @rustserde annotation that allows injecting any serde attribute into Rust field generation.

## Schema

[testmark]:# (test/schema)
```ipldsch
type SimpleWithSerde struct {
  # Normal field
  regular Int

  # Field with bigint serialization
  # @rustserde(with = "bigint_ser")
  amount Int

  # Field with custom serialization module
  # @rustserde(with = "custom::module")
  custom String

  # Field with default
  # @rustserde(default)
  with_default String

  # Field with multiple serde attributes
  # @rustserde(default)
  # @rustserde(skip_serializing_if = "String::is_empty")
  optional_string String

  # Renamed field with serde attribute
  # @rustrename(renamed_field)
  # @rustserde(with = "bigint_ser")
  originalName Int

  # Optional field with skip_serializing_if (must be at end for tuple)
  # @rustserde(skip_serializing_if = "Option::is_none")
  optional_value optional Int
} representation tuple

# Test with map representation
type MapWithSerde struct {
  # Regular camelCase field (should get automatic rename)
  camelCaseField String

  # Field with bigint_ser
  # @rustserde(with = "bigint_ser")
  balance Int

  # Optional with custom serialization
  # @rustserde(default)
  # @rustserde(with = "option_bigint_ser")
  optionalBalance optional Int
} representation map
```

## Expected Go output

[testmark]:# (test/golang)
```go
package testpkg

type SimpleWithSerde struct {
	// Normal field
	regular int64
	// Field with bigint serialization
	amount int64
	// Field with custom serialization module
	custom string
	// Field with default
	with_default string
	// Field with multiple serde attributes
	optional_string string
	// Renamed field with serde attribute
	originalName int64
	// Optional field with skip_serializing_if (must be at end for tuple)
	optional_value *int64
}

type MapWithSerde struct {
	// Regular camelCase field (should get automatic rename)
	camelCaseField string
	// Field with bigint_ser
	balance int64
	// Optional with custom serialization
	optionalBalance *int64
}
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use serde::{Deserialize, Serialize};
use serde_tuple::{Deserialize_tuple, Serialize_tuple};

#[derive(Deserialize_tuple, Serialize_tuple)]
pub struct SimpleWithSerde {
    /// Normal field
    pub regular: i64,
    /// Field with bigint serialization
    #[serde(with = "bigint_ser")]
    pub amount: i64,
    /// Field with custom serialization module
    #[serde(with = "custom::module")]
    pub custom: String,
    /// Field with default
    #[serde(default)]
    pub with_default: String,
    /// Field with multiple serde attributes
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub optional_string: String,
    /// Renamed field with serde attribute
    #[serde(with = "bigint_ser")]
    pub renamed_field: i64,
    /// Optional field with skip_serializing_if (must be at end for tuple)
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub optional_value: Option<i64>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct MapWithSerde {
    /// Regular camelCase field (should get automatic rename)
    #[serde(rename = "camelCaseField")]
    pub camel_case_field: String,
    /// Field with bigint_ser
    #[serde(with = "bigint_ser")]
    pub balance: i64,
    /// Optional with custom serialization
    #[serde(default, with = "option_bigint_ser", rename = "optionalBalance", skip_serializing_if = "Option::is_none")]
    pub optional_balance: Option<i64>,
}
```

## Expected TypeScript output

[testmark]:# (test/typescript)
```typescript
import {
  KindInt,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type SimpleWithSerde = {
  // Normal field
  regular: KindInt
  // Field with bigint serialization
  amount: KindInt
  // Field with custom serialization module
  custom: KindString
  // Field with default
  with_default: KindString
  // Field with multiple serde attributes
  optional_string: KindString
  // Renamed field with serde attribute
  originalName: KindInt
  // Optional field with skip_serializing_if (must be at end for tuple)
  optional_value?: KindInt
}

export namespace SimpleWithSerde {
  export function isSimpleWithSerde(value: any): value is SimpleWithSerde {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 6 && keyCount <= 7 &&
      ('regular' in value && (KindInt.isKindInt(value.regular))) &&
      ('amount' in value && (KindInt.isKindInt(value.amount))) &&
      ('custom' in value && (KindString.isKindString(value.custom))) &&
      ('with_default' in value && (KindString.isKindString(value.with_default))) &&
      ('optional_string' in value && (KindString.isKindString(value.optional_string))) &&
      ('originalName' in value && (KindInt.isKindInt(value.originalName))) &&
      (!('optional_value' in value) || (KindInt.isKindInt(value.optional_value)))
  }
}

export type MapWithSerde = {
  // Regular camelCase field (should get automatic rename)
  camelCaseField: KindString
  // Field with bigint_ser
  balance: KindInt
  // Optional with custom serialization
  optionalBalance?: KindInt
}

export namespace MapWithSerde {
  export function isMapWithSerde(value: any): value is MapWithSerde {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 2 && keyCount <= 3 &&
      ('camelCaseField' in value && (KindString.isKindString(value.camelCaseField))) &&
      ('balance' in value && (KindInt.isKindInt(value.balance))) &&
      (!('optionalBalance' in value) || (KindInt.isKindInt(value.optionalBalance)))
  }
}
```