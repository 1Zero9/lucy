import pkg from "../../../../package.json";

export async function GET() {
  return Response.json({
    ok: true,
    service: "lucy",
    version: pkg.version
  });
}
