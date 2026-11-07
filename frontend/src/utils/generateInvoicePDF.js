import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

export const generateInvoicePDF = (invoice) => {
  if (!invoice) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [37, 99, 235]; // brand-600
  const darkTextColor = [30, 41, 59];
  const mutedTextColor = [100, 116, 139];

  // Header banner / Logo
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 15, 'F');

  // Company Brand
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('SKYBRISK ERP', 15, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Enterprise Operations & Resource Suite', 15, 35);
  doc.text('100 Silicon Highway, Suite 400', 15, 40);
  doc.text('San Francisco, CA 94107 | billing@skybrisk.com', 15, 45);

  // Invoice Title & Badges
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('INVOICE', 195, 30, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 195, 37, { align: 'right' });
  doc.text(`Issue Date: ${formatDate(invoice.issuedDate || invoice.createdAt)}`, 195, 43, { align: 'right' });
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 195, 49, { align: 'right' });

  // Status Badge
  const statusColor = invoice.status === 'Paid' ? [22, 163, 74] : (invoice.status === 'Overdue' ? [220, 38, 38] : [202, 138, 4]);
  doc.setFillColor(...statusColor);
  doc.roundedRect(165, 53, 30, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.status.toUpperCase(), 180, 57.5, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 63, 195, 63);

  // Bill To Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedTextColor);
  doc.text('BILLED TO:', 15, 72);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  const custName = invoice.customer?.name || 'Valued Customer';
  const custCompany = invoice.customer?.company || '';
  const custEmail = invoice.customer?.email || '';
  const custPhone = invoice.customer?.phone || '';

  doc.text(custName, 15, 78);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  let yPos = 83;
  if (custCompany) {
    doc.text(custCompany, 15, yPos);
    yPos += 5;
  }
  if (custEmail) {
    doc.text(`Email: ${custEmail}`, 15, yPos);
    yPos += 5;
  }
  if (custPhone) {
    doc.text(`Phone: ${custPhone}`, 15, yPos);
    yPos += 5;
  }

  // Items Table
  const tableData = (invoice.items || []).map((item, idx) => [
    idx + 1,
    item.title || item.product?.title || 'Product Item',
    item.SKU || item.product?.SKU || '-',
    item.quantity,
    formatCurrency(item.unitPrice),
    formatCurrency(item.subtotal || item.quantity * item.unitPrice),
  ]);

  autoTable(doc, {
    startY: yPos + 6,
    head: [['#', 'Description', 'SKU', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      textColor: darkTextColor,
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Financial Summary Box
  const summaryX = 120;
  doc.setFontSize(9);
  doc.setTextColor(...darkTextColor);

  doc.text('Subtotal:', summaryX, finalY);
  doc.text(formatCurrency(invoice.subtotal), 195, finalY, { align: 'right' });

  doc.text(`Tax (${invoice.taxRate || 8}%):`, summaryX, finalY + 6);
  doc.text(formatCurrency(invoice.taxAmount), 195, finalY + 6, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text('Discount:', summaryX, finalY + 12);
    doc.text(`-${formatCurrency(invoice.discount)}`, 195, finalY + 12, { align: 'right' });
  }

  const totalY = invoice.discount > 0 ? finalY + 18 : finalY + 12;

  // Total Bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryX - 5, totalY - 4, 80, 10, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL AMOUNT:', summaryX, totalY + 3);
  doc.text(formatCurrency(invoice.totalAmount), 195, totalY + 3, { align: 'right' });

  // Notes & Payment Instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('Payment Terms & Instructions:', 15, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text('Wire Transfer: Chase Bank NA', 15, finalY + 5);
  doc.text('Account Number: 8849-2910-3841-9920', 15, finalY + 9);
  doc.text('Routing Number: 121000358 | SWIFT: CHASUS33', 15, finalY + 13);
  doc.text(invoice.notes || 'Payment is appreciated within terms.', 15, finalY + 18);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated electronically by SkyBrisk ERP. Valid without physical signature.', 105, 285, { align: 'center' });

  // Save the PDF
  doc.save(`${invoice.invoiceNumber || 'Invoice'}.pdf`);
};

