import type { EventRecord } from "@/types/database";

export type InvitationPdfInput = {
  guestName: string;
  event: EventRecord;
  eventDate: string;
  eventTime: string;
};

async function loadImage(path: string) {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function createInvitationPdf({ guestName, event, eventDate, eventTime }: InvitationPdfInput) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 22;
  const textWidth = pageWidth - margin * 2;
  const [bearImage, balloonImage] = await Promise.all([
    loadImage("/baby-bear-cloud.png"),
    loadImage("/baby-balloon.png"),
  ]);

  function drawFrame() {
    pdf.setFillColor(250, 246, 240);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    pdf.setDrawColor(222, 199, 188);
    pdf.setLineWidth(0.55);
    pdf.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 5, 5, "S");
  }

  drawFrame();
  if (bearImage) pdf.addImage(bearImage, "PNG", pageWidth / 2 - 29, 17, 58, 58);
  if (balloonImage) pdf.addImage(balloonImage, "PNG", pageWidth - 53, 20, 29, 53);
  pdf.setTextColor(157, 117, 106);
  pdf.setFont("times", "bold");
  pdf.setFontSize(9);
  pdf.text("UNA CELEBRACIÓN LLENA DE AMOR", pageWidth / 2, 84, { align: "center" });

  let cursorY = 97;
  function addCentered(text: string, fontSize: number, font: "normal" | "bold" = "normal") {
    pdf.setFont("times", font);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(72, 57, 53);
    const lines = pdf.splitTextToSize(text, textWidth);
    pdf.text(lines, pageWidth / 2, cursorY, { align: "center" });
    cursorY += lines.length * fontSize * 0.42 + 4;
  }

  addCentered(event.name, 23, "bold");
  addCentered(`Para ${guestName}`, 18);
  addCentered("Tenemos el placer de invitarte a celebrar con nosotros este momento tan especial.", 11);

  const detailsY = cursorY + 2;
  pdf.setFillColor(243, 234, 227);
  pdf.roundedRect(margin, detailsY, textWidth, 35, 4, 4, "F");
  pdf.setTextColor(160, 120, 111);
  pdf.setFont("times", "bold");
  pdf.setFontSize(8);
  pdf.text("FECHA", margin + 9, detailsY + 10);
  pdf.text("HORA", pageWidth / 2 + 4, detailsY + 10);
  pdf.setTextColor(74, 60, 55);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.text(eventDate, margin + 9, detailsY + 23);
  pdf.text(eventTime, pageWidth / 2 + 4, detailsY + 23);
  cursorY = detailsY + 48;

  function addSection(title: string, content: string) {
    if (!content.trim()) return;
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(content, textWidth);
    const lineHeight = 5.5;
    if (cursorY + 14 > pageHeight - margin) {
      pdf.addPage();
      drawFrame();
      cursorY = 30;
    }
    pdf.setTextColor(157, 117, 106);
    pdf.setFont("times", "bold");
    pdf.setFontSize(9);
    pdf.text(title.toLocaleUpperCase("es-CO"), margin, cursorY);
    cursorY += 7;
    pdf.setTextColor(83, 68, 63);
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    for (const line of lines) {
      if (cursorY > pageHeight - margin) {
        pdf.addPage();
        drawFrame();
        cursorY = 30;
      }
      pdf.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
    cursorY += 7;
  }

  addSection("Lugar", [event.location, event.address].filter(Boolean).join(" · "));
  addSection("Una dulce espera", event.description ?? "");
  addSection("Información adicional", event.extra_info ?? "");
  addSection("Con cariño", event.parents_message ?? "");

  pdf.setProperties({
    title: `${event.name} - ${guestName}`,
    subject: "Invitación personalizada de Baby Shower",
  });
  return pdf.output("blob");
}
