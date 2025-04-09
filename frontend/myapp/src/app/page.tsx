"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to avoid flash of loading state on fast connections
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);
    
    // Only redirect if not authenticated AND we're done loading
    if (!isAuthenticated && !isLoading) {
      console.log('Not authenticated and done loading, redirecting to login');
      router.push("/login");
    }
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Messaging App</h1>
          <div className="flex space-x-2">
            <Link href="/profile">
              <Button variant="outline">Profile</Button>
            </Link>
            <Button 
              onClick={() => {
                logout();
                router.push("/login");
              }}
              variant="destructive"
            >
              Logout
            </Button>
          </div>
        </div>
        
        <div className="grid place-items-center py-16">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">Welcome, {user?.firstName || "User"}!</h2>
            <p className="text-muted-foreground">You are successfully logged in to the Messaging App.</p>
            
            <div className="grid gap-8 mt-10 max-w-lg mx-auto">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid gap-4">
                  <Link href="/profile">
                    <Button variant="secondary" className="w-full">
                      My Profile
                    </Button>
                  </Link>
                  <Link href="/users">
                    <Button variant="secondary" className="w-full">
                      Users Directory
                    </Button>
                  </Link>
                  <Button variant="secondary" className="w-full" disabled>
                    Messages (Coming Soon)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
