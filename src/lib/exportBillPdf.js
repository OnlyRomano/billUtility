import { RECEIPT_WIDTH_PX } from "../components/UtilityBillReceipt";

function stripCloneStylesheets(clonedDoc) {
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());
  clonedDoc.querySelectorAll("style").forEach((el) => el.remove());
  const html = clonedDoc.documentElement;
  const body = clonedDoc.body;
  if (html) {
    html.removeAttribute("class");
    html.style.backgroundColor = "#ffffff";
    html.style.color = "#000000";
  }
  if (body) {
    body.removeAttribute("class");
    body.style.backgroundColor = "#ffffff";
    body.style.margin = "0";
    body.style.padding = "12px";
    body.style.display = "flex";
    body.style.justifyContent = "center";
  }
}

/**
 * Rasterize the receipt element (inline-styled preview) and save a centered A4 PDF.
 */
export async function exportBillPdf(element, filename) {
  if (!element) return false;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  element.scrollIntoView({ block: "nearest", inline: "nearest" });

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: RECEIPT_WIDTH_PX,
    windowWidth: RECEIPT_WIDTH_PX,
    onclone: (clonedDoc) => {
      stripCloneStylesheets(clonedDoc);
    },
  });

  if (!canvas.width || !canvas.height) {
    return false;
  }

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let imgWidth = maxWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  const y = margin;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.save(filename);
  return true;
}
