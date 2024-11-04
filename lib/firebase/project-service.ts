import { auth } from "./config";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { dbService } from "./db-service";

export const handleProjectCreation = async (formData: {
  assignmentType: string;
  projectTitle: string;
  email?: string;
}) => {
  try {
    let currentUser = auth.currentUser;

    // If no user is logged in but email is provided
    if (!currentUser && formData.email) {
      try {
        // Check if user exists
        const userExists = await dbService.checkUserExists(formData.email);
        
        if (userExists) {
          return {
            success: false,
            error: 'User already exists. Please login.',
            redirect: '/auth/signin'
          };
        }

        // Create anonymous user
        const anonUser = await signInAnonymously(auth);
        currentUser = anonUser.user;
        
        // Update profile with email
        await updateProfile(currentUser, {
          displayName: formData.email,
          photoURL: `mailto:${formData.email}`
        });

        // Create user in database
        await dbService.createUser({
          email: formData.email,
          name: '',
          userid: currentUser.uid,
          balance: 0,
          createdAt: new Date().toISOString(),
          isAnonymous: true
        });

        console.log('User created:', {
          uid: currentUser.uid,
          email: formData.email,
          isAnonymous: currentUser.isAnonymous
        });
      } catch (authError) {
        console.error("Authentication error:", authError);
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }
    }

    // Create project data
    const projectData = {
      assignmentType: formData.assignmentType,
      projectTitle: formData.projectTitle,
      userEmail: currentUser?.photoURL?.replace('mailto:', '') || formData.email || '',
      userId: currentUser?.uid || 'guest',
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    // Create project in database
    await dbService.createProject(projectData);

    return {
      success: true,
      user: currentUser,
      projectData
    };
  } catch (error) {
    console.error("Error in project creation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}; 