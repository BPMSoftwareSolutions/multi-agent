function requireString(body, fieldName) {
  const value = body ? body[fieldName] : undefined;
  if (typeof value !== "string" || value.trim() === "") {
    return `${fieldName} is required and must be a non-empty string`;
  }
  return null;
}

function optionalString(body, fieldName) {
  const value = body ? body[fieldName] : undefined;
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be a string when provided`;
  }

  return null;
}

module.exports = {
  requireString,
  optionalString
};
