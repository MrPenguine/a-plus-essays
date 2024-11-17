import jsPDF from 'jspdf';

interface ReceiptData {
  orderId: string;
  paymentId: string;
  amount: number;
  date: string;
  orderTitle: string;
  orderDetails: {
    subject: string;
    type: string;
    pages: number;
  };
}

export const generateReceipt = async (data: ReceiptData): Promise<Blob> => {
  const doc = new jsPDF();

  // Set font
  doc.setFont('helvetica');

  // Header
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80);
  doc.text('A+ Essays', 15, 20);

  // Contact info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('info@aplusessays.net', 15, 30);
  doc.text('www.aplusessays.net', 15, 35);

  // Divider line
  doc.line(15, 70, 195, 70);

  // Receipt title - aligned to the left
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text('PAYMENT RECEIPT', 15, 80);

  // Receipt details
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Date: ${data.date}`, 15, 90);
  doc.text(`Order ID: ${data.orderId}`, 15, 97);
  doc.text(`Payment ID: ${data.paymentId}`, 15, 104);

  // Order details header
  doc.setFillColor(247, 247, 247);
  doc.rect(15, 115, 180, 8, 'F');
  doc.setTextColor(44, 62, 80);
  doc.text('Description', 20, 120);
  doc.text('Amount', 160, 120);

  // Order item details
  doc.setTextColor(60, 60, 60);
  let y = 130;
  doc.text(data.orderTitle, 20, y);
  doc.text(`$${data.amount.toFixed(2)}`, 160, y);

  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Subject: ${data.orderDetails.subject}`, 20, y);
  y += 5;
  doc.text(`Type: ${data.orderDetails.type}`, 20, y);
  y += 5;
  doc.text(`Pages: ${data.orderDetails.pages}`, 20, y);

  // Total section
  y += 15;
  doc.line(15, y, 195, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(44, 62, 80);
  doc.text('Total Amount:', 130, y);
  doc.setFontSize(12);
  doc.text(`$${data.amount.toFixed(2)}`, 160, y);

  // Terms & Conditions
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 15, y);

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};
