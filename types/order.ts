interface Order {
  // Basic Project Info
  id: string;
  projectTitle: string;
  assignmentType: string;  // essay, research, thesis, dissertation
  subject: string;        // English, Business, Nursing, History, etc.
  description: string;
  
  // Project Requirements
  wordCount: number;      // or pageCount (1 page ≈ 275 words)
  deadline: Date;         // from chat/payment-detail
  
  // User Info
  userId: string;
  userEmail: string;
  educationLevel: string; // High School, Undergraduate, Masters, PhD
  
  // Status & Timestamps
  status: 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  
  // Payment Info
  price: number;         // Calculated based on education level & word count
  isPaid: boolean;
  paymentId?: string;
  
  // Optional Fields
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  expertId?: string;     // If auto-match is enabled
  comments?: string;
} 