const fs = require("fs")
const path = require("path")

const out = path.resolve(__dirname, "../src/generated/prisma/index.ts")

fs.writeFileSync(
  out,
  'export * from "./client"\nexport * from "./enums"\nexport * from "./models"\n'
)

console.log("✔ Created src/generated/prisma/index.ts")
