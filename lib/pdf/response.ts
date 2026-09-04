/** Build a PDF HTTP response with inline (print) or attachment (download) disposition. */
export function pdfResponse(buffer: Buffer, filename: string, download: boolean) {
  const safe = filename.replace(/[^\w.-]+/g, "_");
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safe}"`,
      "Cache-Control": "no-store",
    },
  });
}
