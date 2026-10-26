import fs from "fs";
import path from "path";

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = getAllFiles("public/sections");
console.log(`Total files in public/sections: ${files.length}`);
for (const f of files) {
  console.log(f.replace("public\\sections\\", ""));
}
