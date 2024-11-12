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

  // Add logo - positioning modified for improved layout
  const img = new Image();
  img.src = '/images/logo.png';

  // Wait for image to load and get its dimensions
  await new Promise((resolve, reject) => {
    img.onload = () => {
      // Calculate aspect ratio and set size
      const aspectRatio = img.width / img.height;
      const desiredHeight = 20;
      const width = desiredHeight * aspectRatio;

      // Center the logo on the page
      const xPosition = (doc.internal.pageSize.width - width) / 2;
      doc.addImage(img, 'PNG', xPosition, 20, width, desiredHeight);
      resolve(null);
    };
    img.onerror = reject;
  });

  // Company details - centered alignment
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80);
  doc.text('A+ Essays', doc.internal.pageSize.width / 2, 50, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('info@aplusessays.com', doc.internal.pageSize.width / 2, 56, { align: 'center' });
  doc.text('Professional Essay Writing Services', doc.internal.pageSize.width / 2, 62, { align: 'center' });

  // Horizontal separator line
  doc.setDrawColor(200, 200, 200);
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
  doc.setFontSize(10);
  doc.setTextColor(44, 62, 80);
  doc.text('Terms & Conditions', 15, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('• The above has been served to the customer.', 20, y);
  y += 5;
  doc.text('• The company has received the customer\'s full payment.', 20, y);

  // Footer text
  y = 250;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 5;
  doc.text('For any queries, please contact support at info@aplusessays.com', doc.internal.pageSize.width / 2, y, { align: 'center' });

  // Watermark
  doc.setFontSize(60);
  doc.setTextColor(245, 245, 245);
  doc.text('A+ Essays', doc.internal.pageSize.width / 2, doc.internal.pageSize.height / 2, {
    align: 'center',
    angle: 45
  });

  return doc.output('blob');
};
