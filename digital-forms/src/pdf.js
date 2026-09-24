import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadPdf(filename = 'shriram-forms.pdf') {
  const sheets = [...document.querySelectorAll('.sheet')];
  if (!sheets.length) return;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < sheets.length; i++) {
    const canvas = await html2canvas(sheets[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: sheets[i].scrollWidth,
    });
    const img = canvas.toDataURL('image/jpeg', 0.92);
    const imgH = (canvas.height * pageW) / canvas.width;
    let remaining = imgH;
    let offset = 0;
    if (i > 0) pdf.addPage();
    while (remaining > 0) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, -offset, pageW, imgH);
      remaining -= pageH;
      offset += pageH;
    }
  }
  pdf.save(filename);
}
