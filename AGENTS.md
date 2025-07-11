# @ipld/schema AI Assistant Guide

## Overview
JavaScript implementation of IPLD Schema parser, validator, and code generator. IPLD Schemas define types for content-addressed data (like TypeScript for immutable data structures).

## Core Functionality
1. **Parse** `.ipldsch` DSL → JavaScript AST (DMT)
2. **Validate** data against schemas at runtime
3. **Generate** Go/Rust/TypeScript code from schemas
4. **Transform** between storage and application formats

## Project Structure
```
lib/
├── from-dsl.js      # Parse DSL → AST
├── to-dsl.js        # AST → DSL
├── typed.js         # Runtime validators/transformers
├── parser.cjs       # PEG.js generated parser
└── gen/             # Code generators
    ├── go.js
    ├── rust.js
    └── typescript.js

bin/                 # CLI commands
├── validate.js      # Validate schemas
├── to-json.js       # Schema → JSON
├── to-js.js         # Generate JS validators
└── to-tsdefs.js     # Generate TS types

test/
├── fixtures/        # Test schemas and expected outputs
└── test-*.js        # Test files (mocha)
```

## Key Files
- `ipld-schema.pegjs` - PEG grammar (regenerate: `npm run peg`)
- `schema-schema.ts` - TypeScript types for schema AST
- `CHANGELOG.md` - Semantic release changelog

## Development
```bash
npm run lint:fix     # Fix code style
npm run peg          # Rebuild parser after grammar changes
npm run build        # Build TypeScript declarations
npm test             # Run full test suite
```

## Schema Language
```ipldsch
# Basic types: Bool, String, Int, Float, Bytes, Link, Any

type Person struct {
  name String
  age Int optional              # Optional field
  nickname String (implicit "")  # Default value
  userId String (rename "user_id")  # JSON field rename
}

type Status enum {
  | Active
  | Inactive
} representation string

type UserID = String  # Type alias (copy type)

# Annotations for code generation
# @gotype(big.Int)
# @rusttype(BigInt)
type Balance Int
```

## Important Patterns
1. **Type representations** - Separate logical structure from storage format (e.g., struct as tuple)
2. **Annotations** - Comments starting with `@` control code generation
3. **Copy types** - Type aliases using `=` syntax
4. **Custom transforms** - Handle wire format differences in `typed.js`

## Testing
- Add fixtures to `test/fixtures/` for parser tests
- Code generation tests use testmark format in `test/fixtures/gen/*.md`
- Run specific tests: `npm run test:node -- test/test-typed.js`

## Common Tasks
1. **Add schema feature**: Update grammar → `npm run peg` → add tests
2. **Fix code generation**: Edit `lib/gen/*.js` → add test fixtures
3. **Update types**: Edit `schema-schema.ts` → `npm run build`

## Git Workflow
- Conventional commits for semantic release (`feat:`, `fix:`, `chore:`)
- Breaking changes: use `feat!:` or `BREAKING CHANGE:` in commit body
- DO NOT perform git commits or modifications, leave that to the user, commit messages may be suggested

## Notes
- ES modules only (except parser.cjs)
- Functional style, avoid classes
- Parser errors handled in `transformError()` 
- Schema validation happens during parsing, not in typed.js