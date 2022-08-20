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

console.log('Original representation data:', JSON.stringify(data))

// validate and transform
const typedData = schemaTyped.toTyped(data)
if (typedData === undefined) {
  throw new TypeError('Invalid data form, does not match schema')
}

// what do we have?
console.log('Typed form:', typedData)

// →
// Typed form: {
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

// modify our typed form now we have it in a form that makes sense to our application

typedData.depth += 50
typedData.plants[0].height += 2
typedData.plants[1].height += 2
typedData.plants[2].height += 1
typedData.plants.push({ species: 'StarJasmine', height: 5 })

// validate and transform back into representation form
const newData = schemaTyped.toRepresentation(typedData)
if (newData === undefined) {
  throw new TypeError('Invalid data form, does not match schema')
}

// what do we have?
console.log('Modified representation data:', JSON.stringify(newData))

// →
// ["Home",460,250,[[1,32],[1,30],[1,30],[2,10],[2,11],[3,140],[4,230],[4,200],[2,5]]]
