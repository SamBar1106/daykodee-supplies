import assert from "node:assert/strict";
import test from "node:test";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { sanitizeDescription } from "./description.js";
import { bodyOf, subtitleOf } from "./catalog.js";

const window = new JSDOM("").window;
const purifier = createDOMPurify(window);

function render(text) {
  const container = window.document.createElement("div");
  container.innerHTML = sanitizeDescription(text, purifier);
  return container;
}

test("HTML descriptions render text and typography instead of visible tags", () => {
  const item = { description: "<p>TEST ITEM - not for sale</p>" };
  for (const copy of [subtitleOf(item), bodyOf(item)]) {
    const rendered = render(copy);
    assert.equal(rendered.textContent, "TEST ITEM - not for sale");
    assert.equal(rendered.querySelector("p").textContent, "TEST ITEM - not for sale");
  }
  const safe = '<p><strong>Bold</strong> <em>Emphasis</em><br><b>B</b><i>I</i></p><ul><li>One</li></ul><ol><li>Two</li></ol><a href="https://example.com/">Details</a>';
  assert.equal(render(safe).innerHTML, safe);
});

test("multiline markup remains complete in card previews and product bodies", () => {
  const item = { description: "<p>Intro</p>\n<ul>\n<li>Details</li>\n</ul>" };
  for (const copy of [subtitleOf(item), bodyOf(item)]) {
    const rendered = render(copy);
    assert.equal(rendered.querySelector("p").textContent, "Intro");
    assert.equal(rendered.querySelector("li").textContent, "Details");
  }
});

test("scripts, event handlers, styles, and non-typography elements are removed", () => {
  const rendered = render('<p onclick="alert(1)" style="color:red" data-x="x">Safe</p><script>alert(1)</script><img src="x" onerror="alert(1)"><iframe src="https://example.com"></iframe><svg onload="alert(1)"></svg>');
  assert.equal(rendered.innerHTML, "<p>Safe</p>");
});

test("unsafe URLs are removed while safe and relative links remain", () => {
  const rendered = render('<a href="javascript:alert(1)">Bad</a><a href="jav&#x61;script:alert(1)">Encoded</a><a href="data:text/html,bad">Data</a><a href="/products">Relative</a><a href="mailto:info@example.com">Email</a>');
  const links = [...rendered.querySelectorAll("a")];
  assert.deepEqual(links.map((link) => link.getAttribute("href")), [null, null, null, "/products", "mailto:info@example.com"]);
});

test("plain-text descriptions keep subtitle, body, newlines, and literal characters", () => {
  const item = { description: "10-pack heavy-duty vinyl\n\nWashable classroom mats.\nUse < 5 & store dry." };
  assert.equal(render(subtitleOf(item)).textContent, "10-pack heavy-duty vinyl");
  assert.equal(render(bodyOf(item)).textContent, "Washable classroom mats.\nUse < 5 & store dry.");
  assert.equal(render("Single line").textContent, "Single line");
  assert.equal(render(null).textContent, "");
});
