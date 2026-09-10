export async function GET() {
  return Response.json({
    ok: true,
    service: "lucy",
    version: "0.1.0"
  });
}
