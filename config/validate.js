export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    next();
  } catch (err) {
    if (err) {
      return res.status(400).json({
        status: "fail",
        error: err.errors,
      });
    }
    next(err);
  }
};
