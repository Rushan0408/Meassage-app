"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription,  DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { userService, UserUpdateData } from "@/services/userService";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isAuthenticated, logout, refreshToken, token, fetchUserData } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UserUpdateData>({
    firstName: '',
    lastName: '',
    username: '',
    email: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      });
    }
  }, [user]);

  const handleRefreshToken = async () => {
    setRefreshing(true);
    const success = await refreshToken();
    setRefreshing(false);
    if (!success) {
      alert("Failed to refresh token");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async () => {
    if (!user || !token) return;
    
    setIsUpdating(true);
    try {
      await userService.updateUser(user.id, formData, token);
      if (token) {
        await fetchUserData(token);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!token) return;
    
    setStatusUpdating(true);
    try {
      await userService.updateStatus(newStatus, token);
      if (token) {
        await fetchUserData(token);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    setUploadingImage(true);
    try {
      await userService.updateProfilePicture(file, token);
      if (token) {
        await fetchUserData(token);
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      alert("Failed to upload profile picture");
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    const first = user.firstName.charAt(0) || '';
    const last = user.lastName.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={handleProfilePictureClick}>
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white text-xs">
                  Uploading...
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Badge variant={user.status === 'online' ? 'default' : 'secondary'} className="cursor-pointer">
                    {statusUpdating ? 'Updating...' : (user.status || 'Offline')}
                  </Badge>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Status</DialogTitle>
                    <DialogDescription>Set your current status</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Button 
                      onClick={() => handleStatusChange('online')} 
                      variant={user.status === 'online' ? 'default' : 'outline'}
                      className="w-full"
                    >
                      Online
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange('away')} 
                      variant={user.status === 'away' ? 'default' : 'outline'}
                      className="w-full"
                    >
                      Away
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange('offline')} 
                      variant={user.status === 'offline' ? 'default' : 'outline'}
                      className="w-full"
                    >
                      Offline
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <CardDescription>
                @{user.username}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {isEditing ? (
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleUpdateProfile} 
                className="flex-1" 
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        ) : (
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
            <Button 
              onClick={() => setIsEditing(true)} 
              className="w-full" 
              variant="outline"
            >
              Edit Profile
            </Button>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={handleRefreshToken}
            variant="outline"
            className="w-full"
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh Token"}
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            Logout
          </Button>
          <Link href="/" className="w-full">
            <Button variant="secondary" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 