"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  status?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function UserDetailPage() {
  const params = useParams();
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const userId = params.id as string;
    if (!userId || !token) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await userService.getUserById(userId, token);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setError("User not found or you don't have permission to view this profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isAuthenticated, params.id, token, router]);

  // Get user initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName.charAt(0) || '';
    const last = lastName.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Error</CardTitle>
            <CardDescription className="text-center">
              {error || "User not found"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/users">
              <Button>Back to Users</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className="text-lg">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
              <div className="flex justify-center">
                <Badge variant={user.status === 'online' ? 'default' : 'secondary'}>
                  {user.status || 'Offline'}
                </Badge>
              </div>
              <CardDescription>
                @{user.username}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="font-medium truncate">{user.id}</p>
          </div>
          {user.lastSeen && (
            <div className="grid gap-1">
              <p className="text-sm font-medium text-muted-foreground">Last Seen</p>
              <p className="font-medium">{formatDate(user.lastSeen)}</p>
            </div>
          )}
          {user.createdAt && (
            <div className="grid gap-1">
              <p className="text-sm font-medium text-muted-foreground">Account Created</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-4 justify-center">
          <Link href="/users">
            <Button variant="outline">Back to Users</Button>
          </Link>
          <Link href="/">
            <Button>Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 