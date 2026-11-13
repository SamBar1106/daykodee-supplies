import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogResponse, categoryOf, optionSummary, specRows, subtitleOf } from "./catalog.js";
import { formatMoney, toAmount } from "./money.js";
import { imageUrl, productImages } from "./media.js";
import { codeChallengeS256 } from "./pkce.js";

test("catalog status mapping follows the franchise API contract", () => {
  assert.deepEqual(parseCatalogResponse(401, { error: "unauthorized" }), {
    status: "unauthorized",
  });
  assert.deepEqual(parseCatalogResponse(403, { error: "forbidden" }), {
    status: "forbidden",
  });
  assert.deepEqual(parseCatalogResponse(500, { error: "server_error" }), {
    status: "error",
    reason: "server",
  });
  assert.deepEqual(parseCatalogResponse(200, { items: [{ id: "a", name: "Mats" }] }), {
    status: "ok",
    items: [{ id: "a", name: "Mats" }],
  });
  assert.equal(parseCatalogResponse(200, {}).status, "error");
});

test("money formatting guards nulls and string amounts", () => {
  assert.equal(toAmount(null), null);
  assert.equal(toAmount("129.00"), 129);
  assert.equal(formatMoney(48, "USD"), "$48.00");
  assert.equal(formatMoney(null), "—");
});

test("image helper accepts a URL string or a Wix media object", () => {
  assert.equal(imageUrl(" https://cdn.example/a.jpg "), "https://cdn.example/a.jpg");
  assert.equal(imageUrl({ url: "https://cdn.example/b.jpg" }), "https://cdn.example/b.jpg");
  assert.equal(imageUrl({ image: { src: "https://cdn.example/c.jpg" } }), "https://cdn.example/c.jpg");
  assert.equal(imageUrl(null), null);
  assert.deepEqual(
    productImages({
      mainImage: "https://cdn.example/main.jpg",
      images: ["https://cdn.example/main.jpg", { url: "https://cdn.example/2.jpg" }],
    }),
    ["https://cdn.example/main.jpg", "https://cdn.example/2.jpg"],
  );
});

test("product copy and groups stay derived from the API fields", () => {
  const item = {
    name: "Child-size rest mats, 10-pack",
    description: "10-pack heavy-duty vinyl\n\nWashable classroom mats.",
  };
  assert.equal(categoryOf(item), "Rest time");
  assert.equal(subtitleOf(item), "10-pack heavy-duty vinyl");
  assert.equal(
    optionSummary({
      sku: "DK-MAT-10",
      choices: [{ name: "Pack quantity", value: "10 mats per carton" }],
    }),
    "10 mats per carton",
  );
  assert.deepEqual(
    specRows({
      choices: [
        { name: "Size", value: "48 in" },
        "blue",
        { option: "Care", choice: "Wipe clean" },
      ],
    }),
    [
      { name: "Size", value: "48 in" },
      { name: "Care", value: "Wipe clean" },
    ],
  );
});

test("PKCE challenge is base64url SHA-256", async () => {
  const challenge = await codeChallengeS256("franchise-verifier");
  assert.equal(challenge.includes("+"), false);
  assert.equal(challenge.includes("/"), false);
  assert.equal(challenge.endsWith("="), false);
  assert.equal(challenge.length > 20, true);
});
