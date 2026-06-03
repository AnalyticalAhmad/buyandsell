const nodeCrypto = require("crypto");

if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto.webcrypto;
}
