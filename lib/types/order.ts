export interface OrderDetails {
  id: string;
  title: string;
  subject: string;
  level: string;
  pages: number;
  deadline: string;
  assignment_type: string;
  description?: string;
  price: number;
  amount_paid: number;
  discountAmount?: number;
  tutorid?: string;
  tutorId?: string;
  paymentStatus?: string;
  status: 'new' | 'in_progress' | 'completed' | 'pending' | 'paid' | 'cancelled' | 'partial' | 'tutor_assigned';
}

export interface PaymentData {
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  discountAmount?: number;
  discountType?: 'referrer' | 'referred';
} 