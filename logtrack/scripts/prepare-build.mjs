import { chmod, lstat, readdir } from "node:fs/promises";
import path from "node:path";

// O OneDrive pode marcar diretórios gerados como somente leitura no Windows.
// O Next precisa conseguir substituí-los no próximo build.
async function makeBuildDirectoriesWritable(directory) {
  const info = await lstat(directory);
  if (info.isSymbolicLink() || !info.isDirectory()) return;
  await chmod(directory, info.mode | 0o200);
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isDirectory() && !item.isSymbolicLink()) {
      await makeBuildDirectoriesWritable(path.join(directory, item.name));
    }
  }
}

if (process.platform === "win32") {
  try { await makeBuildDirectoriesWritable(path.resolve(".next")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
