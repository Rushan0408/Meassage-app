import React, { useState, useEffect } from 'react';
import { getUsers } from '../services/api';
import { Link } from 'react-router-dom';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = async (searchTerm = search, pageNum = page) => {
    setLoading(true);
    try {
      const response = await getUsers(searchTerm, pageNum, size);
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0); // Reset to first page when searching
    fetchUsers(search, 0);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers(search, newPage);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={page === i ? 'active' : ''}
        >
          {i + 1}
        </button>
      );
    }
    return pages;
  };

  const getUserStatusClass = (status) => {
    switch (status) {
      case 'online':
        return 'status-online';
      case 'offline':
        return 'status-offline';
      case 'away':
        return 'status-away';
      default:
        return '';
    }
  };

  return (
    <div className="user-list-container">
      <h2>Users</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search by username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      
      {loading && <div className="loading">Loading users...</div>}
      {error && <div className="error">{error}</div>}
      
      {!loading && users.length === 0 && (
        <div className="no-users">No users found</div>
      )}
      
      {users.length > 0 && (
        <div className="user-list">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className={`user-status ${getUserStatusClass(user.status)}`}></div>
              <div className="user-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={`${user.username}'s profile`} />
                ) : (
                  <div className="default-avatar">
                    {user.firstName && user.lastName 
                      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                      : user.username.substring(0, 2)}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h3>{user.firstName} {user.lastName}</h3>
                <p className="username">@{user.username}</p>
                <p className="email">{user.email}</p>
              </div>
              <Link to={`/users/${user.id}`} className="view-profile">
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(page - 1)} 
            disabled={page === 0}
          >
            Previous
          </button>
          {renderPagination()}
          <button 
            onClick={() => handlePageChange(page + 1)} 
            disabled={page === totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList; 