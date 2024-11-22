import Image from "next/image";
import { format } from "date-fns";

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  createdAt: string;
  status?: string;
}

interface OrderDetail {
  id: string;
  title: string;
  subject: string;
  assignment_type: string;
  pages: number;
}

interface PaymentReceiptProps {
  payment: Payment;
  order: OrderDetail;
}

export function PaymentReceipt({ payment, order }: PaymentReceiptProps) {
  return (
    <div className="p-8 max-w-2xl mx-auto bg-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Image
            src="/favicon.ico"
            alt="A+ Essays"
            width={40}
            height={40}
          />
          <div>
            <h2 className="font-bold text-xl">A+ Essays</h2>
            <p className="text-sm text-gray-600">info@aplusessays.com</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-primary mb-2">PAYMENT RECEIPT</h1>
          <p className="text-sm text-gray-600">Date: {format(new Date(payment.createdAt), "MMMM d, yyyy")}</p>
          <p className="text-sm text-gray-600">Time: {format(new Date(payment.createdAt), "h:mm a")}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-600">Order ID: {order.id}</p>
        <p className="text-sm text-gray-600">Payment ID: {payment.paymentId}</p>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2">{order.title}</td>
            <td className="text-right py-2">${payment.amount.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t">
            <td className="py-2 font-bold">Total</td>
            <td className="text-right py-2 font-bold">${payment.amount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="text-center text-sm text-gray-600 mt-8">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact support at info@aplusessays.com</p>
      </div>
    </div>
  );
} 