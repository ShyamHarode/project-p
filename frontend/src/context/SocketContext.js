import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      setSocket(newSocket);

      // Join user's room for notifications
      newSocket.emit('join', user._id);

      // Listen for real-time events
      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Handle new followers
      newSocket.on('new_follower', (data) => {
        toast.success(`${data.follower.fullName} started following you!`, {
          position: 'top-right',
          autoClose: 3000,
        });
      });

      // Handle post likes
      newSocket.on('post_liked', (data) => {
        // Update post likes in real-time
        // This will be handled by individual components
      });

      // Handle new comments
      newSocket.on('comment_added', (data) => {
        // Update comments in real-time
        // This will be handled by individual components
      });

      // Handle new posts
      newSocket.on('new_post', (data) => {
        // Refresh feed or add new post to top
        // This will be handled by the feed component
      });

      // Handle online users
      newSocket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else if (socket) {
      // Disconnect if user logs out
      socket.close();
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [isAuthenticated, user]);

  // Socket event emitters
  const emitLikePost = (postData) => {
    if (socket) {
      socket.emit('like_post', postData);
    }
  };

  const emitNewComment = (commentData) => {
    if (socket) {
      socket.emit('new_comment', commentData);
    }
  };

  const emitNewFollow = (followData) => {
    if (socket) {
      socket.emit('new_follow', followData);
    }
  };

  const emitPostView = (viewData) => {
    if (socket) {
      socket.emit('post_view', viewData);
    }
  };

  // Join specific rooms
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  };

  const value = {
    socket,
    onlineUsers,
    emitLikePost,
    emitNewComment,
    emitNewFollow,
    emitPostView,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
