import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ token, role, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const [commentText, setCommentText] = useState({});
  const [commentsData, setCommentsData] = useState({});
  
  // Dito natin itatabi yung bilang ng reactions
  const [reactionCounts, setReactionCounts] = useState({}); 

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommentsData((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  useEffect(() => {
    posts.forEach((post) => fetchComments(post.postId));
  }, [posts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3000/api/v1/posts',
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setContent('');
      fetchPosts(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId]) return;
    try {
      await axios.post(
        `http://localhost:3000/api/v1/posts/${postId}/comments`,
        { content: commentText[postId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText({ ...commentText, [postId]: '' });
      fetchComments(postId); 
    } catch (err) {
      alert('Error adding comment');
    }
  };

  const handleReaction = async (postId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/v1/posts/${postId}/reactions`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // I-update yung count sa screen (para may feedback agad)
      setReactionCounts(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }));
      
    } catch (err) {
      alert(err.response?.data?.message || 'Error reacting');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">EduConnect Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span>Role: {role}</span>
          <button onClick={onLogout} className="px-4 py-1 bg-red-500 rounded hover:bg-red-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 p-4">
        {role === 'Teacher' || role === 'Admin' ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-bold mb-4">Create a New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <input
                type="text"
                placeholder="Post Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Write your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              ></textarea>
              <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Post</button>
            </form>
          </div>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8">
            <p>Only Teachers and Admins can create posts.</p>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Educational Posts</h2>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-gray-500">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.postId} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-bold text-blue-800">{post.title}</h3>
                <p className="text-gray-700 mt-2">{post.content}</p>
                <p className="text-sm text-gray-500 mt-4">Posted by: {post.user?.firstName} {post.user?.lastName}</p>
                
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <button onClick={() => handleReaction(post.postId)} className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                      ❤️ Mark as Helpful
                    </button>
                    {/* DITO LALABAS YUNG BILANG */}
                    <span className="text-sm text-gray-500 font-semibold">
                      {reactionCounts[post.postId] || 0} Helpful
                    </span>
                  </div>
                  
                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText[post.postId] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [post.postId]: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded-md text-sm"
                    />
                    <button onClick={() => handleAddComment(post.postId)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                      Comment
                    </button>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs font-bold text-gray-500 mb-2">Comments:</p>
                    {commentsData[post.postId] && commentsData[post.postId].length > 0 ? (
                      commentsData[post.postId].map((c) => (
                        <div key={c.commentId} className="text-sm text-gray-700 mb-1 border-b pb-1">
                          <span className="font-semibold text-blue-900">{c.user?.firstName}:</span> {c.content}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No comments yet.</p>
                    )}
                  </div>

                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}