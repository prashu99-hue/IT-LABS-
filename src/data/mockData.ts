import { User, Post, CategoryMeta, SubjectCategory } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Dr. Elena Vance',
    username: 'elenavance_ai',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces',
    role: 'teacher_expert',
    title: 'Professor of Computer Science & AI',
    institution: 'Caltech Institute of Tech',
    bio: 'Researches Scalable Neural Architectures & Distributed Systems. Passionate about teaching intuitive Machine Learning and low-level compute optimization.',
    expertise: ['AI/ML', 'Python', 'Distributed Systems', 'PyTorch'],
    followersCount: 24820,
    followingCount: 340,
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'user-2',
    name: 'Marcus Brody',
    username: 'marcus_cloud',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    role: 'teacher_expert',
    title: 'Principal Cloud Architect & Author',
    institution: 'AWS Certified Fellow',
    bio: '15+ years in High-Availability Cloud Infrastructure, Kubernetes orchestration, and enterprise microservices. Author of "Production Cloud Patterns".',
    expertise: ['Cloud Computing', 'Cybersecurity', 'Web Development', 'DBMS'],
    followersCount: 18450,
    followingCount: 420,
    isVerified: true,
    isFollowing: true,
  },
  {
    id: 'user-3',
    name: 'Priya Sharma',
    username: 'priya_codes',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=faces',
    role: 'student',
    title: 'Senior CS Undergraduate',
    institution: 'Indian Institute of Technology (IIT)',
    bio: 'Final year CS undergrad. Passionate about Data Structures, Modern C++, and System Design. Maintaining open-source competitive programming notes.',
    expertise: ['C++', 'Java', 'Web Development'],
    followersCount: 5120,
    followingCount: 290,
    isVerified: false,
    isFollowing: true,
  },
  {
    id: 'user-4',
    name: 'Alex Rivera',
    username: 'arivera_jvm',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
    role: 'teacher_expert',
    title: 'Staff Backend Engineer & Java Champion',
    institution: 'FinTech Engineering Group',
    bio: 'Specializing in JVM low-latency garbage collection tuning, Spring Boot microservices, and relational ACID database consistency at high concurrency.',
    expertise: ['Java', 'DBMS', 'C'],
    followersCount: 14200,
    followingCount: 185,
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'user-5',
    name: 'Sophia Zhang',
    username: 'sophia_sec',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=faces',
    role: 'student',
    title: 'Cybersecurity Master\'s Candidate',
    institution: 'Carnegie Mellon University',
    bio: 'Penetration testing enthusiast and CTF player. Writing cheat sheets on memory safety, buffer overflows, and zero-trust security postures.',
    expertise: ['Cybersecurity', 'C', 'Python'],
    followersCount: 3890,
    followingCount: 412,
    isVerified: false,
    isFollowing: false,
  },
  {
    id: 'user-6',
    name: 'Devansh Patel',
    username: 'devansh_fullstack',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
    role: 'teacher_expert',
    title: 'Senior Frontend Tech Lead',
    institution: 'Open Web Foundation',
    bio: 'Crafting performant web architectures. Teaching modern React, TypeScript, web standards, and high-frame-rate rendering techniques.',
    expertise: ['Web Development', 'Python', 'Cloud Computing'],
    followersCount: 16780,
    followingCount: 510,
    isVerified: true,
    isFollowing: false,
  },
];

export const CURRENT_USER: User = {
  id: 'user-me',
  name: 'Karan Joshi',
  username: 'karan_j',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=faces',
  role: 'student',
  title: 'Full-Stack Learner & CS Student',
  institution: 'University School of Information Tech',
  bio: 'Learning full-stack development, distributed databases, and machine learning. Documenting weekly study notes and building peer projects.',
  expertise: ['Web Development', 'Python', 'DBMS'],
  followersCount: 342,
  followingCount: 158,
  isVerified: false,
  isFollowing: false,
};

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-1',
    author: INITIAL_USERS[0],
    title: 'Intuitive Guide to Attention Mechanisms & Scaled Dot-Product in PyTorch',
    content: `Many students struggle when first transitioning from Recurrent Neural Networks (RNNs) to Transformer Attention mechanisms. 

The core intuition: Instead of compressing an entire sequence into a single hidden vector bottleneck, Self-Attention allows each token to query every other token directly!

Key formula:
Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V

Here is a minimal, clean PyTorch implementation illustrating scaled dot-product attention without unnecessary framework abstractions. Notice how the scaling factor prevents the softmax gradients from vanishing in high dimensions:`,
    subject: 'AI/ML',
    difficulty: 'Intermediate',
    codeSnippet: {
      language: 'python',
      code: `import torch
import torch.nn.functional as F

def scaled_dot_product_attention(query, key, value, mask=None):
    """
    Computes Scaled Dot-Product Attention:
    Q, K: [batch_size, num_heads, seq_len, d_k]
    V:    [batch_size, num_heads, seq_len, d_v]
    """
    d_k = query.size(-1)
    # MatMul Q and K^T
    scores = torch.matmul(query, key.transpose(-2, -1)) / (d_k ** 0.5)
    
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
        
    attn_weights = F.softmax(scores, dim=-1)
    output = torch.matmul(attn_weights, value)
    return output, attn_weights

# Quick test with 1 batch, 4 heads, sequence length 8, dim 64:
q = torch.randn(1, 4, 8, 64)
k = torch.randn(1, 4, 8, 64)
v = torch.randn(1, 4, 8, 64)
out, weights = scaled_dot_product_attention(q, k, v)
print(f"Output shape: {out.shape}")  # [1, 4, 8, 64]`,
    },
    resourceUrl: 'https://github.com/karpathy/nanoGPT',
    resourceTitle: 'Transformer Architecture Interactive Colab & Code',
    resourceType: 'notes',
    tags: ['Attention', 'PyTorch', 'Transformers', 'DeepLearning'],
    media: {
      id: 'media-post-1',
      name: 'self_attention_matrix_diagram.png',
      originalName: 'self_attention_matrix_diagram.png',
      extension: 'png',
      mimeType: 'image/png',
      category: 'image',
      size: 491520,
      sizeFormatted: '480 KB',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      uploadedAt: '2 hours ago',
    },
    likesCount: 342,
    isLiked: false,
    commentsCount: 28,
    savesCount: 189,
    isSaved: true,
    sharesCount: 45,
    createdAt: '2 hours ago',
    isFeatured: true,
    comments: [
      {
        id: 'c-1',
        postId: 'post-1',
        author: INITIAL_USERS[2], // Priya
        content: 'Thank you Professor Vance! The explanation about why we divide by sqrt(d_k) to prevent softmax saturation made it click instantly.',
        createdAt: '1 hour ago',
        likes: 14,
        isLiked: false,
      },
      {
        id: 'c-2',
        postId: 'post-1',
        author: INITIAL_USERS[0], // Dr. Vance
        content: 'Spot on Priya! If d_k is large, the dot products grow huge in magnitude, pushing softmax into regions with near-zero gradients. The scaling factor keeps the variance stable at 1.',
        createdAt: '45 mins ago',
        likes: 22,
        isLiked: true,
        isVerifiedEducatorAnswer: true,
      },
    ],
  },
  {
    id: 'post-2',
    authorId: 'user-4',
    author: INITIAL_USERS[3],
    title: 'JVM Memory Tuning: Understanding ZGC vs G1GC for Ultra-Low Latency',
    content: `When building high-throughput financial or real-time enterprise services in Java, Garbage Collection pauses can cripple tail latency (p99).

For years G1GC was our default, dividing the heap into regions. But JDK 21+ Generational ZGC changes the game:
1. G1GC: Best for general purpose throughput; pause times typically 10ms - 200ms depending on heap size.
2. ZGC: Sub-millisecond pauses (under 1ms) even on massive heaps (up to 16 Terabytes!) via colored pointers and load barriers.

Here are the battle-tested JVM startup flags we use in high-frequency trading services:`,
    subject: 'Java',
    difficulty: 'Advanced',
    codeSnippet: {
      language: 'java',
      code: `# JVM Options for Modern Low-Latency Service (JDK 21+)
java -XX:+UseZGC \\
     -XX:+ZGenerational \\
     -Xms16g -Xmx16g \\
     -XX:+AlwaysPreTouch \\
     -XX:+UseNUMA \\
     -Xlog:gc*,gc+phases=debug:file=/var/log/app/gc.log:time,uptime,pid:filecount=5,filesize=100M \\
     -jar core-trading-service.jar`,
    },
    resourceUrl: 'https://openjdk.org/jeps/439',
    resourceTitle: 'JEP 439: Generational ZGC Official OpenJDK Spec',
    resourceType: 'article',
    tags: ['Java21', 'ZGC', 'Performance', 'GarbageCollection'],
    media: {
      id: 'media-post-2',
      name: 'jvm_zgc_architecture_tuning_handbook.pdf',
      originalName: 'jvm_zgc_architecture_tuning_handbook.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      category: 'pdf',
      size: 2516582,
      sizeFormatted: '2.4 MB',
      url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf',
      uploadedAt: '4 hours ago',
    },
    likesCount: 218,
    isLiked: true,
    commentsCount: 16,
    savesCount: 145,
    isSaved: false,
    sharesCount: 31,
    createdAt: '4 hours ago',
    isFeatured: true,
    comments: [
      {
        id: 'c-3',
        postId: 'post-2',
        author: INITIAL_USERS[1], // Marcus
        content: 'We noticed a 70% drop in p999 latency after enabling Generational ZGC on our Kubernetes clusters. The AlwaysPreTouch flag is crucial too to avoid OS page faults on initial requests.',
        createdAt: '3 hours ago',
        likes: 11,
      },
    ],
  },
  {
    id: 'post-3',
    authorId: 'user-2',
    author: INITIAL_USERS[1],
    title: 'Production Kubernetes Architecture: The Zero-Downtime Deployment Spec',
    content: `A simple 'kubectl rollout' is NOT zero-downtime unless you configure three critical guardrails:
1. Readiness Probes (ensure traffic is not routed before the app finishes warming up or connecting to DB).
2. PodDisruptionBudgets (PDB) so node drains cannot evict all replicas at once.
3. PreStop lifecycle hooks with graceful termination sleep to drain in-flight TCP connections from kube-proxy.

Save this production template for your upcoming cloud computing exam or DevOps interview!`,
    subject: 'Cloud Computing',
    difficulty: 'Intermediate',
    codeSnippet: {
      language: 'yaml',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 4
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: gateway
        image: company/gateway:v2.4
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"] # Let ingress drain
        readinessProbe:
          httpGet:
            path: /healthz/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 3
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: gateway-pdb
spec:
  minAvailable: 75%
  selector:
    matchLabels:
      app: api-gateway`,
    },
    resourceUrl: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/',
    resourceTitle: 'Official K8s Pod Lifecycle & Graceful Shutdown Documentation',
    resourceType: 'cheatsheet',
    likesCount: 489,
    isLiked: false,
    commentsCount: 39,
    savesCount: 312,
    isSaved: true,
    sharesCount: 92,
    createdAt: '7 hours ago',
    isFeatured: true,
    comments: [],
  },
  {
    id: 'post-4',
    authorId: 'user-3',
    author: INITIAL_USERS[2],
    title: 'C++ Modern STL: std::views and std::ranges Quick Cheat Sheet',
    content: `Studying for college DSA and modern C++ technical interviews? Stop writing verbose nested for-loops with raw iterators!

C++20 introduced std::ranges and std::views, which bring lazy, composable, zero-overhead pipeline transformations similar to Python generators or Rust iterators.

Here is a side-by-side comparison of filtering and squaring even numbers:`,
    subject: 'C++',
    difficulty: 'Beginner',
    codeSnippet: {
      language: 'cpp',
      code: `#include <iostream>
#include <vector>
#include <ranges>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Lazy evaluation pipeline: filter evens -> square them -> take top 3
    auto results = numbers 
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(3);

    for (int n : results) {
        std::cout << n << " "; // Output: 4 16 36
    }
    std::cout << std::endl;
    return 0;
}`,
    },
    resourceUrl: 'https://en.cppreference.com/w/cpp/ranges',
    resourceTitle: 'Modern C++20 Ranges & Algorithms Reference',
    resourceType: 'tutorial',
    tags: ['CPP20', 'Ranges', 'Algorithms', 'ModernCpp'],
    media: {
      id: 'media-post-4',
      name: 'modern_ranges_demo.cpp',
      originalName: 'modern_ranges_demo.cpp',
      extension: 'cpp',
      mimeType: 'text/x-c++src',
      category: 'code',
      size: 4920,
      sizeFormatted: '4.8 KB',
      url: 'blob:cpp-sample',
      codeContent: `#include <iostream>
#include <vector>
#include <ranges>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Lazy evaluation pipeline: filter evens -> square them -> take top 3
    auto results = numbers 
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(3);

    for (int n : results) {
        std::cout << n << " "; // Output: 4 16 36
    }
    std::cout << std::endl;
    return 0;
}`,
      uploadedAt: '12 hours ago',
    },
    likesCount: 195,
    isLiked: false,
    commentsCount: 14,
    savesCount: 167,
    isSaved: false,
    sharesCount: 19,
    createdAt: '12 hours ago',
    comments: [],
  },
  {
    id: 'post-5',
    authorId: 'user-5',
    author: INITIAL_USERS[4],
    title: 'Cybersecurity 101: Understanding Buffer Overflows & Stack Canaries in C',
    content: `Why is C memory safety still such a critical topic in 2026? 
Because vulnerable functions like strcpy(), gets(), or unchecked sprintf() write beyond the bounds of stack-allocated buffers.

When an attacker overflows the buffer, they overwrite the Function Return Address on the stack to redirect instruction execution (EIP/RIP) to arbitrary shellcode.

Modern compilers place a pseudo-random integer called a "Stack Canary" between local variables and the return pointer. If the canary is modified upon function return, __stack_chk_fail triggers an instant SIGABRT crash before attacker code runs.`,
    subject: 'Cybersecurity',
    difficulty: 'Intermediate',
    codeSnippet: {
      language: 'c',
      code: `// Secure vs Insecure string handling in C
#include <stdio.h>
#include <string.h>

void vulnerable_input(const char *user_data) {
    char buffer[64];
    // BAD: Unbounded memory copy leading to stack smashing
    // strcpy(buffer, user_data); 

    // GOOD: Explicit bounds check preventing buffer overflow
    strncpy(buffer, user_data, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\\0'; // Ensure null-termination
    
    printf("Processed input safely: %s\\n", buffer);
}`,
    },
    resourceUrl: 'https://owasp.org/www-community/attacks/Buffer_overflow_attack',
    resourceTitle: 'OWASP Guide to Buffer Overflow Vulnerabilities',
    resourceType: 'notes',
    likesCount: 310,
    isLiked: true,
    commentsCount: 22,
    savesCount: 204,
    isSaved: true,
    sharesCount: 38,
    createdAt: '1 day ago',
    comments: [],
  },
  {
    id: 'post-6',
    authorId: 'user-6',
    author: INITIAL_USERS[5],
    title: 'React 19 & Next.js: Understanding Actions, useOptimistic & Server States',
    content: `React 19 officially stabilizes native Actions and hooks like useActionState and useOptimistic.

Previously, handling optimistic UI updates required maintaining multiple parallel state variables, loading spinners, and rollback catch blocks.

Now, useOptimistic lets you update the screen immediately with expected data while the server mutation resolves in the background!`,
    subject: 'Web Development',
    difficulty: 'Intermediate',
    codeSnippet: {
      language: 'typescript',
      code: `import { useOptimistic, useState } from 'react';

type Note = { id: string; title: string; sending?: boolean };

export function NoteList({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  
  // Optimistic state wrapper:
  const [optimisticNotes, addOptimisticNote] = useOptimistic(
    notes,
    (state, newTitle: string) => [
      ...state,
      { id: 'temp-' + Date.now(), title: newTitle, sending: true }
    ]
  );

  async function handleAdd(formData: FormData) {
    const title = formData.get('title') as string;
    addOptimisticNote(title); // Instantly shows in UI
    const created = await api.createNote(title); // Network call
    setNotes(prev => [...prev, created]);
  }

  return (
    <div>
      {optimisticNotes.map(n => (
        <div key={n.id} className={n.sending ? 'opacity-50' : ''}>
          {n.title} {n.sending && '(Saving...)'}
        </div>
      ))}
    </div>
  );
}`,
    },
    resourceUrl: 'https://react.dev/reference/react/useOptimistic',
    resourceTitle: 'Official React Documentation: useOptimistic Hook Guide',
    resourceType: 'tutorial',
    likesCount: 421,
    isLiked: false,
    commentsCount: 33,
    savesCount: 280,
    isSaved: false,
    sharesCount: 64,
    createdAt: '1 day ago',
    comments: [],
  },
  {
    id: 'post-7',
    authorId: 'user-4',
    author: INITIAL_USERS[3],
    title: 'PostgreSQL Indexing Deep Dive: B-Tree vs Hash vs GIN Indexes with EXPLAIN ANALYZE',
    content: `Many developers slap 'CREATE INDEX' on columns blindly without checking query plans.

Here is a quick cheat sheet for DBMS students:
1. B-Tree (Default): Best for equality (=), range comparisons (<, <=, >, BETWEEN), and ORDER BY.
2. Hash: Faster than B-Tree for simple equality (=), but cannot do ranges or sorting.
3. GIN (Generalized Inverted Index): Essential for JSONB, Full-Text Search, and Array containment (e.g., tags @> ARRAY['java']).

Always run 'EXPLAIN (ANALYZE, BUFFERS)' to check if Postgres performs an 'Index Scan' or falls back to 'Seq Scan'!`,
    subject: 'DBMS',
    difficulty: 'Intermediate',
    codeSnippet: {
      language: 'sql',
      code: `-- 1. B-Tree Index for range queries on timestamp
CREATE INDEX idx_student_created ON students (created_at DESC);

-- 2. GIN Index on JSONB metadata column
CREATE INDEX idx_notes_metadata ON notes USING GIN (metadata jsonb_path_ops);

-- 3. Query using the JSONB GIN index
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM notes 
WHERE metadata @> '{"verified": true, "subject": "DBMS"}';`,
    },
    resourceUrl: 'https://www.postgresql.org/docs/current/indexes-types.html',
    resourceTitle: 'PostgreSQL Official Docs: Index Types & Performance',
    resourceType: 'cheatsheet',
    likesCount: 367,
    isLiked: false,
    commentsCount: 19,
    savesCount: 295,
    isSaved: true,
    sharesCount: 50,
    createdAt: '2 days ago',
    comments: [],
  },
  {
    id: 'post-8',
    authorId: 'user-1',
    author: INITIAL_USERS[0],
    title: 'Python Under The Hood: How Small Integers & String Interning Work',
    content: `Have you ever wondered why in Python:
>>> a = 256; b = 256; a is b  # Returns True!
>>> a = 257; b = 257; a is b  # Returns False!

CPython pre-allocates an array of integer objects for small integers in the range [-5, 256] during interpreter initialization. Whenever you create an int in that range, Python simply returns a pointer to the existing cached singleton rather than allocating new memory on the heap.

For educational demonstrations, inspect memory addresses using id():`,
    subject: 'Python',
    difficulty: 'Beginner',
    codeSnippet: {
      language: 'python',
      code: `# Python Interning Demo
x = 100
y = 100
print(f"x id: {id(x)}, y id: {id(y)}")
print("x is y:", x is y) # True (Same memory address in CPython small-int pool)

# Large integers:
large_1 = 10000
large_2 = 10000
print("large_1 is large_2:", large_1 is large_2) # False in interactive shell

# String interning for valid identifiers:
s1 = "hello_world"
s2 = "hello_world"
print("s1 is s2:", s1 is s2) # True (CPython interns identifier-like strings)`,
    },
    resourceUrl: 'https://docs.python.org/3/c-api/long.html',
    resourceTitle: 'CPython Internal Memory Architecture Guide',
    resourceType: 'tutorial',
    likesCount: 512,
    isLiked: true,
    commentsCount: 42,
    savesCount: 388,
    isSaved: false,
    sharesCount: 88,
    createdAt: '2 days ago',
    comments: [],
  },
  {
    id: 'post-9',
    authorId: 'user-3',
    author: INITIAL_USERS[2],
    title: 'C Memory Pointers Explained Visually: Arrays, Pointers to Pointers & Dynamic Allocation',
    content: `Pointers in C are simply variables that hold a memory address in hexadecimal format (e.g. 0x7ffee4b8).

Common beginner bugs to avoid:
1. Forgetting to free() allocated memory -> Memory leak.
2. Accessing memory after free() -> Dangling pointer (Use-After-Free).
3. Dereferencing NULL or uninitialized pointer -> Segmentation fault (SIGSEGV).

Here is a clean example of allocating a 2D matrix dynamically in C and properly freeing it in reverse order:`,
    subject: 'C',
    difficulty: 'Beginner',
    codeSnippet: {
      language: 'c',
      code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int rows = 3, cols = 4;
    // Step 1: Allocate array of pointer rows
    int **matrix = (int **)malloc(rows * sizeof(int *));
    if (!matrix) return 1;

    // Step 2: Allocate each row
    for (int i = 0; i < rows; i++) {
        matrix[i] = (int *)malloc(cols * sizeof(int));
    }

    // Step 3: Populate
    matrix[1][2] = 42;
    printf("Value at [1][2]: %d\\n", matrix[1][2]);

    // Step 4: Clean up in reverse order to avoid dangling pointers
    for (int i = 0; i < rows; i++) {
        free(matrix[i]);
    }
    free(matrix);
    matrix = NULL; // Best practice
    return 0;
}`,
    },
    resourceUrl: 'https://en.cppreference.com/w/c/memory/malloc',
    resourceTitle: 'C Dynamic Memory Management & Pointer Rules',
    resourceType: 'notes',
    likesCount: 278,
    isLiked: false,
    commentsCount: 18,
    savesCount: 230,
    isSaved: true,
    sharesCount: 27,
    createdAt: '3 days ago',
    comments: [],
  },
];

export const CATEGORIES_META: Record<SubjectCategory, CategoryMeta> = {
  Java: {
    name: 'Java',
    shortDesc: 'Enterprise systems, JVM internals, Spring Boot, and Android foundation.',
    longDesc: 'From Object-Oriented principles and Collections Framework to low-latency JVM garbage collectors, Concurrency, and Spring Boot microservices.',
    iconName: 'Coffee',
    color: '#EA580C',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    topicsCount: 1420,
    resourcesCount: 480,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Core Fundamentals',
        items: ['Syntax & Primitive Types', 'OOP: Inheritance, Polymorphism, Abstraction', 'Exception Handling', 'Collections: ArrayList, HashMap, Set'],
      },
      {
        level: 'Intermediate',
        title: 'JVM & Concurrency',
        items: ['Java Streams & Lambdas', 'Threads, ExecutorService, Locks', 'Generics & Type Erasure', 'JDBC & Hibernate ORM'],
      },
      {
        level: 'Advanced',
        title: 'High-Scale Backend',
        items: ['Spring Boot Microservices', 'JVM Garbage Collection (ZGC/G1GC)', 'Bytecode Engineering & JIT Compiler', 'Reactive Java with Project Reactor'],
      },
    ],
  },
  Python: {
    name: 'Python',
    shortDesc: 'Data science, Machine Learning, backend APIs, and automation scripts.',
    longDesc: 'Versatile, readable, and powerful. Explore clean Pythonic idioms, async programming with FastAPI, data manipulation with Pandas, and PyTorch deep learning.',
    iconName: 'Terminal',
    color: '#0284C7',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    topicsCount: 2310,
    resourcesCount: 890,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Pythonic Syntax',
        items: ['Data Types, Lists, Dicts, Sets', 'Functions, *args, **kwargs', 'File I/O and Context Managers (with)', 'Error Handling and Debugging'],
      },
      {
        level: 'Intermediate',
        title: 'Software Development',
        items: ['Generators, Iterators, and Decorators', 'Object-Oriented Python & Dunder Methods', 'Asyncio & FastAPIs', 'Packaging, Virtual Envs, & PyTest'],
      },
      {
        level: 'Advanced',
        title: 'Data & Systems',
        items: ['CPython Internals, Memory & GIL', 'Data Engineering with Polars/Pandas', 'Custom PyTorch Layers & Autograd', 'Cython / C Extensions for Speed'],
      },
    ],
  },
  C: {
    name: 'C',
    shortDesc: 'Operating systems, memory management, low-level drivers, and embedded systems.',
    longDesc: 'The mother of modern languages. Learn exact hardware memory control, pointer arithmetic, struct alignments, system calls, and zero-overhead performance.',
    iconName: 'Cpu',
    color: '#475569',
    bgLight: 'bg-slate-100',
    borderLight: 'border-slate-300',
    topicsCount: 980,
    resourcesCount: 320,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Basics & Syntax',
        items: ['Variables, Loops, and Control Flow', 'Functions and Stack Frames', 'Arrays and Strings in Memory', 'Basic Pointer Arithmetic'],
      },
      {
        level: 'Intermediate',
        title: 'Dynamic Memory & Data Structures',
        items: ['malloc, calloc, realloc, and free', 'Linked Lists, Trees, and Hash Tables in C', 'Structs, Unions, and Bitfields', 'Header Files and GCC Preprocessor'],
      },
      {
        level: 'Advanced',
        title: 'Systems & OS Programming',
        items: ['POSIX System Calls (fork, pipe, exec)', 'Thread Safety with pthreads', 'Custom Memory Allocators', 'Kernel Modules and Driver Architecture'],
      },
    ],
  },
  'C++': {
    name: 'C++',
    shortDesc: 'Game engines, competitive programming, high-frequency finance, and performance systems.',
    longDesc: 'Zero-cost abstractions, deterministic destructors (RAII), modern template metaprogramming, and C++20/23 concepts and ranges.',
    iconName: 'Binary',
    color: '#2563EB',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    topicsCount: 1650,
    resourcesCount: 610,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Core C++ & OOP',
        items: ['References vs Pointers', 'RAII & Class Constructors/Destructors', 'Operator Overloading', 'Standard Library (std::vector, std::string)'],
      },
      {
        level: 'Intermediate',
        title: 'Standard Template Library (STL)',
        items: ['std::map, unordered_map, priority_queue', 'Smart Pointers (unique_ptr, shared_ptr)', 'Move Semantics & rvalue references', 'Lambda Expressions & std::function'],
      },
      {
        level: 'Advanced',
        title: 'Modern C++20/23 & Metaprogramming',
        items: ['Templates, SFINAE, and Concepts', 'std::ranges and Views Pipeline', 'Concurrency: atomics, memory models', 'High-Performance Cache-Friendly Structures'],
      },
    ],
  },
  'AI/ML': {
    name: 'AI/ML',
    shortDesc: 'Deep learning, LLMs, computer vision, neural transformers, and PyTorch research.',
    longDesc: 'From linear algebra and gradient descent to self-attention mechanisms, diffusion models, fine-tuning, and scalable inference deployment.',
    iconName: 'Sparkles',
    color: '#7C3AED',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    topicsCount: 3120,
    resourcesCount: 1240,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Foundations & Math',
        items: ['Linear Algebra (Vectors, Matrices, Dot Products)', 'Calculus & Gradient Descent', 'Scikit-Learn Regression & Classification', 'Data Preprocessing & Evaluation Metrics'],
      },
      {
        level: 'Intermediate',
        title: 'Deep Learning & PyTorch',
        items: ['Multi-Layer Perceptrons & Backpropagation', 'Convolutional Networks (CNNs) for Vision', 'Recurrent Nets (LSTMs) & Attention', 'Embeddings & Vector Databases'],
      },
      {
        level: 'Advanced',
        title: 'Transformers, LLMs & Multi-Modal',
        items: ['Self-Attention & Transformer Architecture', 'Pre-training & LoRA Fine-Tuning', 'Diffusion Models & Generative AI', 'Model Quantization (GGUF, AWQ, vLLM)'],
      },
    ],
  },
  'Web Development': {
    name: 'Web Development',
    shortDesc: 'Full-stack engineering, React, TypeScript, Node.js, and modern CSS.',
    longDesc: 'Master modern frontend UI frameworks, responsive design, Server-Side Rendering (SSR), REST/GraphQL APIs, and high-performance client rendering.',
    iconName: 'Globe',
    color: '#0D9488',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    topicsCount: 2840,
    resourcesCount: 1150,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Web Standards',
        items: ['Semantic HTML5 & Accessibility (a11y)', 'Modern CSS: Flexbox, Grid, Responsive Design', 'JavaScript ES6+: Promises, Async/Await', 'DOM Manipulation and Fetch API'],
      },
      {
        level: 'Intermediate',
        title: 'Component Frameworks',
        items: ['React 19 Hooks & State Management', 'TypeScript Generics & Strong Typing', 'Tailwind CSS Design Systems', 'RESTful APIs with Node.js & Express'],
      },
      {
        level: 'Advanced',
        title: 'Full-Stack Architecture',
        items: ['Next.js App Router & Server Components', 'WebSockets & Real-Time Collaboration', 'Performance Auditing & Core Web Vitals', 'Testing with Vitest, Jest, & Playwright'],
      },
    ],
  },
  DBMS: {
    name: 'DBMS',
    shortDesc: 'Relational databases, SQL queries, indexing, transactions, and NoSQL engines.',
    longDesc: 'Understand ACID guarantees, execution plan optimization, B-Tree and GIN indexes, schema normalization, and distributed database sharding.',
    iconName: 'Database',
    color: '#0369A1',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    topicsCount: 1220,
    resourcesCount: 430,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Relational Concepts & SQL',
        items: ['Entity-Relationship Diagrams (ERD)', 'DDL & DML (SELECT, JOIN, GROUP BY)', 'Primary, Foreign, and Unique Keys', 'Schema Normalization (1NF, 2NF, 3NF, BCNF)'],
      },
      {
        level: 'Intermediate',
        title: 'Performance & Architecture',
        items: ['B-Tree, Hash, and GIN Indexing', 'EXPLAIN ANALYZE Execution Plans', 'ACID Transactions & Isolation Levels (MVCC)', 'Stored Procedures, Triggers, & Views'],
      },
      {
        level: 'Advanced',
        title: 'Distributed Data Systems',
        items: ['Database Sharding & Replication Topologies', 'CAP Theorem & Eventual Consistency', 'Distributed Consensus (Raft/Paxos)', 'Vector Databases for AI Search'],
      },
    ],
  },
  'Cloud Computing': {
    name: 'Cloud Computing',
    shortDesc: 'AWS, Docker containers, Kubernetes clusters, CI/CD pipelines, and Terraform.',
    longDesc: 'Architect elastic, resilient infrastructure. Master containerization with Docker, orchestration with Kubernetes, and Infrastructure as Code with Terraform.',
    iconName: 'Cloud',
    color: '#4F46E5',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    topicsCount: 1750,
    resourcesCount: 670,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Cloud Foundations',
        items: ['IaaS vs PaaS vs SaaS Concepts', 'Compute Instances & Virtual Private Clouds (VPC)', 'Object Storage (S3 / Cloud Storage)', 'Basic Linux Administration & SSH'],
      },
      {
        level: 'Intermediate',
        title: 'Containers & Automation',
        items: ['Dockerizing Microservices & Multi-Stage Builds', 'CI/CD Pipelines (GitHub Actions / GitLab)', 'Infrastructure as Code with Terraform', 'Serverless Functions & Event-Driven Architecture'],
      },
      {
        level: 'Advanced',
        title: 'Kubernetes & Site Reliability',
        items: ['Kubernetes: Deployments, Services, Ingress, PDB', 'Service Mesh (Istio / Linkerd)', 'Observability: Prometheus, Grafana, OpenTelemetry', 'Multi-Region High Availability & Disaster Recovery'],
      },
    ],
  },
  Cybersecurity: {
    name: 'Cybersecurity',
    shortDesc: 'Network defense, cryptography, penetration testing, and secure coding.',
    longDesc: 'Learn offensive and defensive security. Explore OWASP Top 10 vulnerabilities, asymmetric cryptography, reverse engineering, and threat modeling.',
    iconName: 'ShieldCheck',
    color: '#BE123C',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    topicsCount: 1390,
    resourcesCount: 520,
    roadmap: [
      {
        level: 'Beginner',
        title: 'Security Foundations',
        items: ['Networking Protocols: TCP/IP, DNS, TLS/SSL', 'Symmetric & Asymmetric Encryption Basics', 'Authentication & Passwords (Hashing, Salting, 2FA)', 'Phishing & Social Engineering Defense'],
      },
      {
        level: 'Intermediate',
        title: 'Application & Web Security',
        items: ['OWASP Top 10 (SQLi, XSS, CSRF, SSRF)', 'Penetration Testing Tools (Burp Suite, Nmap, Wireshark)', 'Secure Coding in Python and C', 'Linux Privilege Escalation & CTF Basics'],
      },
      {
        level: 'Advanced',
        title: 'Enterprise Defense & Research',
        items: ['Binary Exploitation & Buffer Overflows', 'Zero Trust Architecture & Identity Federation', 'Cloud Security Posture Management (CSPM)', 'Malware Analysis & Reverse Engineering'],
      },
    ],
  },
};

export const POPULAR_SUBJECTS: SubjectCategory[] = [
  'Java',
  'Python',
  'C',
  'C++',
  'AI/ML',
  'Web Development',
  'DBMS',
  'Cloud Computing',
  'Cybersecurity',
];

export const INITIAL_REPORTS = [
  {
    id: 'rep-1',
    postId: 'post-1',
    reportedBy: 'student_99',
    reason: 'Outdated package version in example code',
    timestamp: 'Yesterday at 14:20',
    status: 'pending' as const,
  },
  {
    id: 'rep-2',
    postId: 'post-5',
    reportedBy: 'learner_cs',
    reason: 'Clarification needed on buffer overflow compiler flags',
    timestamp: '2 days ago',
    status: 'pending' as const,
  },
];
