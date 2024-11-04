import { db } from "./config";
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from "firebase/firestore";

export interface UserData {
  email: string;
  name: string;
  userid: string;
  balance: number;
  createdAt: string;
  isAnonymous: boolean;
}

export interface ProjectData {
  assignmentType: string;
  projectTitle: string;
  userEmail: string;
  userId: string;
  createdAt: string;
  status: string;
}

export interface Order {
  assignment_type: string;
  deadline: string;
  description: string;
  file_links: string[];
  level: string;
  orderid: string;
  pages: number;
  price: number;
  subject: string;
  title: string;
  userid: string;
  wordcount: number;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  paymentType?: string | null;
  paymentId?: string | null;
  paymentReference?: string;
  paymentStatus?: string;
}

const PRICE_PER_PAGE = {
  'High School': 8,
  'Undergraduate': 10,
  'Masters': 14,
  'PhD': 15
};

interface PaymentData {
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
}

interface OrderUpdate {
  status: string;
  paymentReference?: string;
  paymentStatus?: string;
}

export const dbService = {
  // Check if user exists
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking user existence:", error);
      throw error;
    }
  },

  // Create new user
  async createUser(userData: UserData): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userData.userid), {
        ...userData,
        email: userData.email.toLowerCase(),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Create new project
  async createProject(projectData: ProjectData): Promise<void> {
    try {
      const projectRef = doc(collection(db, 'projects'));
      await setDoc(projectRef, {
        ...projectData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async createOrder(orderData: Partial<Order>): Promise<string> {
    try {
      const ordersRef = collection(db, 'orders');
      const orderDoc = doc(ordersRef);
      const orderId = orderDoc.id;

      // Calculate price based on education level and pages
      const pricePerPage = PRICE_PER_PAGE[orderData.level as keyof typeof PRICE_PER_PAGE] || 10;
      const totalPrice = (orderData.pages || 1) * pricePerPage;

      // Set the document data with status and payment fields
      await setDoc(orderDoc, {
        ...orderData,
        orderid: orderId,
        price: totalPrice,
        status: 'pending',
        paymentType: null,
        paymentId: null,
        createdAt: new Date().toISOString()
      });

      return orderId;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async createPayment(paymentData: PaymentData): Promise<void> {
    try {
      const paymentRef = doc(collection(db, 'payments'));
      await setDoc(paymentRef, {
        ...paymentData,
        createdAt: new Date().toISOString(),
        status: 'completed'
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  },

  async updateOrder(orderId: string, updateData: {
    status?: string;
    paymentReference?: string;
    paymentStatus?: string;
    paymentId?: string;
    paymentType?: string;
  }): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  async getUserOrders(userId: string) {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userid', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString(),
        deadline: doc.data().deadline || new Date().toISOString()
      }));

      return orders;
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error;
    }
  },

  async getOrder(orderId: string) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      return {
        id: orderSnap.id,
        ...orderSnap.data()
      };
    } catch (error) {
      console.error("Error getting order:", error);
      throw error;
    }
  }
}; 