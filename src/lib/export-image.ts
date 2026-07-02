import { toJpeg } from "html-to-image";

/**
 * Exporta um nó do DOM (ex.: um gráfico) como imagem JPG e dispara o download.
 */
export async function exportarNodeJpeg(
  node: HTMLElement | null,
  fileName: string
): Promise<void> {
  if (!node) return;

  const dataUrl = await toJpeg(node, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    cacheBust: true,
  });

  const link = document.createElement("a");
  link.download = fileName.endsWith(".jpg") ? fileName : `${fileName}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
