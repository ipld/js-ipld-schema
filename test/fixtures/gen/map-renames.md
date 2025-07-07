# Map Representation with Field Renames

Testing native IPLD schema field renaming in map representation.

[testmark]:# (test/schema)
```ipldsch
# Basic rename example
type Person struct {
  firstName String (rename "first_name")
  lastName String (rename "last_name")
  age Int
}

# Rename with other features
type Config struct {
  isEnabled Bool (rename "enabled")
  maxRetries Int (rename "max_retries" implicit 3)
  timeoutMs Int (rename "timeout_ms")
  debugMode optional Bool (rename "debug")
}

# All fields renamed
type ApiResponse struct {
  statusCode Int (rename "status")
  responseBody String (rename "body")
  errorMessage nullable String (rename "error")
}
```

[testmark]:# (test/golang)
```go
package main

type Person struct {
	firstName string
	lastName string
	age int64
}

type Config struct {
	isEnabled bool
	maxRetries int64
	timeoutMs int64
	debugMode *bool
}

type ApiResponse struct {
	statusCode int64
	responseBody string
	errorMessage *string
}
```

[testmark]:# (test/rust)
```rust
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Person {
    #[serde(rename = "first_name")]
    pub first_name: String,
    #[serde(rename = "last_name")]
    pub last_name: String,
    pub age: i64,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Config {
    #[serde(rename = "enabled")]
    pub is_enabled: bool,
    #[serde(rename = "max_retries", default = "default_config_max_retries")]
    pub max_retries: i64,
    #[serde(rename = "timeout_ms")]
    pub timeout_ms: i64,
    #[serde(rename = "debug", skip_serializing_if = "Option::is_none")]
    pub debug_mode: Option<bool>,
}

fn default_config_max_retries() -> i64 {
    3
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct ApiResponse {
    #[serde(rename = "status")]
    pub status_code: i64,
    #[serde(rename = "body")]
    pub response_body: String,
    #[serde(rename = "error")]
    pub error_message: Option<String>,
}
```

[testmark]:# (test/typescript)
```typescript
import {
  KindBool,
  KindInt,
  KindMap,
  KindString,
} from '@ipld/schema/schema-schema.js'

export type Person = {
  firstName: KindString
  lastName: KindString
  age: KindInt
}

export namespace Person {
  export function isPerson(value: any): value is Person {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 3 &&
      ('first_name' in value && (KindString.isKindString(value.first_name))) &&
      ('last_name' in value && (KindString.isKindString(value.last_name))) &&
      ('age' in value && (KindInt.isKindInt(value.age)))
  }
}

export type Config = {
  isEnabled: KindBool
  maxRetries?: KindInt
  timeoutMs: KindInt
  debugMode?: KindBool
}

export namespace Config {
  export function isConfig(value: any): value is Config {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 2 && keyCount <= 4 &&
      ('enabled' in value && (KindBool.isKindBool(value.enabled))) &&
      (!('max_retries' in value) || (KindInt.isKindInt(value.max_retries))) &&
      ('timeout_ms' in value && (KindInt.isKindInt(value.timeout_ms))) &&
      (!('debug' in value) || (KindBool.isKindBool(value.debug)))
  }
}

export type ApiResponse = {
  statusCode: KindInt
  responseBody: KindString
  errorMessage: KindString | null
}

export namespace ApiResponse {
  export function isApiResponse(value: any): value is ApiResponse {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount === 3 &&
      ('status' in value && (KindInt.isKindInt(value.status))) &&
      ('body' in value && (KindString.isKindString(value.body))) &&
      ('error' in value && (value.error === null || KindString.isKindString(value.error)))
  }
}
```