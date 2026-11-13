import { publicAsset } from "./paths.js";

const ids = {
  paint: "11111111-1111-4111-8111-111111111111",
  mats: "22222222-2222-4222-8222-222222222222",
  scissors: "33333333-3333-4333-8333-333333333333",
  paper: "44444444-4444-4444-8444-444444444444",
  glue: "55555555-5555-4555-8555-555555555555",
  blocks: "66666666-6666-4666-8666-666666666666",
  wipes: "77777777-7777-4777-8777-777777777777",
  cups: "88888888-8888-4888-8888-888888888888",
  chalk: "99999999-9999-4999-8999-999999999999",
};

function item(id, name, description, price, image, sku, choices) {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    description,
    currency: "USD",
    price,
    compareAtPrice: null,
    mainImage: publicAsset(image),
    images: id === ids.mats
      ? [publicAsset("demo/mats-side.svg"), publicAsset("demo/mats-room.svg")]
      : [],
    variants: [
      {
        id: `${id.slice(0, 8)}-var`,
        sku,
        price,
        choices,
        inStock: true,
      },
    ],
  };
}

export const DEMO_MEMBER = {
  loginEmail: "a.reynolds@example.com",
  profile: { nickname: "A. Reynolds" },
  contact: { firstName: "A.", lastName: "Reynolds" },
};

export function demoCatalogItems() {
  return [
    item(
      ids.paint,
      "Washable tempera paint, classroom case of 12",
      "Case of 12 bottles\n\nAssorted classroom colors in 16 oz bottles. Washable tempera for daily art centers. SAMPLE catalog item.",
      48,
      "demo/paint.svg",
      "DK-PNT-12",
      [
        { name: "Pack", value: "12-bottle case" },
        { name: "Size", value: "16 oz bottles" },
      ],
    ),
    item(
      ids.mats,
      "Child-size rest mats, 10-pack",
      "10-pack heavy-duty vinyl\n\nWashable, stackable rest mats sized for preschool classrooms. Sold as a 10-pack for Family Affair franchise centers. SAMPLE catalog item.\n\nConforms to Family Affair Early Childhood classroom rest standards.",
      129,
      "demo/mats.svg",
      "DK-MAT-10",
      [
        { name: "Size", value: '48" L × 24" W × 2" Thick (Child-size)' },
        { name: "Pack quantity", value: "10 mats per carton" },
        { name: "Material", value: "Commercial-grade heavy-duty phthalate-free vinyl and dense foam core" },
        { name: "Care", value: "Wipe clean with standard childcare-grade disinfectant sanitizers" },
      ],
    ),
    item(
      ids.scissors,
      "Soft-grip kids scissors, class set of 24",
      "Class set of 24 with caddy\n\nBlunt-tip scissors in a classroom caddy. SAMPLE catalog item.",
      36,
      "demo/scissors.svg",
      "DK-SCI-24",
      [{ name: "Pack", value: "24 with caddy" }],
    ),
    item(
      ids.paper,
      "Construction paper assortment, 500 sheets",
      "500 sheets multi-color\n\nNine-color classroom pack. SAMPLE catalog item.",
      22.5,
      "demo/paper.svg",
      "DK-PPR-500",
      [{ name: "Pack", value: "500 sheets" }],
    ),
    item(
      ids.glue,
      "Non-toxic glue sticks, 60-count",
      "60-count bulk pack\n\nWashable glue sticks for daily centers. SAMPLE catalog item.",
      19,
      "demo/glue.svg",
      "DK-GLU-60",
      [{ name: "Pack", value: "60-count" }],
    ),
    item(
      ids.blocks,
      "Hardwood unit blocks, classroom set",
      "Complete classroom set\n\nSmooth hardwood unit blocks for the block center. SAMPLE catalog item.",
      215,
      "demo/blocks.svg",
      "DK-BLK-SET",
      [{ name: "Pack", value: "Classroom set" }],
    ),
    item(
      ids.wipes,
      "Childcare disinfectant wipes, 6-canister case",
      "6-canister case (160 ct each)\n\nFragrance-controlled wipes for surfaces children touch. SAMPLE catalog item.",
      41,
      "demo/wipes.svg",
      "DK-WPE-6",
      [{ name: "Pack", value: "6 canisters" }],
    ),
    item(
      ids.cups,
      "Training cups with lids, 12-pack",
      "12-pack spill-proof\n\nWeighted training cups for the toddler room. SAMPLE catalog item.",
      28,
      "demo/cups.svg",
      "DK-CUP-12",
      [{ name: "Pack", value: "12-pack" }],
    ),
    item(
      ids.chalk,
      "Outdoor sidewalk chalk, bucket of 50",
      "Bucket of 50 jumbo sticks\n\nDust-controlled jumbo chalk for the playground. SAMPLE catalog item.",
      16,
      "demo/chalk.svg",
      "DK-CHK-50",
      [{ name: "Pack", value: "Bucket of 50" }],
    ),
  ];
}

export const DEMO_PRODUCT_IDS = ids;

export function emptyDemoCart() {
  return [
    { productId: ids.mats, quantity: 1 },
    { productId: ids.paint, quantity: 2 },
  ];
}
