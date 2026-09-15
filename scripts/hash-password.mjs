#!/usr/bin/env node
// Generates an ADMIN_PASSWORD_HASH value. Usage: npm run hash-password
// The password is read from a hidden prompt (or stdin when piped) so it never lands in shell history.
import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout } from "node:process";

const N = 32768;
const r = 8;
const p = 1;

function readHidden(prompt) {
  return new Promise((resolve) => {
    if (!stdin.isTTY) {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => (data += chunk));
      stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")));
      return;
    }
    stdout.write(prompt);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (char) => {
      if (char === "\r" || char === "\n" || char === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (char === "") {
        stdout.write("\n");
        process.exit(130);
      } else if (char === "" || char === "\b") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

const password = (await readHidden("Senha do admin: ")).normalize("NFKC");
if (password.length < 12) {
  console.error("Use uma senha com pelo menos 12 caracteres.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32, { N, r, p, maxmem: 256 * N * r });
console.log(`\nADMIN_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${hash.toString("base64url")}`);
