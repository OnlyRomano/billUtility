import { RECEIPT_WIDTH_PX } from "../components/UtilityBillReceipt";

function prepareReceiptClone(clone) {
  clone.style.width = `${RECEIPT_WIDTH_PX}px`;
  clone.style.maxWidth = `${RECEIPT_WIDTH_PX}px`;
  clone.style.minWidth = `${RECEIPT_WIDTH_PX}px`;
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.display = "block";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#000000";
}

async function renderToCanvas(html2canvas, target) {
  return html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
  });
}

function isValidCanvas(canvas) {
  return canvas && canvas.width > 0 && canvas.height > 0;
}

/**
 * Rasterize the receipt at a fixed 400px width (matches on-screen preview).
 */
export async function captureReceiptCanvas(element) {
  if (!element) return null;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const { default: html2canvas } = await import("html2canvas");

  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  let canvas = await renderToCanvas(html2canvas, element);
  if (isValidCanvas(canvas)) {
    return canvas;
  }

  const exportHost = document.createElement("div");
  exportHost.setAttribute("aria-hidden", "true");
  exportHost.style.cssText = [
    "position:fixed",
    `left:-${RECEIPT_WIDTH_PX + 48}px`,
    "top:0",
    `width:${RECEIPT_WIDTH_PX}px`,
    "opacity:1",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const clone = element.cloneNode(true);
  prepareReceiptClone(clone);
  exportHost.appendChild(clone);
  document.body.appendChild(exportHost);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    canvas = await renderToCanvas(html2canvas, clone);
    return isValidCanvas(canvas) ? canvas : null;
  } finally {
    exportHost.remove();
  }
}
