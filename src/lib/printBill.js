import { captureReceiptCanvas } from "./captureReceipt";

const PRINT_FRAME_ID = "utility-bill-print-frame";

function buildPrintDocument(dataUrl) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Utility bill</title>
    <style>
      @page {
        margin: 0;
        size: auto;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
      }
      img {
        display: block;
        width: 100vw;
        height: 100vh;
        object-fit: fill;
      }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="Utility bill" />
  </body>
</html>`;
}

/**
 * Print the receipt as a full-page image (matches PDF output).
 */
export async function printUtilityBill(receiptId = "utility-bill-print") {
  const element = document.getElementById(receiptId);
  if (!element) return false;

  const canvas = await captureReceiptCanvas(element);
  if (!canvas) return false;

  const dataUrl = canvas.toDataURL("image/png");

  let frame = document.getElementById(PRINT_FRAME_ID);
  frame?.remove();

  frame = document.createElement("iframe");
  frame.id = PRINT_FRAME_ID;
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:100%",
    "height:100%",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return false;
  }

  doc.open();
  doc.write(buildPrintDocument(dataUrl));
  doc.close();

  return new Promise((resolve) => {
    const cleanup = (ok) => {
      window.setTimeout(() => {
        frame.remove();
        resolve(ok);
      }, 500);
    };

    const runPrint = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        cleanup(true);
      } catch {
        cleanup(false);
      }
    };

    const img = doc.querySelector("img");
    if (!img) {
      cleanup(false);
      return;
    }

    if (img.complete) {
      runPrint();
    } else {
      img.onload = runPrint;
      img.onerror = () => cleanup(false);
    }
  });
}
