# Kinded Union Type Code Generation Tests

This file tests kinded union type code generation for Go, Rust, and TypeScript.

## Schema

[testmark]:# (test/schema)
```ipldsch
# Basic kinded union with different IPLD kinds
type MixedData union {
  | Bool bool
  | Int int
  | String string
  | Bytes bytes
  | EmptyList list
} representation kinded

type EmptyList [String]

# Union used in a struct
type DataContainer struct {
  id String
  value MixedData
}

# Complex kinded union including struct and list
type ConfigValue union {
  | SimpleConfig map
  | ListConfig list
  | String string
} representation kinded

type SimpleConfig struct {
  key String
  value String
}

type ListConfig [String]

# Nested scenario with nullable
type Settings struct {
  name String
  config nullable ConfigValue
}
```

## Expected Go output

[testmark]:# (test/golang)
```go
package main

type MixedData interface {
	mixedData()
}

type MixedData_Bool bool
func (MixedData_Bool) mixedData() {}

type MixedData_Int int64
func (MixedData_Int) mixedData() {}

type MixedData_String string
func (MixedData_String) mixedData() {}

type MixedData_Bytes []byte
func (MixedData_Bytes) mixedData() {}

type MixedData_EmptyList EmptyList
func (MixedData_EmptyList) mixedData() {}

type EmptyList []string

type DataContainer struct {
	id string
	value MixedData
}

type ConfigValue interface {
	configValue()
}

type ConfigValue_SimpleConfig SimpleConfig
func (ConfigValue_SimpleConfig) configValue() {}

type ConfigValue_ListConfig ListConfig
func (ConfigValue_ListConfig) configValue() {}

type ConfigValue_String string
func (ConfigValue_String) configValue() {}

type SimpleConfig struct {
	key string
	value string
}

type ListConfig []string

type Settings struct {
	name string
	config *ConfigValue
}
```

## Expected Rust output

[testmark]:# (test/rust)
```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(untagged)]
pub enum MixedData {
    Bool(bool),
    Int(i64),
    String(String),
    Bytes(Vec<u8>),
    EmptyList(EmptyList),
}

pub type EmptyList = Vec<String>;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct DataContainer {
    pub id: String,
    pub value: MixedData,
}

#[derive(Deserialize, Serialize)]
#[serde(untagged)]
pub enum ConfigValue {
    SimpleConfig(SimpleConfig),
    ListConfig(ListConfig),
    String(String),
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct SimpleConfig {
    pub key: String,
    pub value: String,
}

pub type ListConfig = Vec<String>;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Settings {
    pub name: String,
    pub config: Option<ConfigValue>,
}
```

## Expected TypeScript output

[testmark]:# (test/typescript)
```typescript
import {
  KindBool,
  KindBytes,
  KindInt,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type MixedData = KindBool | KindInt | KindString | KindBytes | EmptyList

export namespace MixedData {
  export function isMixedData(value: any): value is MixedData {
    return KindBool.isKindBool(value) || KindInt.isKindInt(value) || KindString.isKindString(value) || KindBytes.isKindBytes(value) || EmptyList.isEmptyList(value)
  }
}

export type EmptyList = KindString[]

export namespace EmptyList {
  export function isEmptyList(value: any): value is EmptyList {
    return Array.isArray(value) && value.every(KindString.isKindString)
  }
}

export type DataContainer = {
  id: KindString
  value: MixedData
}

export namespace DataContainer {
  export function isDataContainer(value: any): value is DataContainer {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('id' in value && (KindString.isKindString(value.id))) &&
      ('value' in value && (MixedData.isMixedData(value.value)))
  }
}

export type ConfigValue = SimpleConfig | ListConfig | KindString

export namespace ConfigValue {
  export function isConfigValue(value: any): value is ConfigValue {
    return SimpleConfig.isSimpleConfig(value) || ListConfig.isListConfig(value) || KindString.isKindString(value)
  }
}

export type SimpleConfig = {
  key: KindString
  value: KindString
}

export namespace SimpleConfig {
  export function isSimpleConfig(value: any): value is SimpleConfig {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('key' in value && (KindString.isKindString(value.key))) &&
      ('value' in value && (KindString.isKindString(value.value)))
  }
}

export type ListConfig = KindString[]

export namespace ListConfig {
  export function isListConfig(value: any): value is ListConfig {
    return Array.isArray(value) && value.every(KindString.isKindString)
  }
}

export type Settings = {
  name: KindString
  config: ConfigValue | null
}

export namespace Settings {
  export function isSettings(value: any): value is Settings {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 2 &&
      ('name' in value && (KindString.isKindString(value.name))) &&
      ('config' in value && (value.config === null || ConfigValue.isConfigValue(value.config)))
  }
}
```