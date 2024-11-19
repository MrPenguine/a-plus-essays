import { db } from "./config";
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc, orderBy, addDoc, limit as limitQuery } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from './config';

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
  originalPrice: number;
  adjustedPrice?: number;
  additionalPaymentNeeded?: number;
  amount: number;
  amount_paid: number;
  tutorid?: string;
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
  status?: string;
  createdAt?: string;
}

interface OrderUpdate {
  amount_paid?: number;
  status?: string;
  paymentStatus?: string;
  paymentReference?: string;
  paymentType?: string;
  discountAmount?: number;
  discountType?: string | null;
  updatedAt?: string;
  documents?: {
    client: Array<{
      date: string;
      files: Array<{
        fileName: string;
        url: string;
      }>;
    }>;
    tutor: Array<{
      date: string;
      files: Array<{
        fileName: string;
        url: string;
      }>;
    }>;
  };
  assignment_type?: string;
  deadline?: string;
  description?: string;
  file_links?: string[];
  level?: string;
  pages?: number;
  price?: number;
  subject?: string;
  title?: string;
  userEmail?: string;
  userid?: string;
  wordcount?: number;
  tutorid?: string;
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

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  createdAt: string;
  status: string;
}

interface OrderDetail {
  id: string;
  title: string;
  status: string;
  deadline: string;
  pages: number;
  level: string;
  subject: string;
  description: string;
  assignment_type: string;
  wordcount: number;
  userid: string;
  tutorid?: string;
  createdAt: string;
  file_links: string[];
  price: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  originalPrice: number;
  amount_paid: number;
  adjustedPrice?: number;
  additionalPaymentNeeded?: number;
  updatedAt?: string;
  documents?: {
    documents: {
      client: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
      tutor: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
    };
  };
}

interface TutorData {
  tutorid: string;
  tutor_name: string;
  profile_picture: string;
  bio: string;
  rating: number;
  reviews: number;
  education: string;
  orders_completed: number;
  highschool_cpp: number;
  undergraduate_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
  mentor: boolean;
  subject?: string;
  totalProjects?: number;
}

const getPayments = async (orderId: string, userId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'payments');
    // Query for payments matching both orderId and userId
    const q = query(
      paymentsRef,
      where('orderId', '==', orderId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const payments: Payment[] = [];
    
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      } as Payment);
    });
    
    // Sort by createdAt on client side
    return payments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting payments:', error);
    throw error;
  }
};

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

  async createOrder(orderData: any) {
    try {
      const ordersRef = collection(db, 'orders');
      // Ensure price is set with a default value of 0
      const orderWithDefaults = {
        ...orderData,
        price: orderData.price || 0,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(ordersRef, orderWithDefaults);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  async createPayment(paymentData: PaymentData): Promise<void> {
    try {
      const paymentRef = doc(collection(db, 'payments'));
      await setDoc(paymentRef, {
        ...paymentData,
        createdAt: new Date().toISOString(),
        status: paymentData.status || 'completed'
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  },

  async updateOrder(orderId: string, data: OrderUpdate): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        ...data,
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

  async getOrder(orderId: string): Promise<OrderDetail> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error('Order not found');
      }

      const data = orderSnap.data();
      return {
        id: orderSnap.id,
        ...data,
        originalPrice: data.originalPrice || data.price,
        additionalPaymentNeeded: data.additionalPaymentNeeded || 0,
        paymentStatus: data.paymentStatus || 'pending',
        amount_paid: data.amount_paid || 0
      } as OrderDetail;
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
  },

  getPayments,

  async getTutors(): Promise<TutorData[]> {
    try {
      const tutorsRef = collection(db, 'tutors');
      const snapshot = await getDocs(tutorsRef);
      return snapshot.docs.map(doc => ({ 
        tutorid: doc.id,
        tutor_name: doc.data().tutor_name || 'Expert',
        profile_picture: doc.data().profile_picture || '/default-avatar.png',
        bio: doc.data().bio || '',
        rating: doc.data().rating || 0,
        reviews: doc.data().reviews || 0,
        education: doc.data().education || '',
        orders_completed: doc.data().orders_completed || 0,
        highschool_cpp: doc.data().highschool_cpp || 0,
        undergraduate_cpp: doc.data().undergraduate_cpp || 0,
        masters_cpp: doc.data().masters_cpp || 0,
        phd_cpp: doc.data().phd_cpp || 0,
        mentor: doc.data().mentor || false,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching tutors:', error);
      throw error;
    }
  },

  async getTutorById(tutorId: string): Promise<TutorData | null> {
    try {
      const tutorsRef = collection(db, 'tutors');
      const q = query(tutorsRef, where('tutorid', '==', tutorId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const tutorDoc = querySnapshot.docs[0];
        return {
          id: tutorId,
          tutor_name: tutorDoc.data()?.tutor_name || 'Expert',
          profile_picture: tutorDoc.data()?.profile_picture || '/default-avatar.png'
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching tutor:', error);
      return null;
    }
  },

  async getOrders(userId: string, limit?: number) {
    try {
      const ordersRef = collection(db, 'orders');
      let q = query(
        ordersRef,
        where('userid', '==', userId)
        // Temporarily remove orderBy until index is created
        // orderBy('createdAt', 'desc')
      );

      if (limit) {
        q = query(q, limitQuery(limit));
      }

      const snapshot = await getDocs(q);
      
      // Sort in memory instead
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return orders.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error getting orders:", error);
      throw error;
    }
  },
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('useruid', '==', userId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}; 
