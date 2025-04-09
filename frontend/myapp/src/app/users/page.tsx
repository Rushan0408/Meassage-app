"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userService, SearchParams } from "@/services/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
};

export default function UsersPage() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const usersPerPage = 6;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchUsers();
    }
  }, [isAuthenticated]);
  

  useEffect(() => {
    // Apply client-side filtering and pagination when users or search query changes
    let result = users;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = users.filter(user => 
        user.firstName.toLowerCase().includes(query) || 
        user.lastName.toLowerCase().includes(query) || 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
    setCurrentPage(0); // Reset to first page on search
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // We'll fetch all users and handle pagination on client-side
      const response = await userService.getUsers({ search: searchQuery }, token);
      
      // Ensure we handle both formats (array directly or wrapped in content property)
      const userData = Array.isArray(response) ? response : (response.content || []);
      
      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize search query - remove special characters
    const sanitizedQuery = searchQuery.replace(/[^\w\s@.-]/gi, '');
    setSearchQuery(sanitizedQuery);
    fetchUsers();
  };

  // Get paginated users
  const getPaginatedUsers = () => {
    const startIndex = currentPage * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  };

  const pageCount = Math.ceil(filteredUsers.length / usersPerPage);

  // Get user initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName.charAt(0) || '';
    const last = lastName.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Users Directory</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by name, username or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {getPaginatedUsers().map(user => (
            <Card key={user.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={user.status === 'online' ? 'default' : 'secondary'}>
                      {user.status || 'Offline'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="mt-4">
                  <Link href={`/users/${user.id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage >= pageCount - 1 || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 