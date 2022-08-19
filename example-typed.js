import { fromDSL } from '@ipld/schema/from-dsl.js'
import { create } from '@ipld/schema/typed.js'

// a schema for a terse data format
const schemaDsl = `
type Garden struct {
  name String
  width Int
  depth Int
  plants [Plant]
} representation tuple

type Plant struct {
  species PlantSpecies
  height Int
} representation tuple

type PlantSpecies enum {
  | Murraya     ("1")
  | StarJasmine ("2")
  | Lemon       ("3")
  | Camellia    ("4")
} representation int
`

// parse schema
const schemaDmt = fromDSL(schemaDsl)

// create a typed converter/validator
const schemaTyped = create(schemaDmt, 'Garden')

// some terse input data
const data = ['Home', 460, 200, [[1, 30], [1, 28], [1, 29], [2, 10], [2, 11], [3, 140], [4, 230], [4, 200]]]

// validate and transform
const typedData = schemaTyped.toTyped(data)

// what do we have?
console.dir(typedData)

// →
// {
//   name: 'Home',
//   width: 460,
//   depth: 200,
//   plants: [
//     { species: 'Murraya', height: 30 },
//     { species: 'Murraya', height: 28 },
//     { species: 'Murraya', height: 29 },
//     { species: 'StarJasmine', height: 10 },
//     { species: 'StarJasmine', height: 11 },
//     { species: 'Lemon', height: 140 },
//     { species: 'Camellia', height: 230 },
//     { species: 'Camellia', height: 200 }
//   ]
// }
