# Implicit Field Values

Testing implicit field values in map representation structs.

[testmark]:# (test/schema)
```ipldsch
type Config struct {
  version Int (implicit 1)
  enabled Bool (implicit false)
  name String
  timeout Int (implicit 30)
  debug Bool
} representation map

type ServerConfig struct {
  host String (implicit "localhost")
  port Int (implicit 8080)
  secure Bool (implicit true)
  path String
} representation map

type Defaults struct {
  stringVal String (implicit "default")
  intVal Int (implicit 42)
  boolVal Bool (implicit true)
} representation map
```

[testmark]:# (test/golang)
```go
package main

type Config struct {
	version int64
	enabled bool
	name string
	timeout int64
	debug bool
}

type ServerConfig struct {
	host string
	port int64
	secure bool
	path string
}

type Defaults struct {
	stringVal string
	intVal int64
	boolVal bool
}
```

[testmark]:# (test/rust)
```rust
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Config {
    #[serde(default = "default_config_version")]
    pub version: i64,
    #[serde(default = "default_config_enabled")]
    pub enabled: bool,
    pub name: String,
    #[serde(default = "default_config_timeout")]
    pub timeout: i64,
    pub debug: bool,
}

fn default_config_version() -> i64 {
    1
}

fn default_config_enabled() -> bool {
    false
}

fn default_config_timeout() -> i64 {
    30
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct ServerConfig {
    #[serde(default = "default_serverconfig_host")]
    pub host: String,
    #[serde(default = "default_serverconfig_port")]
    pub port: i64,
    #[serde(default = "default_serverconfig_secure")]
    pub secure: bool,
    pub path: String,
}

fn default_serverconfig_host() -> String {
    "localhost".to_string()
}

fn default_serverconfig_port() -> i64 {
    8080
}

fn default_serverconfig_secure() -> bool {
    true
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Defaults {
    #[serde(rename = "stringVal", default = "default_defaults_string_val")]
    pub string_val: String,
    #[serde(rename = "intVal", default = "default_defaults_int_val")]
    pub int_val: i64,
    #[serde(rename = "boolVal", default = "default_defaults_bool_val")]
    pub bool_val: bool,
}

fn default_defaults_string_val() -> String {
    "default".to_string()
}

fn default_defaults_int_val() -> i64 {
    42
}

fn default_defaults_bool_val() -> bool {
    true
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

export type Config = {
  version?: KindInt
  enabled?: KindBool
  name: KindString
  timeout?: KindInt
  debug: KindBool
}

export namespace Config {
  export function isConfig(value: any): value is Config {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 2 && keyCount <= 5 &&
      (!('version' in value) || (KindInt.isKindInt(value.version))) &&
      (!('enabled' in value) || (KindBool.isKindBool(value.enabled))) &&
      ('name' in value && (KindString.isKindString(value.name))) &&
      (!('timeout' in value) || (KindInt.isKindInt(value.timeout))) &&
      ('debug' in value && (KindBool.isKindBool(value.debug)))
  }
}

export type ServerConfig = {
  host?: KindString
  port?: KindInt
  secure?: KindBool
  path: KindString
}

export namespace ServerConfig {
  export function isServerConfig(value: any): value is ServerConfig {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 1 && keyCount <= 4 &&
      (!('host' in value) || (KindString.isKindString(value.host))) &&
      (!('port' in value) || (KindInt.isKindInt(value.port))) &&
      (!('secure' in value) || (KindBool.isKindBool(value.secure))) &&
      ('path' in value && (KindString.isKindString(value.path)))
  }
}

export type Defaults = {
  stringVal?: KindString
  intVal?: KindInt
  boolVal?: KindBool
}

export namespace Defaults {
  export function isDefaults(value: any): value is Defaults {
    if (!KindMap.isKindMap(value)) {
      return false
    }
    const keyCount = Object.keys(value).length
    return keyCount >= 0 && keyCount <= 3 &&
      (!('stringVal' in value) || (KindString.isKindString(value.stringVal))) &&
      (!('intVal' in value) || (KindInt.isKindInt(value.intVal))) &&
      (!('boolVal' in value) || (KindBool.isKindBool(value.boolVal)))
  }
}
```