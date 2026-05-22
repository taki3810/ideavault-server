import app, { ready } from "../src/index.js";

export default async function handler(req, res) {
  await ready;
  return app(req, res);
}