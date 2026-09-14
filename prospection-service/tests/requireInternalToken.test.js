"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.INTERNAL_SERVICE_TOKEN = "test-secret-token";
const requireInternalToken = require("../src/middleware/requireInternalToken");

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("rejects request with no X-Internal-Token header", () => {
  const req = { headers: {} };
  const res = mockRes();
  let nextCalled = false;

  requireInternalToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "unauthorized");
});

test("rejects request with wrong X-Internal-Token", () => {
  const req = { headers: { "x-internal-token": "wrong-value" } };
  const res = mockRes();
  let nextCalled = false;

  requireInternalToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("accepts request with correct X-Internal-Token and calls next()", () => {
  const req = { headers: { "x-internal-token": "test-secret-token" } };
  const res = mockRes();
  let nextCalled = false;

  requireInternalToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});
