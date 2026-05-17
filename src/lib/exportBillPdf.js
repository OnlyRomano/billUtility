import { captureReceiptCanvas } from "./captureReceipt";

/**
 * Rasterize the receipt and save a full-page PDF (white background, no clipping).
 */
export async function exportBillPdf(element, filename) {
  if (!element) return false;

  const canvas = await captureReceiptCanvas(element);
  if (!canvas) return false;

  const { jsPDF } = await import("jspdf");

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > pageHeight) {
    imgHeight = pageHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

  pdf.save(filename);
  return true;
}
