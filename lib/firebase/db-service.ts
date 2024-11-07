import { db } from "./config";
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc, orderBy } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export interface UserData {
  email: string;
  name: string;
  userid: string;
  balance: number;
  createdAt: string;
  isAnonymous: boolean;
  referralCode?: string;
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

interface ReferralStats {
  totalReferred: number;
  pendingRedemptions: number;
  redeemedCount: number;
}

interface ReferralData {
  referralId: string;
  referralCode: string;
  referrer_uid: string;
  referred_uid?: string;
  referred_redeemed: boolean;
  referrer_redeemed: boolean;
  createdAt: string;
  updatedAt?: string;
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
      console.log("Fetching orders for user:", userId); // Debug log
      
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('userid', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log("Found orders:", querySnapshot.size); // Debug log
      
      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Order data:", data); // Debug log
        return {
          id: doc.id,
          userid: data.userid,
          title: data.title,
          status: data.status,
          deadline: data.deadline,
          subject: data.subject,
          assignment_type: data.assignment_type,
          price: data.price,
          description: data.description,
          level: data.level,
          pages: data.pages,
          wordcount: data.wordcount,
          file_links: data.file_links || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          paymentStatus: data.paymentStatus,
          paymentReference: data.paymentReference,
        };
      });

      console.log("Processed orders:", orders); // Debug log
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
  },

  async getUser(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  async updateUser(userId: string, data: Partial<UserData>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referrer_uid', '==', userId));
      const querySnapshot = await getDocs(q);

      const stats = {
        totalReferred: 0,
        pendingRedemptions: 0,
        redeemedCount: 0
      };

      querySnapshot.forEach(doc => {
        const data = doc.data();
        stats.totalReferred++;
        if (data.referrer_redeemed) {
          stats.redeemedCount++;
        } else if (data.referred_redeemed) {
          stats.pendingRedemptions++;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error getting referral stats:", error);
      throw error;
    }
  },

  async createReferralCode(userId: string): Promise<string> {
    try {
      const referralsRef = collection(db, 'referrals');
      const code = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      await setDoc(doc(referralsRef), {
        referralCode: code,
        referrer_uid: userId,
        referred_redeemed: false,
        referrer_redeemed: false,
        createdAt: new Date().toISOString()
      });

      return code;
    } catch (error) {
      console.error("Error creating referral code:", error);
      throw error;
    }
  },

  async validateReferralCode(code: string): Promise<boolean> {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referralCode', '==', code));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error validating referral code:", error);
      return false;
    }
  },

  async handleReferredSignup(email: string, referralCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the referral record
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referralCode', '==', referralCode));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: false, error: "Invalid referral code" };
      }

      const referralDoc = snapshot.docs[0];
      const referralData = referralDoc.data();

      // Create new user with email and password
      const password = Math.random().toString(36).slice(-8); // Generate random password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create user in database
      await this.createUser({
        userid: userId,
        email: email,
        name: '',
        balance: 0,
        createdAt: new Date().toISOString(),
        isAnonymous: false
      });

      // Update referral with referred_uid
      await updateDoc(doc(referralsRef, referralDoc.id), {
        referred_uid: userId,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error("Error handling referral signup:", error);
      return { success: false, error: "Failed to process referral" };
    }
  },

  async checkReferralDiscount(userId: string): Promise<{ hasDiscount: boolean; discountType: 'referrer' | 'referred' | null }> {
    try {
      const referralsRef = collection(db, 'referrals');
      
      // Check if user is a referrer
      const referrerQuery = query(
        referralsRef, 
        where('referrer_uid', '==', userId),
        where('referred_redeemed', '==', true),
        where('referrer_redeemed', '==', false)
      );
      
      // Check if user is referred
      const referredQuery = query(
        referralsRef,
        where('referred_uid', '==', userId),
        where('referred_redeemed', '==', false)
      );

      const [referrerSnap, referredSnap] = await Promise.all([
        getDocs(referrerQuery),
        getDocs(referredQuery)
      ]);

      if (!referrerSnap.empty) {
        return { hasDiscount: true, discountType: 'referrer' };
      }

      if (!referredSnap.empty) {
        return { hasDiscount: true, discountType: 'referred' };
      }

      return { hasDiscount: false, discountType: null };
    } catch (error) {
      console.error("Error checking referral discount:", error);
      return { hasDiscount: false, discountType: null };
    }
  },

  async createReferralRecord(referralCode: string, referredUid: string): Promise<void> {
    try {
      // Find the referral record
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referralCode', '==', referralCode));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const referralDoc = snapshot.docs[0];
        // Update the referral with the referred user's ID
        await updateDoc(doc(referralsRef, referralDoc.id), {
          referred_uid: referredUid,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error creating referral record:", error);
      throw error;
    }
  }
}; 