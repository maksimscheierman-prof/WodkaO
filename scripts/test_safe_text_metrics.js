const assert = require("assert");
const {
  safeFontSize,
  safeLineHeight,
  safeLetterSpacing,
  sanitizePlainTextStyle,
} = require("../src/utils/safeTextMetricsCore");

function ok(label, cond) {
  assert.ok(cond, label);
  console.log(`OK: ${label}`);
}

ok("zero fontSize uses fallback", safeFontSize(0) === 12);
ok("negative fontSize uses fallback", safeFontSize(-3, 14) === 14);
ok("NaN fontSize uses fallback", safeFontSize(NaN, 10) === 10);
ok("valid fontSize kept", safeFontSize(18) === 18);
ok("fractional fontSize kept", safeFontSize(11.5) === 11.5);

ok("zero lineHeight uses fallback", safeLineHeight(0) === 16);
ok("valid lineHeight kept", safeLineHeight(20) === 20);

ok("letterSpacing NaN uses fallback", safeLetterSpacing(NaN) === 0);
ok("letterSpacing zero allowed", safeLetterSpacing(0) === 0);

const sanitized = sanitizePlainTextStyle({ fontSize: 0, lineHeight: 0, letterSpacing: 1 });
ok("sanitize fixes fontSize 0", sanitized.fontSize === 12);
ok("sanitize fixes lineHeight 0", sanitized.lineHeight === 15);
ok("sanitize keeps letterSpacing", sanitized.letterSpacing === 1);

const fs = require("fs");
const path = require("path");
const cardStylesSrc = fs.readFileSync(
  path.join(__dirname, "../src/styles/CardStyles.js"),
  "utf8"
);
ok("CardStyles has no fontSize: 0", !/fontSize:\s*0\b/.test(cardStylesSrc));
ok("CardStyles typeLabel uses opacity", /typeLabel:[\s\S]*opacity:\s*0/.test(cardStylesSrc));

console.log("\nAll safe text metrics checks passed.");
