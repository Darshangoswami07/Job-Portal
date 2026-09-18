/**
 * Minimal, dependency-free request validation middleware.
 *
 * Pass a validator function that receives `{ body, query, params }` and returns:
 *   - `{ error: "message" }`            → responds 400
 *   - `{ body?, query? }`               → replaces `req.body` / sets `req.validatedQuery`
 *   - anything falsy / `{}`             → passes through unchanged
 *
 * Kept intentionally small; swap for zod/joi in a later phase if schema
 * complexity grows (see PLAN.md §19 "Input validation").
 */
const validate = (validator) => (req, res, next) => {
  try {
    const result = validator({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (result && result.error) {
      return res.status(400).json({ message: result.error, success: false });
    }
    if (result && result.body !== undefined) req.body = result.body;
    if (result && result.query !== undefined) req.validatedQuery = result.query;

    next();
  } catch (error) {
    console.error("validate middleware error:", error);
    return res.status(400).json({ message: "Invalid request", success: false });
  }
};

export default validate;
