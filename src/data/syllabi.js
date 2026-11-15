// Ready-made topic lists. Adding one creates a normal subject that the user
// can then edit like any other.
export const SYLLABI = [
  {
    key: 'dsa',
    name: 'Data Structures and Algorithms',
    blurb: 'The core of almost every coding round',
    topics: [
      'Time and space complexity', 'Arrays and prefix sums', 'Two pointers', 'Sliding window',
      'Strings and pattern matching', 'Hashing (maps and sets)', 'Sorting algorithms', 'Binary search',
      'Binary search on answer', 'Recursion', 'Backtracking', 'Linked lists', 'Stacks',
      'Monotonic stack', 'Queues and deques', 'Binary trees and traversals', 'Binary search trees',
      'Heaps and priority queues', 'Tries', 'Graph representation', 'BFS and DFS', 'Topological sort',
      'Shortest paths (Dijkstra, Bellman-Ford)', 'Minimum spanning tree', 'Union-find',
      'Greedy algorithms', 'Dynamic programming: 1D', 'Dynamic programming: 2D and grids',
      'Dynamic programming: subsequences (LIS, LCS)', 'Knapsack patterns', 'Bit manipulation',
      'Intervals and line sweep', 'Math and number theory basics',
    ],
  },
  {
    key: 'os',
    name: 'Operating Systems',
    blurb: 'Processes, memory and concurrency',
    topics: [
      'Process vs thread', 'Process states and PCB', 'Context switching', 'CPU scheduling algorithms',
      'Inter-process communication', 'Race conditions and critical section', 'Mutex and semaphores',
      'Classic synchronisation problems', 'Deadlock: conditions and handling', 'Banker\'s algorithm',
      'Memory management and fragmentation', 'Paging and segmentation', 'Virtual memory and demand paging',
      'Page replacement algorithms', 'Thrashing', 'File systems and inodes', 'Disk scheduling',
      'System calls and kernel modes',
    ],
  },
  {
    key: 'dbms',
    name: 'DBMS',
    blurb: 'SQL, design and transactions',
    topics: [
      'ER model and relational model', 'Keys (primary, candidate, foreign)', 'SQL: SELECT, WHERE, ORDER BY',
      'SQL: joins', 'SQL: GROUP BY and HAVING', 'SQL: subqueries and CTEs', 'SQL: window functions',
      'Normalisation (1NF to BCNF)', 'Functional dependencies', 'Transactions and ACID',
      'Isolation levels and anomalies', 'Concurrency control and locking', 'Indexing and B+ trees',
      'Query optimisation basics', 'Views, triggers and stored procedures', 'SQL vs NoSQL',
      'CAP theorem', 'Sharding and replication',
    ],
  },
  {
    key: 'cn',
    name: 'Computer Networks',
    blurb: 'How data gets from A to B',
    topics: [
      'OSI and TCP/IP models', 'IP addressing and subnetting', 'ARP and MAC addresses', 'Routing basics',
      'TCP vs UDP', 'TCP handshake and termination', 'Flow and congestion control', 'DNS',
      'HTTP and HTTPS', 'HTTP methods and status codes', 'TLS handshake', 'What happens when you type a URL',
      'Sockets', 'NAT and DHCP', 'Load balancers and proxies', 'Cookies, sessions and tokens',
    ],
  },
  {
    key: 'oops',
    name: 'Object-Oriented Programming',
    blurb: 'Asked in nearly every technical interview',
    topics: [
      'Classes and objects', 'Encapsulation', 'Abstraction', 'Inheritance and its types',
      'Polymorphism: overloading vs overriding', 'Abstract classes vs interfaces',
      'Constructors and destructors', 'Access modifiers', 'Static members', 'Virtual functions and vtables',
      'Composition vs inheritance', 'Exception handling', 'SOLID principles',
      'Common design patterns (singleton, factory, observer)',
    ],
  },
  {
    key: 'aptitude',
    name: 'Aptitude',
    blurb: 'For online assessments',
    topics: [
      'Percentages', 'Profit and loss', 'Ratio and proportion', 'Time and work', 'Time, speed and distance',
      'Simple and compound interest', 'Averages and mixtures', 'Permutations and combinations',
      'Probability', 'Number series', 'Blood relations and directions', 'Seating arrangements',
      'Syllogisms', 'Data interpretation', 'Reading comprehension',
    ],
  },
  {
    key: 'system-design',
    name: 'System Design Basics',
    blurb: 'Useful for product companies',
    topics: [
      'Client-server and request flow', 'Vertical vs horizontal scaling', 'Load balancing', 'Caching strategies',
      'CDNs', 'SQL vs NoSQL trade-offs', 'Database indexing and replication', 'Sharding and consistent hashing',
      'Message queues', 'REST API design', 'Rate limiting', 'Design a URL shortener',
    ],
  },
];
