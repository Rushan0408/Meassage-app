import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../services/api';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const fetchUsers = async (searchTerm = search, pageNum = page) => {
    try {
      setLoading(true);
      setError('');
      console.log(`Fetching users with search: "${searchTerm}", page: ${pageNum}`);
      
      const response = await getUsers(searchTerm, pageNum, pageSize);
      
      // Check if response data has the expected structure
      if (response.data && Array.isArray(response.data.content)) {
        setUsers(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        
        if (response.data.content.length === 0 && searchTerm) {
          setError(`No users found matching "${searchTerm}"`);
        }
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Error loading users: Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers(search, 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      fetchUsers(search, newPage);
    }
  };

  const getUserStatusClass = (status) => {
    switch (status) {
      case 'online':
        return 'status-online';
      case 'away':
        return 'status-away';
      case 'offline':
      default:
        return 'status-offline';
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>Users</h2>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>

      {loading && <div className="loading">Loading users...</div>}

      {error && <div className="error-message">{error}</div>}

      {!loading && users.length === 0 && (
        <div className="no-users">No users found</div>
      )}

      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <Link to={`/users/${user.id}`} className="user-card-link">
              <div className={`user-status ${getUserStatusClass(user.status)}`}></div>
              <div className="user-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={`${user.firstName}'s profile`} />
                ) : (
                  <div className="default-avatar">
                    {user.firstName && user.firstName.charAt(0)}
                    {user.lastName && user.lastName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="user-info">
                <h3>{user.firstName} {user.lastName}</h3>
                <p className="user-email">{user.email}</p>
                <p className="user-status-text">
                  {user.status === 'online' ? 'Online' : 
                   user.status === 'away' ? 'Away' : 'Offline'}
                </p>
              </div>
            </Link>
            <Link to={`/conversations/new?userId=${user.id}`} className="message-button">
              Message
            </Link>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(page - 1)} 
            disabled={page === 0}
            className="pagination-button"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {page + 1} of {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(page + 1)} 
            disabled={page >= totalPages - 1}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 