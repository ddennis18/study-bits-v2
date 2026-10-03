import { PDFParse } from "pdf-parse";
import { extractResponseSchema } from "@/lib/api-schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let parser: PDFParse | undefined;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "A PDF file is required in the 'file' form field." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    parser = new PDFParse({ data: buffer });
    const info = await parser.getInfo();
    if (info.total > 30) {
      return Response.json({ error: "PDFs are limited to 30 pages." }, { status: 413 });
    }

    const result = await parser.getText();
    return Response.json(extractResponseSchema.parse({ text: result.text.trim(), pages: info.total }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to extract text from this PDF.";
    return Response.json({ error: message }, { status: 400 });
  } finally {
    await parser?.destroy();
  }
}
