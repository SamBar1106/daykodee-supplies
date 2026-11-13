import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogResponse, categoryOf, categoriesFor, optionSummary, specRows, subtitleOf } from "./catalog.js";
import { demoCatalogItems } from "./demoCatalog.js";
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

test("API category names determine every group regardless of product keywords", () => {
  assert.deepEqual(categoryOf({
    name: "Classroom rest mat wipes",
    description: "Outdoor sidewalk chalk",
    categories: [{ id: "kitchen", name: "Kitchen & Food Service" }],
  }), ["Kitchen & Food Service"]);
  assert.deepEqual(categoryOf({
    name: "Outdoor sidewalk chalk, bucket of 50",
    categories: [
      { id: "outdoor", name: "Outdoor & Playground" },
      { id: "art", name: " Classroom & Art Supplies " },
      { id: "duplicate", name: "Outdoor & Playground" },
      { id: "nameless" },
    ],
  }), ["Outdoor & Playground", "Classroom & Art Supplies"]);
});

test("items without usable category names belong to Other", () => {
  for (const item of [
    {},
    { categories: [] },
    { categories: null },
    { categories: "Outdoor" },
    { categories: [null, {}, { name: "" }, { name: "   " }, { name: 42 }] },
  ]) {
    assert.deepEqual(categoryOf(item), ["Other"]);
  }
});

test("tabs include only present groups in first-seen order after All", () => {
  const items = [
    { categories: [{ id: "kitchen", name: "Kitchen & Food Service" }] },
    { categories: [
      { id: "outdoor", name: "Outdoor & Playground" },
      { id: "art", name: "Classroom & Art Supplies" },
    ] },
    { categories: [{ id: "kitchen-duplicate", name: "Kitchen & Food Service" }] },
  ];
  const namedTabs = ["All", "Kitchen & Food Service", "Outdoor & Playground", "Classroom & Art Supplies"];
  assert.deepEqual(categoriesFor([]), ["All"]);
  assert.deepEqual(categoriesFor(items), namedTabs);
  assert.deepEqual(categoriesFor([...items, { categories: [] }, {}]), [...namedTabs, "Other"]);
  assert.deepEqual(categoriesFor([{}, ...items]), ["All", "Other", ...namedTabs.slice(1)]);
});

test("demo items supply API categories including multiple memberships and Other", () => {
  const items = demoCatalogItems();
  assert.ok(items.every((item) => Array.isArray(item.categories)));
  assert.deepEqual(categoriesFor(items), [
    "All", "Classroom & Art Supplies", "Other", "Kitchen & Food Service", "Outdoor & Playground",
  ]);
  const chalk = items.find((item) => item.name.includes("sidewalk chalk"));
  assert.deepEqual(categoryOf(chalk), ["Outdoor & Playground", "Classroom & Art Supplies"]);
});

test("product copy stays derived from the API fields", () => {
  const item = {
    name: "Child-size rest mats, 10-pack",
    description: "10-pack heavy-duty vinyl\n\nWashable classroom mats.",
  };
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
