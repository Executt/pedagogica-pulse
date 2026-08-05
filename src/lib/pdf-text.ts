/** Extração de texto de PDF no navegador (pdf.js). Só roda client-side. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Reagrupa os itens por linha usando a coordenada Y do transform.
    const rows = new Map<number, { x: number; text: string }[]>();
    content.items.forEach((item) => {
      const it = item as { str?: string; transform?: number[] };
      if (!it.str || !it.transform) return;
      const y = Math.round(it.transform[5]);
      rows.set(y, [...(rows.get(y) ?? []), { x: it.transform[4], text: it.str }]);
    });
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) =>
        parts.sort((a, b) => a.x - b.x).map((p) => p.text).join(" ").replace(/\s+/g, " ").trim(),
      )
      .filter(Boolean);
    pages.push(lines.join("\n"));
  }

  return pages.join("\n");
}