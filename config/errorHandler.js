export const errorHandler = (err, req, res, next) => {
  console.log("Error log:", err);
  switch (true) {
    case typeof err === "string":
      // custom application error
      const is404 = err.toLowerCase().endsWith("not found");
      const statusCode = is404 ? 404 : 400;
      return res.status(statusCode).json({ message: err });
    case typeof err === "CastError":
      return (err = handleCastError(err, res));
    case typeof err === "ValidationError":
      return (err = handleValidationError(err, res));
    case err.code && err.code == 11000:
      return (err = handleDuplicateKeyError(err, res));
    default:
      return res.status(500).json({ message: err.message });
  }
};

//handle email or username duplicates
const handleDuplicateKeyError = (err, res) => {
  const field = Object.keys(err.keyValue);
  const code = 409;
  const error = `An account with that ${field} already exists.`;
  res.status(code).send({ messages: error, fields: field });
};

//handle field formatting, empty fields, and mismatched passwords
const handleValidationError = (err, res) => {
  let errors = Object.values(err.errors).map((el) => el.message);
  let fields = Object.values(err.errors).map((el) => el.path);
  let code = 400;
  if (errors.length > 1) {
    const formattedErrors = errors.join(" ");
    res.status(code).send({ messages: formattedErrors, fields: fields });
  } else {
    res.status(code).send({ messages: errors, fields: fields });
  }
};

const handleCastError = (err, res) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  const field = Object.keys(err.keyValue);
  res.status(code).send({ messages: message, fields: field });
};
