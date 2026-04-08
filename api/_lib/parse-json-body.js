function tryParse(raw) {
  if (!raw || typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (_error) {
    return {};
  }
}

async function readStreamBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk);
  }
  if (!chunks.length) return "";
  return Buffer.concat(chunks).toString("utf8");
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    return tryParse(req.body);
  }
  if (Buffer.isBuffer(req.body)) {
    return tryParse(req.body.toString("utf8"));
  }

  const raw = await readStreamBody(req);
  return tryParse(raw);
}

module.exports = { parseJsonBody };
