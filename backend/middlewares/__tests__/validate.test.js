import { describe, it, expect, vi } from "vitest";
import validate from "../validate.js";

const mockRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

describe("validate middleware", () => {
  it("responds 400 when the validator returns an error", () => {
    const req = { body: {}, query: {}, params: {} };
    const res = mockRes();
    const next = vi.fn();

    validate(() => ({ error: "bad input" }))(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "bad input", success: false });
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through and replaces body when the validator returns a body", () => {
    const req = { body: { a: "1" }, query: {}, params: {} };
    const res = mockRes();
    const next = vi.fn();

    validate(({ body }) => ({ body: { ...body, a: Number(body.a) } }))(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ a: 1 });
  });

  it("sets req.validatedQuery when the validator returns a query", () => {
    const req = { body: {}, query: { page: "2" }, params: {} };
    const res = mockRes();
    const next = vi.fn();

    validate(() => ({ query: { page: 2 } }))(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.validatedQuery).toEqual({ page: 2 });
  });

  it("responds 400 when the validator throws", () => {
    const req = { body: {}, query: {}, params: {} };
    const res = mockRes();
    const next = vi.fn();

    validate(() => {
      throw new Error("boom");
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
