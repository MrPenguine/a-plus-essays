import { db } from "./config";
import { collection, doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";

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
  }
}; 