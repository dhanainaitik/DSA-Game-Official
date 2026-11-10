/**
 * Sample / demonstration community data used strictly when the Community API
 * is unavailable or returns an empty initial dataset.
 * All accounts, posts, and comments here are clearly marked `isDemo: true`.
 */

export const COMMUNITY_DEMO_POSTS = [
  {
    id: 'demo-post-1',
    isDemo: true,
    clerk_id: 'demo_user_1',
    type: 'QUESTION',
    title: 'Struggling with Longest Consecutive Sequence',
    content:
      "I understand the brute force approach, but I'm having trouble understanding why using an unordered_set reduces the time complexity to O(n). Can someone explain how we identify the starting element of a sequence?",
    preview:
      "I understand the brute force approach, but I'm having trouble understanding why using an unordered_set reduces the time complexity to O(n). Can someone explain how we identify the starting element of a sequence?",
    tags: ['Array'],
    vote_score: 12,
    comment_count: 5,
    views: 0,
    created_at: 'demo',
    updated_at: 'demo',
    author: {
      username: 'CodeNinja_07',
      level: 8,
      isDemo: true,
    },
  },
  {
    id: 'demo-post-2',
    isDemo: true,
    clerk_id: 'demo_user_2',
    type: 'DISCUSSION',
    title: 'How do you approach recursion problems?',
    content:
      "I've been practising recursion for the past week. I can solve basic problems, but I struggle when multiple recursive calls are involved. What mental model do you use to understand the recursion tree?",
    preview:
      "I've been practising recursion for the past week. I can solve basic problems, but I struggle when multiple recursive calls are involved. What mental model do you use to understand the recursion tree?",
    tags: ['Recursion'],
    vote_score: 18,
    comment_count: 7,
    views: 0,
    created_at: 'demo',
    updated_at: 'demo',
    author: {
      username: 'RecursionRookie',
      level: 5,
      isDemo: true,
    },
  },
  {
    id: 'demo-post-3',
    isDemo: true,
    clerk_id: 'demo_user_3',
    type: 'SOLUTION',
    title: 'A simple trick to understand Binary Search',
    content:
      'Always define what your search space represents before writing the loop. Once you understand what low and high mean, updating the boundaries becomes much easier. Also, be careful with mid calculation and loop conditions.',
    preview:
      'Always define what your search space represents before writing the loop. Once you understand what low and high mean, updating the boundaries becomes much easier. Also, be careful with mid calculation and loop conditions.',
    tags: ['Binary Search'],
    vote_score: 24,
    comment_count: 9,
    views: 0,
    created_at: 'demo',
    updated_at: 'demo',
    author: {
      username: 'BinaryBeast',
      level: 14,
      isDemo: true,
    },
  },
  {
    id: 'demo-post-4',
    isDemo: true,
    clerk_id: 'demo_user_4',
    type: 'DISCUSSION',
    title: 'Finally understood the Monotonic Stack!',
    content:
      'After struggling with Next Greater Element and Daily Temperatures, I finally understood how a monotonic stack maintains candidates in sorted order. Practising dry runs made a huge difference.',
    preview:
      'After struggling with Next Greater Element and Daily Temperatures, I finally understood how a monotonic stack maintains candidates in sorted order. Practising dry runs made a huge difference.',
    tags: ['Stack'],
    vote_score: 15,
    comment_count: 4,
    views: 0,
    created_at: 'demo',
    updated_at: 'demo',
    author: {
      username: 'StackOverflowed',
      level: 11,
      isDemo: true,
    },
  },
];

export const COMMUNITY_DEMO_COMMENTS = {
  'demo-post-1': [
    {
      id: 'demo-c-1-1',
      post_id: 'demo-post-1',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_3',
      content: 'You only start counting from x if (x - 1) is NOT in the unordered_set. That guarantees x is the start of a sequence.',
      vote_score: 6,
      created_at: 'demo',
      author: { username: 'BinaryBeast', level: 14, isDemo: true },
    },
    {
      id: 'demo-c-1-2',
      post_id: 'demo-post-1',
      parent_id: 'demo-c-1-1',
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Oh! So any element that has a left neighbor gets skipped in the outer while-loop check?',
      vote_score: 3,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
    {
      id: 'demo-c-1-3',
      post_id: 'demo-post-1',
      parent_id: 'demo-c-1-2',
      isDemo: true,
      clerk_id: 'demo_user_3',
      content: 'Exactly — each number in a streak is visited at most twice total, making the overall runtime O(n) average.',
      vote_score: 5,
      created_at: 'demo',
      author: { username: 'BinaryBeast', level: 14, isDemo: true },
    },
    {
      id: 'demo-c-1-4',
      post_id: 'demo-post-1',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_4',
      content: 'Also make sure to iterate over the set itself rather than the original array to skip duplicates!',
      vote_score: 4,
      created_at: 'demo',
      author: { username: 'StackOverflowed', level: 11, isDemo: true },
    },
    {
      id: 'demo-c-1-5',
      post_id: 'demo-post-1',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_2',
      content: 'Dry-running [100, 4, 200, 1, 3, 2] on paper really made the (x - 1) check click for me too.',
      vote_score: 2,
      created_at: 'demo',
      author: { username: 'RecursionRookie', level: 5, isDemo: true },
    },
  ],
  'demo-post-2': [
    {
      id: 'demo-c-2-1',
      post_id: 'demo-post-2',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_3',
      content: 'Trust the recursive leap of faith: assume f(smaller) already works and focus only on how the current node combines sub-results.',
      vote_score: 9,
      created_at: 'demo',
      author: { username: 'BinaryBeast', level: 14, isDemo: true },
    },
    {
      id: 'demo-c-2-2',
      post_id: 'demo-post-2',
      parent_id: 'demo-c-2-1',
      isDemo: true,
      clerk_id: 'demo_user_2',
      content: 'Keeping the function contract crystal clear before tracing branches helps a lot. Thanks!',
      vote_score: 3,
      created_at: 'demo',
      author: { username: 'RecursionRookie', level: 5, isDemo: true },
    },
    {
      id: 'demo-c-2-3',
      post_id: 'demo-post-2',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_4',
      content: 'Draw the tree for tiny inputs like n = 3 in Logic Lab before trying to trace bigger cases.',
      vote_score: 5,
      created_at: 'demo',
      author: { username: 'StackOverflowed', level: 11, isDemo: true },
    },
    {
      id: 'demo-c-2-4',
      post_id: 'demo-post-2',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Separating "what changes in state" vs "what is returned up" cleared up my confusion with multiple branches.',
      vote_score: 4,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
    {
      id: 'demo-c-2-5',
      post_id: 'demo-post-2',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_3',
      content: 'Once backtracking decisions make sense as "pick vs skip", problems like Subsets and Permutations feel very consistent.',
      vote_score: 6,
      created_at: 'demo',
      author: { username: 'BinaryBeast', level: 14, isDemo: true },
    },
    {
      id: 'demo-c-2-6',
      post_id: 'demo-post-2',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_4',
      content: 'Writing the base case first prevents infinite stack frames when testing.',
      vote_score: 2,
      created_at: 'demo',
      author: { username: 'StackOverflowed', level: 11, isDemo: true },
    },
    {
      id: 'demo-c-2-7',
      post_id: 'demo-post-2',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Also watch whether parameters are passed by reference or value when mutating a path array.',
      vote_score: 3,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
  ],
  'demo-post-3': [
    {
      id: 'demo-c-3-1',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Using low + Math.floor((high - low) / 2) saved me from subtle overflow bugs in C++ too!',
      vote_score: 8,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
    {
      id: 'demo-c-3-2',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_2',
      content: 'Deciding upfront between closed [low, high] and half-open [low, high) stops off-by-one infinite loops.',
      vote_score: 7,
      created_at: 'demo',
      author: { username: 'RecursionRookie', level: 5, isDemo: true },
    },
    {
      id: 'demo-c-3-3',
      post_id: 'demo-post-3',
      parent_id: 'demo-c-3-2',
      isDemo: true,
      clerk_id: 'demo_user_3',
      content: 'Yes! Once your invariant says "target, if present, is inside [low, high]", while (low <= high) follows naturally.',
      vote_score: 5,
      created_at: 'demo',
      author: { username: 'BinaryBeast', level: 14, isDemo: true },
    },
    {
      id: 'demo-c-3-4',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_4',
      content: 'Binary Search on Answer (e.g. Koko Eating Bananas) makes way more sense with this framing.',
      vote_score: 6,
      created_at: 'demo',
      author: { username: 'StackOverflowed', level: 11, isDemo: true },
    },
    {
      id: 'demo-c-3-5',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Bookmarked this tip — always check array length 1 and 2 as sanity tests.',
      vote_score: 2,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
    {
      id: 'demo-c-3-6',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_2',
      content: 'Testing when target equals the leftmost or rightmost element catches most boundary mistakes.',
      vote_score: 3,
      created_at: 'demo',
      author: { username: 'RecursionRookie', level: 5, isDemo: true },
    },
    {
      id: 'demo-c-3-7',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_4',
      content: 'Storing an `ans` candidate variable when searching for lower_bound makes boundary updates super readable.',
      vote_score: 4,
      created_at: 'demo',
      author: { username: 'StackOverflowed', level: 11, isDemo: true },
    },
    {
      id: 'demo-c-3-8',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Cleanest summary of binary search invariants.',
      vote_score: 2,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
    {
      id: 'demo-c-3-9',
      post_id: 'demo-post-3',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_2',
      content: 'Appreciate sharing this approach!',
      vote_score: 1,
      created_at: 'demo',
      author: { username: 'RecursionRookie', level: 5, isDemo: true },
    },
  ],
  'demo-post-4': [
    {
      id: 'demo-c-4-1',
      post_id: 'demo-post-4',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_1',
      content: 'Daily Temperatures clicked for me as soon as I started pushing indices onto the stack instead of raw values.',
      vote_score: 5,
      created_at: 'demo',
      author: { username: 'CodeNinja_07', level: 8, isDemo: true },
    },
    {
      id: 'demo-c-4-2',
      post_id: 'demo-post-4',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_3',
      content: 'Try Largest Rectangle in Histogram next — same monotonic pattern in both directions!',
      vote_score: 4,
      created_at: 'demo',
      author: { username: 'BinaryBeast', level: 14, isDemo: true },
    },
    {
      id: 'demo-c-4-3',
      post_id: 'demo-post-4',
      parent_id: 'demo-c-4-2',
      isDemo: true,
      clerk_id: 'demo_user_4',
      content: 'Added that to my practice queue for tomorrow.',
      vote_score: 2,
      created_at: 'demo',
      author: { username: 'StackOverflowed', level: 11, isDemo: true },
    },
    {
      id: 'demo-c-4-4',
      post_id: 'demo-post-4',
      parent_id: null,
      isDemo: true,
      clerk_id: 'demo_user_2',
      content: 'Love seeing the O(n) amortized push/pop intuition explained simply.',
      vote_score: 3,
      created_at: 'demo',
      author: { username: 'RecursionRookie', level: 5, isDemo: true },
    },
  ],
};

// In-memory session store so demo likes and comments stay consistent between feed and detail views
// without ever writing demo interactions to the backend.
const sessionVotes = {};
const sessionCommentAdditions = {};

export function isDemoPostId(postId) {
  return typeof postId === 'string' && COMMUNITY_DEMO_POSTS.some((p) => p.id === postId);
}

export function getDemoPostsWithSession() {
  return COMMUNITY_DEMO_POSTS.map((post) => {
    const userVote = sessionVotes[post.id] || 0;
    const extraComments = (sessionCommentAdditions[post.id] || []).length;
    return {
      ...post,
      vote_score: post.vote_score + userVote,
      comment_count: post.comment_count + extraComments,
    };
  });
}

export function getDemoUserVote(postId) {
  return sessionVotes[postId] || 0;
}

export function applyDemoVote(postId, value) {
  if (!isDemoPostId(postId)) return null;
  const prevVote = sessionVotes[postId] || 0;
  const nextVote = prevVote === value ? 0 : value;
  sessionVotes[postId] = nextVote;
  const basePost = COMMUNITY_DEMO_POSTS.find((p) => p.id === postId);
  return {
    vote_score: (basePost?.vote_score || 0) + nextVote,
    user_vote: nextVote,
  };
}

export function getDemoPostById(postId) {
  return getDemoPostsWithSession().find((p) => p.id === postId) || null;
}

export function getDemoCommentsForPost(postId, sort = 'new') {
  const base = COMMUNITY_DEMO_COMMENTS[postId] || [];
  const added = sessionCommentAdditions[postId] || [];
  const all = [...added, ...base];
  if (sort === 'top') {
    return [...all].sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
  }
  return all;
}

export function addDemoSessionComment(postId, comment) {
  if (!sessionCommentAdditions[postId]) {
    sessionCommentAdditions[postId] = [];
  }
  sessionCommentAdditions[postId] = [comment, ...sessionCommentAdditions[postId]];
}

