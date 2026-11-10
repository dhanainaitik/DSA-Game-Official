import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Edit, Trash2, Eye, Clock, ChevronUp, Info } from 'lucide-react';
import VoteButton from '../../components/Community/VoteButton';
import TagBadge from '../../components/Community/TagBadge';
import CodeSnippet from '../../components/Community/CodeSnippet';
import CommentThread from '../../components/Community/CommentThread';
import {
  isDemoPostId,
  getDemoPostById,
  getDemoCommentsForPost,
  getDemoUserVote,
  applyDemoVote,
  addDemoSessionComment,
} from '../../data/communityDemoData';
import './PostDetail.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const POST_TYPE_CONFIG = {
  QUESTION:   { color: '#0284C7', bg: '#EFF6FF', text: 'Question' },
  DISCUSSION: { color: '#FFBD00', bg: '#FFFBEB', text: 'Discussion' },
  SOLUTION:   { color: '#10B981', bg: '#ECFDF5', text: 'Solution' },
};

function timeAgo(dateStr) {
  if (!dateStr || dateStr === 'demo') return 'Demo post';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diff)) return 'Demo post';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVote, setUserVote] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = user?.id;

  useEffect(() => {
    if (isDemoPostId(postId)) {
      const demoPost = getDemoPostById(postId);
      setPost(demoPost);
      setComments(getDemoCommentsForPost(postId, commentSort));
      setUserVote(getDemoUserVote(postId));
      setError(null);
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`${API}/api/community/posts/${postId}`),
          fetch(`${API}/api/community/posts/${postId}/comments?sort=${commentSort}`),
        ]);
        if (!postRes.ok) throw new Error('Post not found');
        const [postData, commentsData] = await Promise.all([postRes.json(), commentsRes.json()]);
        setPost(postData);
        setComments(Array.isArray(commentsData) ? commentsData : []);

        // Fetch user's vote if logged in
        if (currentUserId && user?.getToken) {
          const token = await user.getToken();
          const voteRes = await fetch(`${API}/api/community/posts/${postId}/user-vote`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (voteRes.ok) {
            const { user_vote } = await voteRes.json();
            setUserVote(user_vote);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, commentSort, currentUserId]);

  const handleVote = async (value) => {
    if (post?.isDemo || isDemoPostId(postId)) {
      const updated = applyDemoVote(postId, value);
      if (!updated) return;
      setPost((prev) => (prev ? { ...prev, vote_score: updated.vote_score } : prev));
      setUserVote(updated.user_vote);
      return;
    }

    if (!user) return navigate('/login');
    const token = await user.getToken();
    const res = await fetch(`${API}/api/community/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const { vote_score, user_vote } = await res.json();
      setPost((prev) => ({ ...prev, vote_score }));
      setUserVote(user_vote);
    }
  };

  const handleDelete = async () => {
    if (post?.isDemo || isDemoPostId(postId)) return;
    if (!user || !confirm('Are you sure you want to delete this post?')) return;
    setDeleting(true);
    const token = await user.getToken();
    const res = await fetch(`${API}/api/community/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      navigate('/community');
    } else {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="pd-page page">
        <div className="container" style={{ paddingTop: '40px' }}>
          <div className="pd-skeleton" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pd-page page">
        <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
          <h2>Post not found</h2>
          <Link to="/community" className="btn btn-primary" style={{ marginTop: '16px' }}>← Back to Community</Link>
        </div>
      </div>
    );
  }

  const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.DISCUSSION;
  const isDemo = Boolean(post.isDemo);
  const isOwner = !isDemo && user?.id === post.clerk_id;

  return (
    <div className="pd-page page animate-fadeIn">
      <div className="container pd-container">

        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <Link to="/community" className="pd-back-link">
            <ArrowLeft size={16} /> Community
          </Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-type" style={{ color: typeConfig.color }}>
            {typeConfig.text}
          </span>
          {isDemo && <span className="post-demo-badge" style={{ marginLeft: '8px' }}>DEMO</span>}
        </div>

        {isDemo && (
          <div className="community-demo-notice" role="status" style={{ marginBottom: '20px' }}>
            <div className="community-demo-notice-text">
              <Info size={16} />
              <span>You&apos;re viewing sample community posts. Session likes and replies are not saved permanently.</span>
            </div>
            <span className="community-demo-pill">DEMO DATA</span>
          </div>
        )}

        <div className="pd-layout">
          {/* Main post */}
          <div className="pd-main">
            <article className="pd-post-card">
              {/* Vote + content split */}
              <div className="pd-post-inner">
                {/* Vote column */}
                <div className="pd-vote-col">
                  <VoteButton
                    score={post.vote_score}
                    userVote={userVote}
                    onVote={handleVote}
                    vertical={true}
                  />
                </div>

                {/* Content */}
                <div className="pd-content">
                  {/* Header */}
                  <div className="pd-post-header">
                    <div className="pd-type-tags">
                      <span
                        className="post-type-badge"
                        style={{ background: typeConfig.bg, color: typeConfig.color, borderColor: typeConfig.color }}
                      >
                        {typeConfig.text}
                      </span>
                      {post.tags?.map((tag) => (
                        <Link to={`/community?tag=${encodeURIComponent(tag)}`} key={tag}>
                          <TagBadge tag={tag} small />
                        </Link>
                      ))}
                      {isDemo && <span className="post-demo-badge">DEMO</span>}
                    </div>

                    {isOwner && (
                      <div className="pd-owner-actions">
                        <button
                          className="pd-action-btn edit"
                          onClick={() => navigate(`/community/edit/${postId}`)}
                          title="Edit post"
                        >
                          <Edit size={15} /> Edit
                        </button>
                        <button
                          className="pd-action-btn delete"
                          onClick={handleDelete}
                          disabled={deleting}
                          title="Delete post"
                        >
                          <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>

                  <h1 className="pd-title">{post.title}</h1>

                  {/* Author row */}
                  <div className="pd-author-row">
                    <div className="pd-author-avatar">{post.author?.username?.[0]?.toUpperCase() || '?'}</div>
                    <div className="pd-author-info">
                      <span className="pd-author-name">{post.author?.username || 'Anonymous'}</span>
                      {!isDemo && (
                        <span className="pd-author-level">LVL {post.author?.level || 1}</span>
                      )}
                      {post.author?.title && <span className="pd-author-title">{post.author.title}</span>}
                    </div>
                    <div className="pd-post-meta">
                      <span className="post-stat">
                        <Clock size={13} /> {isDemo ? 'Demo post' : timeAgo(post.created_at)}
                      </span>
                      {!isDemo && (
                        <span className="post-stat"><Eye size={13} /> {post.views || 0} views</span>
                      )}
                    </div>
                  </div>

                  <hr className="pd-divider" />

                  {/* Post body */}
                  <div className="pd-body">
                    <p className="pd-body-text">{post.content}</p>
                  </div>

                  {/* Code snippet */}
                  {post.code_snippet && (
                    <div className="pd-code-section">
                      <div className="pd-code-label">Code</div>
                      <CodeSnippet code={post.code_snippet} language={post.code_lang || 'javascript'} />
                    </div>
                  )}

                  {/* Post updated indicator */}
                  {!isDemo && post.updated_at !== post.created_at && (
                    <div className="pd-edited-note">
                      Edited {timeAgo(post.updated_at)}
                    </div>
                  )}
                </div>
              </div>
            </article>

            {/* Comments */}
            <div className="pd-comments-section" id="comments">
              <CommentThread
                postId={postId}
                comments={comments}
                sort={commentSort}
                isDemo={isDemo}
                onSortChange={(s) => setCommentSort(s)}
                onCommentAdded={(c) => {
                  if (isDemo && !c.parent_id) addDemoSessionComment(postId, c);
                  setComments((prev) => [c, ...prev]);
                }}
                onCommentDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
              />
            </div>
          </div>

          {/* Sticky right panel */}
          <aside className="pd-sidebar">
            <div className="pd-sidebar-card">
              <div className="pd-sidebar-title">About this Post</div>
              <div className="pd-sidebar-row">
                <span className="pd-sidebar-label">Type</span>
                <span className="pd-sidebar-val" style={{ color: typeConfig.color, fontWeight: 800 }}>
                  {typeConfig.text}
                </span>
              </div>
              <div className="pd-sidebar-row">
                <span className="pd-sidebar-label">{isDemo ? 'Likes' : 'Score'}</span>
                <span className="pd-sidebar-val">{post.vote_score}</span>
              </div>
              {!isDemo && (
                <div className="pd-sidebar-row">
                  <span className="pd-sidebar-label">Views</span>
                  <span className="pd-sidebar-val">{post.views}</span>
                </div>
              )}
              <div className="pd-sidebar-row">
                <span className="pd-sidebar-label">Posted</span>
                <span className="pd-sidebar-val">{isDemo ? 'Demo post' : timeAgo(post.created_at)}</span>
              </div>
              {post.tags?.length > 0 && (
                <div className="pd-sidebar-tags">
                  {post.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} small />
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: '100%', marginTop: '8px' }}>
              <ChevronUp size={14} /> Back to Top
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
