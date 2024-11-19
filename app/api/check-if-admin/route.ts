import { dbService } from "@/lib/firebase/db-service";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user is admin using dbService
    const isAdmin = await dbService.isUserAdmin(decodedToken.uid);
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}