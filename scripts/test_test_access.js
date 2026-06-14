/**
 * Unit tests for private web test access gate (testAccessCore).
 * Run: npm run test:test-access
 */

const {
  getGateBlockReason,
  getTestAccessCode,
  getTestAccessPlatforms,
  isGateRequiredForPlatform,
  validateAccessCode,
} = require("../src/utils/testAccessCore.js");

const originalEnv = { ...process.env };

function setEnv(overrides) {
  process.env = { ...originalEnv, ...overrides };
}

function restoreEnv() {
  process.env = { ...originalEnv };
}

function assert(label, condition) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
    throw new Error(label);
  }
  console.log(`OK: ${label}`);
}

function run() {
  setEnv({
    EXPO_PUBLIC_TEST_ACCESS_CODE: "test-secret",
    EXPO_PUBLIC_TEST_ACCESS_PLATFORMS: "web",
  });

  assert("code from env", getTestAccessCode() === "test-secret");
  assert("platforms default web", getTestAccessPlatforms() === "web");
  assert("gate required on web prod", isGateRequiredForPlatform("web", false));
  assert("gate not required on android", !isGateRequiredForPlatform("android", false));
  assert("gate not required on ios", !isGateRequiredForPlatform("ios", false));
  assert("valid code passes", validateAccessCode("test-secret").ok === true);
  assert("wrong code fails", validateAccessCode("wrong").ok === false);
  assert("empty code fails", validateAccessCode("").ok === false);
  assert("no block reason when configured", getGateBlockReason(false) === null);

  setEnv({
    EXPO_PUBLIC_TEST_ACCESS_CODE: "",
    EXPO_PUBLIC_TEST_ACCESS_PLATFORMS: "web",
  });
  assert("dev without code skips gate", !isGateRequiredForPlatform("web", true));
  assert("prod without code requires gate", isGateRequiredForPlatform("web", false));
  assert("prod missing env block", getGateBlockReason(false) === "missing_env");
  assert(
    "validate without configured code",
    validateAccessCode("anything").reason === "not_configured"
  );

  setEnv({
    EXPO_PUBLIC_TEST_ACCESS_CODE: "abc",
    EXPO_PUBLIC_TEST_ACCESS_PLATFORMS: "none",
  });
  assert("platforms none disables gate", !isGateRequiredForPlatform("web", false));

  setEnv({
    EXPO_PUBLIC_TEST_ACCESS_CODE: "abc",
    EXPO_PUBLIC_TEST_ACCESS_PLATFORMS: "all",
  });
  assert("platforms all gates android", isGateRequiredForPlatform("android", false));

  restoreEnv();

  if (process.exitCode) {
    console.error("\nSome test-access checks failed.");
    process.exit(1);
  }
  console.log("\nAll test-access checks passed.");
}

run();
