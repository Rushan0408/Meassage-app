export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const date = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid time';
  
  // For today's dates, show only time
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // For dates in the current year, show month and day
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ' at ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // For older dates, show full date
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}; 