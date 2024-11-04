import { auth } from "./config";
import { signInAnonymously, updateProfile } from "firebase/auth";

export const handleProjectCreation = async (formData: {
  assignmentType: string;
  projectTitle: string;
  email?: string;
}) => {
  try {
    let currentUser = auth.currentUser;

    if (!currentUser && formData.email) {
      const anonUser = await signInAnonymously(auth);
      currentUser = anonUser.user;
      
      await updateProfile(currentUser, {
        displayName: formData.email,
        photoURL: `mailto:${formData.email}`
      });

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          userId: currentUser.uid,
          userEmail: formData.email
        })
      });

      const result = await response.json();
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      user: currentUser
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}; 