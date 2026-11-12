import { cppLanguage } from '@codemirror/lang-cpp';
import { LanguageSupport } from '@codemirror/language';
import { snippetCompletion, snippet } from '@codemirror/autocomplete';

/**
 * ---------------------------------------------------------------------------
 * C++ & C IntelliSense Autocomplete Engine for CodeMirror 6
 * ---------------------------------------------------------------------------
 * Provides intelligent, context-aware suggestions for:
 * 1. Standard library headers (#include <...)
 * 2. Template parameters (vector<...)
 * 3. Namespace std:: members (std::...)
 * 4. Member methods on containers & strings (arr. / v. / s. / ptr->)
 * 5. STL algorithm usage & parameter assistance (sort(...)
 * 6. Built-in functions, keywords, and code snippets
 * ---------------------------------------------------------------------------
 */

// ── 1. Standard C++ Headers ──
const CPP_HEADERS = [
  { label: 'iostream', detail: '<iostream> Stream I/O (cin, cout, cerr)', type: 'class' },
  { label: 'vector', detail: '<vector> Dynamic resizable array container', type: 'class' },
  { label: 'string', detail: '<string> String class and character traits', type: 'class' },
  { label: 'algorithm', detail: '<algorithm> STL sort, search, min/max algorithms', type: 'class' },
  { label: 'cmath', detail: '<cmath> Math functions (sqrt, pow, abs, floor)', type: 'class' },
  { label: 'map', detail: '<map> Ordered key-value associative map (RB-tree)', type: 'class' },
  { label: 'unordered_map', detail: '<unordered_map> Hash map with average O(1) lookup', type: 'class' },
  { label: 'set', detail: '<set> Ordered collection of unique keys (RB-tree)', type: 'class' },
  { label: 'unordered_set', detail: '<unordered_set> Hash set of unique keys', type: 'class' },
  { label: 'queue', detail: '<queue> FIFO queue and priority_queue heap', type: 'class' },
  { label: 'stack', detail: '<stack> LIFO stack adapter', type: 'class' },
  { label: 'deque', detail: '<deque> Double-ended queue', type: 'class' },
  { label: 'numeric', detail: '<numeric> Numeric algorithms (accumulate, iota, gcd)', type: 'class' },
  { label: 'climits', detail: '<climits> C-style limits (INT_MAX, INT_MIN)', type: 'class' },
  { label: 'cstring', detail: '<cstring> C-string utilities (memset, memcpy)', type: 'class' },
  { label: 'cstdio', detail: '<cstdio> C-style standard I/O (printf, scanf)', type: 'class' },
  { label: 'cstdlib', detail: '<cstdlib> General utilities (malloc, free, rand)', type: 'class' },
  { label: 'utility', detail: '<utility> std::pair, std::move, std::swap', type: 'class' },
  { label: 'tuple', detail: '<tuple> Heterogeneous fixed-size collection', type: 'class' },
  { label: 'iomanip', detail: '<iomanip> Stream formatting (setprecision, setw)', type: 'class' },
  { label: 'sstream', detail: '<sstream> String stream processing', type: 'class' },
  { label: 'cassert', detail: '<cassert> Runtime assertion checks', type: 'class' },
  { label: 'cctype', detail: '<cctype> Character classification (isalpha, isdigit)', type: 'class' },
  { label: 'bitset', detail: '<bitset> Fixed-size sequence of N bits', type: 'class' },
  { label: 'functional', detail: '<functional> Function objects (greater, less, hash)', type: 'class' },
  { label: 'limits', detail: '<limits> std::numeric_limits<T>', type: 'class' },
  { label: 'memory', detail: '<memory> Smart pointers (unique_ptr, shared_ptr)', type: 'class' },
  { label: 'bits/stdc++.h', detail: '<bits/stdc++.h> All-in-one competitive programming header', type: 'class' },
];

// ── 2. Standard C Headers ──
const C_HEADERS = [
  { label: 'stdio.h', detail: '<stdio.h> Standard input/output (printf, scanf)', type: 'class' },
  { label: 'stdlib.h', detail: '<stdlib.h> Memory allocation & utilities (malloc, free)', type: 'class' },
  { label: 'string.h', detail: '<string.h> String manipulation (strlen, strcpy, memset)', type: 'class' },
  { label: 'math.h', detail: '<math.h> Mathematical library (sqrt, pow, abs)', type: 'class' },
  { label: 'limits.h', detail: '<limits.h> Type bounds (INT_MAX, INT_MIN)', type: 'class' },
  { label: 'stdbool.h', detail: '<stdbool.h> Boolean type (bool, true, false)', type: 'class' },
  { label: 'ctype.h', detail: '<ctype.h> Character functions (isalpha, isdigit)', type: 'class' },
  { label: 'assert.h', detail: '<assert.h> Runtime assertion checks', type: 'class' },
  { label: 'time.h', detail: '<time.h> Time manipulation and clock functions', type: 'class' },
  { label: 'stddef.h', detail: '<stddef.h> Standard definitions (size_t, NULL)', type: 'class' },
];

// ── 3. Common Template Types ──
const TEMPLATE_TYPES = [
  { label: 'int', detail: '32-bit signed integer', type: 'type', boost: 20 },
  { label: 'long long', detail: '64-bit signed integer', type: 'type', boost: 19 },
  { label: 'string', detail: 'std::string', type: 'type', boost: 18 },
  { label: 'double', detail: 'Double precision floating-point', type: 'type', boost: 17 },
  { label: 'float', detail: 'Single precision floating-point', type: 'type', boost: 16 },
  { label: 'char', detail: 'Character type', type: 'type', boost: 15 },
  { label: 'bool', detail: 'Boolean type', type: 'type', boost: 14 },
  { label: 'vector<int>', detail: '1D vector of integers', type: 'type', boost: 13 },
  { label: 'vector<string>', detail: '1D vector of strings', type: 'type', boost: 12 },
  { label: 'vector<vector<int>>', detail: '2D integer matrix', type: 'type', boost: 11 },
  { label: 'pair<int, int>', detail: 'Pair of integers', type: 'type', boost: 10 },
  { label: 'pair<int, string>', detail: 'Pair of integer and string', type: 'type', boost: 9 },
  { label: 'pair<string, int>', detail: 'Pair of string and integer', type: 'type', boost: 8 },
  { label: 'pair<long long, long long>', detail: 'Pair of 64-bit integers', type: 'type', boost: 7 },
];

// ── 4. Method Definitions by Container ──
const VECTOR_METHODS = [
  { label: 'push_back', detail: 'push_back(const T& val)', type: 'method', info: 'Appends an element to the end of the vector.', apply: snippet('push_back(${1:val})'), boost: 25 },
  { label: 'pop_back', detail: 'pop_back()', type: 'method', info: 'Removes the last element from the vector.', apply: 'pop_back()', boost: 24 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns the number of elements in the vector.', apply: 'size()', boost: 23 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether the vector is empty.', apply: 'empty()', boost: 22 },
  { label: 'clear', detail: 'void clear()', type: 'method', info: 'Removes all elements from the vector.', apply: 'clear()', boost: 21 },
  { label: 'begin', detail: 'iterator begin()', type: 'method', info: 'Returns an iterator to the first element.', apply: 'begin()', boost: 20 },
  { label: 'end', detail: 'iterator end()', type: 'method', info: 'Returns an iterator to the element past the end.', apply: 'end()', boost: 19 },
  { label: 'front', detail: 'reference front()', type: 'method', info: 'Accesses the first element.', apply: 'front()', boost: 18 },
  { label: 'back', detail: 'reference back()', type: 'method', info: 'Accesses the last element.', apply: 'back()', boost: 17 },
  { label: 'insert', detail: 'insert(pos, val)', type: 'method', info: 'Inserts elements at the specified position.', apply: snippet('insert(${1:pos}, ${2:val})'), boost: 16 },
  { label: 'erase', detail: 'erase(pos)', type: 'method', info: 'Erases elements at the specified position or range.', apply: snippet('erase(${1:pos})'), boost: 15 },
  { label: 'emplace_back', detail: 'emplace_back(args...)', type: 'method', info: 'Constructs an element in-place at the end.', apply: snippet('emplace_back(${1:args})'), boost: 14 },
  { label: 'resize', detail: 'void resize(size_t n)', type: 'method', info: 'Resizes the vector to contain n elements.', apply: snippet('resize(${1:n})'), boost: 13 },
  { label: 'reserve', detail: 'void reserve(size_t n)', type: 'method', info: 'Reserves storage capacity for at least n elements.', apply: snippet('reserve(${1:n})'), boost: 12 },
  { label: 'at', detail: 'reference at(size_t pos)', type: 'method', info: 'Accesses element with bounds checking.', apply: snippet('at(${1:index})'), boost: 11 },
  { label: 'rbegin', detail: 'reverse_iterator rbegin()', type: 'method', info: 'Returns a reverse iterator to the beginning of reversed vector.', apply: 'rbegin()', boost: 10 },
  { label: 'rend', detail: 'reverse_iterator rend()', type: 'method', info: 'Returns a reverse iterator to the end of reversed vector.', apply: 'rend()', boost: 9 },
  { label: 'data', detail: 'T* data()', type: 'method', info: 'Returns pointer to the underlying contiguous array.', apply: 'data()', boost: 8 },
  { label: 'assign', detail: 'void assign(count, val)', type: 'method', info: 'Replaces contents with count copies of val.', apply: snippet('assign(${1:count}, ${2:val})'), boost: 7 },
  { label: 'shrink_to_fit', detail: 'void shrink_to_fit()', type: 'method', info: 'Reduces memory usage by freeing unused capacity.', apply: 'shrink_to_fit()', boost: 6 },
];

const STRING_METHODS = [
  { label: 'length', detail: 'size_t length() const', type: 'method', info: 'Returns the number of characters in the string.', apply: 'length()', boost: 25 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns the number of characters in the string.', apply: 'size()', boost: 24 },
  { label: 'substr', detail: 'string substr(pos, len)', type: 'method', info: 'Returns substring starting at pos of given length.', apply: snippet('substr(${1:pos}, ${2:len})'), boost: 23 },
  { label: 'find', detail: 'size_t find(str, pos)', type: 'method', info: 'Finds the first occurrence of substring or character.', apply: snippet('find(${1:str})'), boost: 22 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether the string is empty.', apply: 'empty()', boost: 21 },
  { label: 'clear', detail: 'void clear()', type: 'method', info: 'Clears the string contents.', apply: 'clear()', boost: 20 },
  { label: 'push_back', detail: 'push_back(char ch)', type: 'method', info: 'Appends a character to the string.', apply: snippet('push_back(${1:ch})'), boost: 19 },
  { label: 'pop_back', detail: 'pop_back()', type: 'method', info: 'Removes the last character from the string.', apply: 'pop_back()', boost: 18 },
  { label: 'c_str', detail: 'const char* c_str() const', type: 'method', info: 'Returns pointer to a null-terminated C string array.', apply: 'c_str()', boost: 17 },
  { label: 'front', detail: 'char& front()', type: 'method', info: 'Accesses the first character.', apply: 'front()', boost: 16 },
  { label: 'back', detail: 'char& back()', type: 'method', info: 'Accesses the last character.', apply: 'back()', boost: 15 },
  { label: 'begin', detail: 'iterator begin()', type: 'method', info: 'Returns an iterator to the beginning.', apply: 'begin()', boost: 14 },
  { label: 'end', detail: 'iterator end()', type: 'method', info: 'Returns an iterator to the end.', apply: 'end()', boost: 13 },
  { label: 'insert', detail: 'insert(pos, str)', type: 'method', info: 'Inserts characters at given position.', apply: snippet('insert(${1:pos}, ${2:str})'), boost: 12 },
  { label: 'erase', detail: 'erase(pos, len)', type: 'method', info: 'Erases characters from the string.', apply: snippet('erase(${1:pos}, ${2:len})'), boost: 11 },
  { label: 'replace', detail: 'replace(pos, len, str)', type: 'method', info: 'Replaces part of the string with another string.', apply: snippet('replace(${1:pos}, ${2:len}, ${3:str})'), boost: 10 },
  { label: 'append', detail: 'append(str)', type: 'method', info: 'Appends characters to the string.', apply: snippet('append(${1:str})'), boost: 9 },
  { label: 'compare', detail: 'int compare(str)', type: 'method', info: 'Lexicographically compares two strings.', apply: snippet('compare(${1:str})'), boost: 8 },
  { label: 'rfind', detail: 'size_t rfind(str)', type: 'method', info: 'Finds the last occurrence of substring.', apply: snippet('rfind(${1:str})'), boost: 7 },
];

const MAP_METHODS = [
  { label: 'insert', detail: 'insert({key, val})', type: 'method', info: 'Inserts key-value pair into the map.', apply: snippet('insert({${1:key}, ${2:val}})'), boost: 25 },
  { label: 'find', detail: 'iterator find(key)', type: 'method', info: 'Finds an element with key. Returns end() if not found.', apply: snippet('find(${1:key})'), boost: 24 },
  { label: 'count', detail: 'size_t count(key)', type: 'method', info: 'Returns 1 if key exists, 0 otherwise.', apply: snippet('count(${1:key})'), boost: 23 },
  { label: 'erase', detail: 'erase(key)', type: 'method', info: 'Removes elements with specific key or iterator.', apply: snippet('erase(${1:key})'), boost: 22 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns number of key-value pairs.', apply: 'size()', boost: 21 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether map is empty.', apply: 'empty()', boost: 20 },
  { label: 'clear', detail: 'void clear()', type: 'method', info: 'Removes all elements from the map.', apply: 'clear()', boost: 19 },
  { label: 'begin', detail: 'iterator begin()', type: 'method', info: 'Returns an iterator to the first element.', apply: 'begin()', boost: 18 },
  { label: 'end', detail: 'iterator end()', type: 'method', info: 'Returns an iterator to the end.', apply: 'end()', boost: 17 },
  { label: 'contains', detail: 'bool contains(key) const', type: 'method', info: 'Checks if container has element with key (C++20).', apply: snippet('contains(${1:key})'), boost: 16 },
  { label: 'lower_bound', detail: 'iterator lower_bound(key)', type: 'method', info: 'Returns iterator to first element not less than key.', apply: snippet('lower_bound(${1:key})'), boost: 15 },
  { label: 'upper_bound', detail: 'iterator upper_bound(key)', type: 'method', info: 'Returns iterator to first element greater than key.', apply: snippet('upper_bound(${1:key})'), boost: 14 },
  { label: 'emplace', detail: 'emplace(key, val)', type: 'method', info: 'Constructs element in-place.', apply: snippet('emplace(${1:key}, ${2:val})'), boost: 13 },
  { label: 'at', detail: 'mapped_type& at(key)', type: 'method', info: 'Accesses element with bounds check.', apply: snippet('at(${1:key})'), boost: 12 },
];

const SET_METHODS = [
  { label: 'insert', detail: 'pair<iterator, bool> insert(val)', type: 'method', info: 'Inserts element into the set.', apply: snippet('insert(${1:val})'), boost: 25 },
  { label: 'find', detail: 'iterator find(val)', type: 'method', info: 'Finds an element in the set.', apply: snippet('find(${1:val})'), boost: 24 },
  { label: 'count', detail: 'size_t count(val)', type: 'method', info: 'Returns 1 if element exists, 0 otherwise.', apply: snippet('count(${1:val})'), boost: 23 },
  { label: 'erase', detail: 'erase(val)', type: 'method', info: 'Removes element with specific value or at iterator.', apply: snippet('erase(${1:val})'), boost: 22 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns the number of elements in the set.', apply: 'size()', boost: 21 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether the set is empty.', apply: 'empty()', boost: 20 },
  { label: 'clear', detail: 'void clear()', type: 'method', info: 'Removes all elements from the set.', apply: 'clear()', boost: 19 },
  { label: 'begin', detail: 'iterator begin()', type: 'method', info: 'Returns iterator to the first element.', apply: 'begin()', boost: 18 },
  { label: 'end', detail: 'iterator end()', type: 'method', info: 'Returns iterator to past-the-end.', apply: 'end()', boost: 17 },
  { label: 'contains', detail: 'bool contains(val) const', type: 'method', info: 'Checks if set contains element (C++20).', apply: snippet('contains(${1:val})'), boost: 16 },
  { label: 'lower_bound', detail: 'iterator lower_bound(val)', type: 'method', info: 'Returns iterator to first element not less than val.', apply: snippet('lower_bound(${1:val})'), boost: 15 },
  { label: 'upper_bound', detail: 'iterator upper_bound(val)', type: 'method', info: 'Returns iterator to first element greater than val.', apply: snippet('upper_bound(${1:val})'), boost: 14 },
  { label: 'emplace', detail: 'emplace(val)', type: 'method', info: 'Inserts element in-place.', apply: snippet('emplace(${1:val})'), boost: 13 },
];

const STACK_METHODS = [
  { label: 'push', detail: 'void push(const T& val)', type: 'method', info: 'Pushes an element onto the top of the stack.', apply: snippet('push(${1:val})'), boost: 25 },
  { label: 'pop', detail: 'void pop()', type: 'method', info: 'Removes the top element from the stack.', apply: 'pop()', boost: 24 },
  { label: 'top', detail: 'reference top()', type: 'method', info: 'Accesses the top element of the stack.', apply: 'top()', boost: 23 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns the number of elements in the stack.', apply: 'size()', boost: 22 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether the stack is empty.', apply: 'empty()', boost: 21 },
  { label: 'emplace', detail: 'emplace(args...)', type: 'method', info: 'Constructs an element in-place at the top.', apply: snippet('emplace(${1:args})'), boost: 20 },
];

const QUEUE_METHODS = [
  { label: 'push', detail: 'void push(const T& val)', type: 'method', info: 'Pushes an element to the back of the queue.', apply: snippet('push(${1:val})'), boost: 25 },
  { label: 'pop', detail: 'void pop()', type: 'method', info: 'Removes the next element from the front of the queue.', apply: 'pop()', boost: 24 },
  { label: 'front', detail: 'reference front()', type: 'method', info: 'Accesses the first element in the queue.', apply: 'front()', boost: 23 },
  { label: 'back', detail: 'reference back()', type: 'method', info: 'Accesses the last element in the queue.', apply: 'back()', boost: 22 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns the number of elements in the queue.', apply: 'size()', boost: 21 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether the queue is empty.', apply: 'empty()', boost: 20 },
  { label: 'emplace', detail: 'emplace(args...)', type: 'method', info: 'Constructs an element in-place at the back.', apply: snippet('emplace(${1:args})'), boost: 19 },
];

const PRIORITY_QUEUE_METHODS = [
  { label: 'push', detail: 'void push(const T& val)', type: 'method', info: 'Inserts an element into the priority queue heap.', apply: snippet('push(${1:val})'), boost: 25 },
  { label: 'pop', detail: 'void pop()', type: 'method', info: 'Removes the top priority element from the heap.', apply: 'pop()', boost: 24 },
  { label: 'top', detail: 'const_reference top() const', type: 'method', info: 'Accesses the highest priority element in the heap.', apply: 'top()', boost: 23 },
  { label: 'size', detail: 'size_t size() const', type: 'method', info: 'Returns the number of elements in the priority queue.', apply: 'size()', boost: 22 },
  { label: 'empty', detail: 'bool empty() const', type: 'method', info: 'Checks whether the priority queue is empty.', apply: 'empty()', boost: 21 },
  { label: 'emplace', detail: 'emplace(args...)', type: 'method', info: 'Constructs element in-place.', apply: snippet('emplace(${1:args})'), boost: 20 },
];

const DEQUE_METHODS = [
  { label: 'push_back', detail: 'push_back(val)', type: 'method', info: 'Adds element to the back.', apply: snippet('push_back(${1:val})'), boost: 25 },
  { label: 'push_front', detail: 'push_front(val)', type: 'method', info: 'Adds element to the front.', apply: snippet('push_front(${1:val})'), boost: 24 },
  { label: 'pop_back', detail: 'pop_back()', type: 'method', info: 'Removes element from the back.', apply: 'pop_back()', boost: 23 },
  { label: 'pop_front', detail: 'pop_front()', type: 'method', info: 'Removes element from the front.', apply: 'pop_front()', boost: 22 },
  { label: 'front', detail: 'front()', type: 'method', info: 'Accesses the first element.', apply: 'front()', boost: 21 },
  { label: 'back', detail: 'back()', type: 'method', info: 'Accesses the last element.', apply: 'back()', boost: 20 },
  { label: 'size', detail: 'size()', type: 'method', info: 'Returns number of elements.', apply: 'size()', boost: 19 },
  { label: 'empty', detail: 'empty()', type: 'method', info: 'Checks if empty.', apply: 'empty()', boost: 18 },
  { label: 'clear', detail: 'clear()', type: 'method', info: 'Clears all elements.', apply: 'clear()', boost: 17 },
  { label: 'begin', detail: 'begin()', type: 'method', info: 'Iterator to beginning.', apply: 'begin()', boost: 16 },
  { label: 'end', detail: 'end()', type: 'method', info: 'Iterator to end.', apply: 'end()', boost: 15 },
];

const PAIR_PROPERTIES = [
  { label: 'first', detail: 'T1 first', type: 'property', info: 'The first value in the pair.', apply: 'first', boost: 25 },
  { label: 'second', detail: 'T2 second', type: 'property', info: 'The second value in the pair.', apply: 'second', boost: 24 },
];

// Fallback/generic container methods when variable type cannot be inferred
const GENERIC_CONTAINER_METHODS = [
  ...VECTOR_METHODS.slice(0, 10),
  { label: 'top', detail: 'reference top()', type: 'method', info: 'Accesses top element (stack/priority_queue).', apply: 'top()', boost: 15 },
  { label: 'push', detail: 'void push(val)', type: 'method', info: 'Pushes element (stack/queue).', apply: snippet('push(${1:val})'), boost: 14 },
  { label: 'pop', detail: 'void pop()', type: 'method', info: 'Removes element (stack/queue).', apply: 'pop()', boost: 13 },
  { label: 'length', detail: 'size_t length() const', type: 'method', info: 'Length of string.', apply: 'length()', boost: 12 },
  { label: 'substr', detail: 'substr(pos, len)', type: 'method', info: 'Substring of string.', apply: snippet('substr(${1:pos}, ${2:len})'), boost: 11 },
  { label: 'find', detail: 'find(key/val)', type: 'method', info: 'Finds key or substring.', apply: snippet('find(${1:val})'), boost: 10 },
  { label: 'count', detail: 'count(key)', type: 'method', info: 'Checks key existence in map/set.', apply: snippet('count(${1:key})'), boost: 9 },
  { label: 'first', detail: 'T1 first', type: 'property', info: 'First element of pair.', apply: 'first', boost: 8 },
  { label: 'second', detail: 'T2 second', type: 'property', info: 'Second element of pair.', apply: 'second', boost: 7 },
];

// ── 5. Standard Namespace (std::) Members ──
const STD_MEMBERS = [
  // Containers
  { label: 'vector', detail: 'std::vector<T>', type: 'class', info: 'Dynamic resizable array container.', apply: 'vector' },
  { label: 'string', detail: 'std::string', type: 'class', info: 'Standard string class.', apply: 'string' },
  { label: 'map', detail: 'std::map<Key, Value>', type: 'class', info: 'Sorted associative key-value map.', apply: 'map' },
  { label: 'unordered_map', detail: 'std::unordered_map<Key, Value>', type: 'class', info: 'Hash map with average O(1) lookups.', apply: 'unordered_map' },
  { label: 'set', detail: 'std::set<T>', type: 'class', info: 'Sorted set of unique elements.', apply: 'set' },
  { label: 'unordered_set', detail: 'std::unordered_set<T>', type: 'class', info: 'Hash set of unique elements.', apply: 'unordered_set' },
  { label: 'stack', detail: 'std::stack<T>', type: 'class', info: 'LIFO stack adapter.', apply: 'stack' },
  { label: 'queue', detail: 'std::queue<T>', type: 'class', info: 'FIFO queue adapter.', apply: 'queue' },
  { label: 'priority_queue', detail: 'std::priority_queue<T>', type: 'class', info: 'Max-heap priority queue adapter.', apply: 'priority_queue' },
  { label: 'deque', detail: 'std::deque<T>', type: 'class', info: 'Double-ended queue.', apply: 'deque' },
  { label: 'pair', detail: 'std::pair<T1, T2>', type: 'class', info: 'Two-element tuple/pair.', apply: 'pair' },
  { label: 'tuple', detail: 'std::tuple<Types...>', type: 'class', info: 'Fixed-size heterogeneous collection.', apply: 'tuple' },
  { label: 'array', detail: 'std::array<T, N>', type: 'class', info: 'Fixed-size sequence container.', apply: 'array' },

  // Algorithms
  { label: 'sort', detail: 'void sort(first, last)', type: 'function', info: 'Sorts elements in range [first, last) into non-descending order.', apply: snippet('sort(${1:v}.begin(), ${1:v}.end());') },
  { label: 'reverse', detail: 'void reverse(first, last)', type: 'function', info: 'Reverses elements in range [first, last).', apply: snippet('reverse(${1:v}.begin(), ${1:v}.end());') },
  { label: 'max', detail: 'const T& max(a, b)', type: 'function', info: 'Returns greater of two values.', apply: snippet('max(${1:a}, ${2:b})') },
  { label: 'min', detail: 'const T& min(a, b)', type: 'function', info: 'Returns smaller of two values.', apply: snippet('min(${1:a}, ${2:b})') },
  { label: 'swap', detail: 'void swap(a, b)', type: 'function', info: 'Swaps values of two objects.', apply: snippet('swap(${1:a}, ${2:b});') },
  { label: 'binary_search', detail: 'bool binary_search(first, last, val)', type: 'function', info: 'Checks if val exists in sorted range.', apply: snippet('binary_search(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'lower_bound', detail: 'iterator lower_bound(first, last, val)', type: 'function', info: 'First element not less than val.', apply: snippet('lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'upper_bound', detail: 'iterator upper_bound(first, last, val)', type: 'function', info: 'First element greater than val.', apply: snippet('upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'find', detail: 'iterator find(first, last, val)', type: 'function', info: 'Finds first element equal to val.', apply: snippet('find(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'count', detail: 'size_t count(first, last, val)', type: 'function', info: 'Counts occurrences of val in range.', apply: snippet('count(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'accumulate', detail: 'T accumulate(first, last, init)', type: 'function', info: 'Sums elements in range starting from init (#include <numeric>).', apply: snippet('accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0})') },
  { label: 'next_permutation', detail: 'bool next_permutation(first, last)', type: 'function', info: 'Rearranges range into next lexicographical permutation.', apply: snippet('next_permutation(${1:v}.begin(), ${1:v}.end())') },
  { label: 'prev_permutation', detail: 'bool prev_permutation(first, last)', type: 'function', info: 'Rearranges range into previous lexicographical permutation.', apply: snippet('prev_permutation(${1:v}.begin(), ${1:v}.end())') },
  { label: 'fill', detail: 'void fill(first, last, val)', type: 'function', info: 'Fills range with val.', apply: snippet('fill(${1:v}.begin(), ${1:v}.end(), ${2:0});') },
  { label: 'iota', detail: 'void iota(first, last, val)', type: 'function', info: 'Fills range with sequential values starting at val.', apply: snippet('iota(${1:v}.begin(), ${1:v}.end(), ${2:0});') },
  { label: 'unique', detail: 'iterator unique(first, last)', type: 'function', info: 'Removes consecutive duplicate elements.', apply: snippet('unique(${1:v}.begin(), ${1:v}.end())') },

  // Streams & I/O
  { label: 'cin', detail: 'std::istream cin', type: 'variable', info: 'Standard input stream (console input).', apply: 'cin' },
  { label: 'cout', detail: 'std::ostream cout', type: 'variable', info: 'Standard output stream (console output).', apply: 'cout' },
  { label: 'cerr', detail: 'std::ostream cerr', type: 'variable', info: 'Standard error stream.', apply: 'cerr' },
  { label: 'endl', detail: 'std::endl', type: 'variable', info: 'Inserts newline character and flushes stream.', apply: 'endl' },
  { label: 'getline', detail: 'getline(istream, str)', type: 'function', info: 'Reads line from input stream into string.', apply: snippet('getline(cin, ${1:str});') },

  // Conversions & Math
  { label: 'stoi', detail: 'int stoi(str)', type: 'function', info: 'Parses signed integer from string.', apply: snippet('stoi(${1:str})') },
  { label: 'stoll', detail: 'long long stoll(str)', type: 'function', info: 'Parses 64-bit integer from string.', apply: snippet('stoll(${1:str})') },
  { label: 'to_string', detail: 'string to_string(val)', type: 'function', info: 'Converts numeric value to std::string.', apply: snippet('to_string(${1:val})') },
  { label: 'abs', detail: 'abs(n)', type: 'function', info: 'Computes absolute value.', apply: snippet('abs(${1:n})') },
  { label: 'sqrt', detail: 'double sqrt(x)', type: 'function', info: 'Computes square root.', apply: snippet('sqrt(${1:x})') },
  { label: 'pow', detail: 'double pow(base, exp)', type: 'function', info: 'Computes base raised to exp power.', apply: snippet('pow(${1:base}, ${2:exp})') },
  { label: 'gcd', detail: 'gcd(a, b)', type: 'function', info: 'Greatest common divisor (C++17).', apply: snippet('gcd(${1:a}, ${2:b})') },
  { label: 'lcm', detail: 'lcm(a, b)', type: 'function', info: 'Least common multiple (C++17).', apply: snippet('lcm(${1:a}, ${2:b})') },
  { label: 'clamp', detail: 'clamp(val, low, high)', type: 'function', info: 'Clamps value between low and high (C++17).', apply: snippet('clamp(${1:val}, ${2:low}, ${3:high})') },
  { label: 'make_pair', detail: 'make_pair(a, b)', type: 'function', info: 'Creates std::pair object.', apply: snippet('make_pair(${1:a}, ${2:b})') },
  { label: 'make_tuple', detail: 'make_tuple(args...)', type: 'function', info: 'Creates std::tuple object.', apply: snippet('make_tuple(${1:args})') },
  { label: 'tie', detail: 'tie(args...)', type: 'function', info: 'Creates tuple of lvalue references for unpacking.', apply: snippet('tie(${1:a}, ${2:b})') },
  { label: 'move', detail: 'std::move(t)', type: 'function', info: 'Converts lvalue reference to rvalue reference.', apply: snippet('move(${1:obj})') },
];

// ── 6. Global C++ Word Completions (Keywords, STL Containers, Algorithms, Functions) ──
const CPP_WORD_COMPLETIONS = [
  // C++ Keywords (Data Types)
  { label: 'int', detail: '32-bit signed integer', type: 'keyword' },
  { label: 'long', detail: 'At least 32-bit integer', type: 'keyword' },
  { label: 'long long', detail: 'At least 64-bit integer', type: 'keyword' },
  { label: 'float', detail: 'Single precision float', type: 'keyword' },
  { label: 'double', detail: 'Double precision float', type: 'keyword' },
  { label: 'char', detail: 'Character type', type: 'keyword' },
  { label: 'bool', detail: 'Boolean type (true / false)', type: 'keyword' },
  { label: 'void', detail: 'Empty or returnless type', type: 'keyword' },
  { label: 'auto', detail: 'Automatic type deduction', type: 'keyword' },
  { label: 'const', detail: 'Constant variable or parameter modifier', type: 'keyword' },
  { label: 'static', detail: 'Static storage duration specifier', type: 'keyword' },
  { label: 'unsigned', detail: 'Unsigned integer modifier', type: 'keyword' },
  { label: 'signed', detail: 'Signed integer modifier', type: 'keyword' },

  // Control Flow
  { label: 'if', detail: 'if (condition)', type: 'keyword', apply: snippet('if (${1:condition}) {\n\t${2}\n}') },
  { label: 'else', detail: 'else statement', type: 'keyword', apply: snippet('else {\n\t${1}\n}') },
  { label: 'switch', detail: 'switch statement', type: 'keyword', apply: snippet('switch (${1:expression}) {\ncase ${2:value}:\n\t${3}\n\tbreak;\ndefault:\n\tbreak;\n}') },
  { label: 'case', detail: 'case value:', type: 'keyword', apply: snippet('case ${1:value}:\n\t${2}\n\tbreak;') },
  { label: 'default', detail: 'default:', type: 'keyword', apply: snippet('default:\n\t${1}\n\tbreak;') },
  { label: 'for', detail: 'for (int i = 0; i < n; i++)', type: 'keyword', apply: snippet('for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}') },
  { label: 'for-range', detail: 'for (auto& x : container)', type: 'snippet', apply: snippet('for (auto& ${1:x} : ${2:v}) {\n\t${3}\n}') },
  { label: 'while', detail: 'while (condition)', type: 'keyword', apply: snippet('while (${1:condition}) {\n\t${2}\n}') },
  { label: 'do', detail: 'do { ... } while (condition);', type: 'keyword', apply: snippet('do {\n\t${2}\n} while (${1:condition});') },
  { label: 'return', detail: 'return value;', type: 'keyword' },
  { label: 'break', detail: 'break statement', type: 'keyword' },
  { label: 'continue', detail: 'continue statement', type: 'keyword' },

  // Class & Namespace
  { label: 'class', detail: 'class definition', type: 'keyword', apply: snippet('class ${1:Name} {\npublic:\n\t${2}\n};') },
  { label: 'struct', detail: 'struct definition', type: 'keyword', apply: snippet('struct ${1:Name} {\n\t${2}\n};') },
  { label: 'public', detail: 'public access specifier', type: 'keyword' },
  { label: 'private', detail: 'private access specifier', type: 'keyword' },
  { label: 'protected', detail: 'protected access specifier', type: 'keyword' },
  { label: 'using', detail: 'using declaration', type: 'keyword', apply: snippet('using ${1:name} = ${2:type};') },
  { label: 'using namespace std', detail: 'using namespace std;', type: 'snippet', apply: 'using namespace std;' },
  { label: 'namespace', detail: 'namespace definition', type: 'keyword', apply: snippet('namespace ${1:name} {\n\t${2}\n}') },
  { label: 'nullptr', detail: 'null pointer literal', type: 'keyword' },
  { label: 'constexpr', detail: 'constant expression qualifier', type: 'keyword' },
  { label: 'sizeof', detail: 'sizeof(type)', type: 'keyword', apply: snippet('sizeof(${1:type})') },
  { label: 'typedef', detail: 'typedef definition', type: 'keyword' },
  { label: 'template', detail: 'template <typename T>', type: 'keyword', apply: snippet('template <typename ${1:T}>') },
  { label: 'typename', detail: 'typename specifier', type: 'keyword' },
  { label: 'true', detail: 'boolean true', type: 'keyword' },
  { label: 'false', detail: 'boolean false', type: 'keyword' },

  // STL Containers (Section 2 & 5)
  { label: 'vector', detail: 'std::vector<T>', type: 'class', info: 'Sequence container representing array that can change in size dynamically.\n\nUsage:\nvector<int> v;\nvector<int> v(n, 0);', apply: 'vector' },
  { label: 'vector<int>', detail: 'vector<int> v;', type: 'snippet', info: 'Instantiates a vector of integers.', apply: snippet('vector<int> ${1:v};') },
  { label: 'string', detail: 'std::string', type: 'class', info: 'Character sequence container.', apply: 'string' },
  { label: 'map', detail: 'std::map<Key, Value>', type: 'class', info: 'Sorted key-value associative container (RB-tree).', apply: 'map' },
  { label: 'unordered_map', detail: 'std::unordered_map<Key, Value>', type: 'class', info: 'Hash map with average O(1) operations.', apply: 'unordered_map' },
  { label: 'unordered_map<int, int>', detail: 'unordered_map<int, int> freq;', type: 'snippet', apply: snippet('unordered_map<${1:int}, ${2:int}> ${3:freq};') },
  { label: 'set', detail: 'std::set<T>', type: 'class', info: 'Sorted set of unique elements.', apply: 'set' },
  { label: 'unordered_set', detail: 'std::unordered_set<T>', type: 'class', info: 'Hash set of unique elements with average O(1) lookups.', apply: 'unordered_set' },
  { label: 'unordered_set<int>', detail: 'unordered_set<int> seen;', type: 'snippet', apply: snippet('unordered_set<${1:int}> ${2:seen};') },
  { label: 'stack', detail: 'std::stack<T>', type: 'class', info: 'LIFO stack adapter.', apply: 'stack' },
  { label: 'queue', detail: 'std::queue<T>', type: 'class', info: 'FIFO queue adapter.', apply: 'queue' },
  { label: 'priority_queue', detail: 'std::priority_queue<T>', type: 'class', info: 'Max-heap container adapter.', apply: 'priority_queue' },
  { label: 'priority_queue (min-heap)', detail: 'priority_queue<int, vector<int>, greater<int>>', type: 'snippet', apply: snippet('priority_queue<${1:int}, vector<${1:int}>, greater<${1:int}>> ${2:min_pq};') },
  { label: 'deque', detail: 'std::deque<T>', type: 'class', info: 'Double-ended queue container.', apply: 'deque' },
  { label: 'pair', detail: 'std::pair<T1, T2>', type: 'class', info: 'Couples two values into a single entity.', apply: 'pair' },
  { label: 'tuple', detail: 'std::tuple<Types...>', type: 'class', info: 'Fixed-size heterogeneous collection.', apply: 'tuple' },

  // STL Algorithms (Section 2 & 5)
  { label: 'sort', detail: 'std::sort(first, last)', type: 'function', info: 'Sorts elements in range [first, last) into non-descending order (O(N log N)).\n\nUsage:\nsort(v.begin(), v.end());\nsort(v.begin(), v.end(), greater<int>());\nsort(arr, arr + n);', apply: snippet('sort(${1:v}.begin(), ${1:v}.end());') },
  { label: 'reverse', detail: 'std::reverse(first, last)', type: 'function', info: 'Reverses order of elements in range [first, last).', apply: snippet('reverse(${1:v}.begin(), ${1:v}.end());') },
  { label: 'max', detail: 'std::max(a, b)', type: 'function', info: 'Returns greater of two values.', apply: snippet('max(${1:a}, ${2:b})') },
  { label: 'min', detail: 'std::min(a, b)', type: 'function', info: 'Returns smaller of two values.', apply: snippet('min(${1:a}, ${2:b})') },
  { label: 'swap', detail: 'std::swap(a, b)', type: 'function', info: 'Swaps the values of a and b.', apply: snippet('swap(${1:a}, ${2:b});') },
  { label: 'binary_search', detail: 'std::binary_search(first, last, val)', type: 'function', info: 'Returns true if element val exists in sorted range [first, last).', apply: snippet('binary_search(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'lower_bound', detail: 'std::lower_bound(first, last, val)', type: 'function', info: 'Returns iterator to first element in sorted range NOT less than val.', apply: snippet('lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'upper_bound', detail: 'std::upper_bound(first, last, val)', type: 'function', info: 'Returns iterator to first element in sorted range GREATER than val.', apply: snippet('upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'find', detail: 'std::find(first, last, val)', type: 'function', info: 'Returns iterator to first element equal to val.', apply: snippet('find(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'count', detail: 'std::count(first, last, val)', type: 'function', info: 'Returns number of elements equal to val in range.', apply: snippet('count(${1:v}.begin(), ${1:v}.end(), ${2:val})') },
  { label: 'accumulate', detail: 'std::accumulate(first, last, init)', type: 'function', info: 'Computes sum of elements in range [first, last) starting from init (#include <numeric>).', apply: snippet('accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0})') },
  { label: 'next_permutation', detail: 'std::next_permutation(first, last)', type: 'function', info: 'Rearranges range into lexicographically next greater permutation.', apply: snippet('next_permutation(${1:v}.begin(), ${1:v}.end())') },
  { label: 'prev_permutation', detail: 'std::prev_permutation(first, last)', type: 'function', info: 'Rearranges range into lexicographically next smaller permutation.', apply: snippet('prev_permutation(${1:v}.begin(), ${1:v}.end())') },
  { label: 'fill', detail: 'std::fill(first, last, val)', type: 'function', info: 'Assigns value to elements in range.', apply: snippet('fill(${1:v}.begin(), ${1:v}.end(), ${2:0});') },
  { label: 'iota', detail: 'std::iota(first, last, val)', type: 'function', info: 'Fills range with sequential values starting at val.', apply: snippet('iota(${1:v}.begin(), ${1:v}.end(), ${2:0});') },
  { label: 'unique', detail: 'std::unique(first, last)', type: 'function', info: 'Removes consecutive duplicate elements.', apply: snippet('unique(${1:v}.begin(), ${1:v}.end())') },

  // Container Methods (Available globally as well)
  { label: 'push_back', detail: 'push_back(val)', type: 'method', info: 'Appends element to container.', apply: snippet('push_back(${1:val})') },
  { label: 'pop_back', detail: 'pop_back()', type: 'method', info: 'Removes last element.', apply: 'pop_back()' },
  { label: 'size', detail: 'size()', type: 'method', info: 'Returns container size.', apply: 'size()' },
  { label: 'empty', detail: 'empty()', type: 'method', info: 'Checks if container is empty.', apply: 'empty()' },
  { label: 'clear', detail: 'clear()', type: 'method', info: 'Clears all elements.', apply: 'clear()' },
  { label: 'front', detail: 'front()', type: 'method', info: 'Accesses first element.', apply: 'front()' },
  { label: 'back', detail: 'back()', type: 'method', info: 'Accesses last element.', apply: 'back()' },
  { label: 'begin', detail: 'begin()', type: 'method', info: 'Iterator to beginning.', apply: 'begin()' },
  { label: 'end', detail: 'end()', type: 'method', info: 'Iterator to end.', apply: 'end()' },
  { label: 'insert', detail: 'insert(...)', type: 'method', info: 'Inserts element.', apply: snippet('insert(${1:val})') },
  { label: 'erase', detail: 'erase(...)', type: 'method', info: 'Erases element.', apply: snippet('erase(${1:pos})') },
  { label: 'top', detail: 'top()', type: 'method', info: 'Accesses top element of stack/heap.', apply: 'top()' },
  { label: 'push', detail: 'push(val)', type: 'method', info: 'Pushes element into stack/queue.', apply: snippet('push(${1:val})') },
  { label: 'pop', detail: 'pop()', type: 'method', info: 'Pops element from stack/queue.', apply: 'pop()' },
  { label: 'length', detail: 'length()', type: 'method', info: 'Length of string.', apply: 'length()' },
  { label: 'substr', detail: 'substr(pos, len)', type: 'method', info: 'Substring of string.', apply: snippet('substr(${1:pos}, ${2:len})') },

  // Standard Functions (Section 2 & 5)
  { label: 'abs', detail: 'abs(n)', type: 'function', info: 'Computes absolute value.', apply: snippet('abs(${1:n})') },
  { label: 'sqrt', detail: 'sqrt(x)', type: 'function', info: 'Computes square root.', apply: snippet('sqrt(${1:x})') },
  { label: 'pow', detail: 'pow(base, exp)', type: 'function', info: 'Computes base raised to exp power.', apply: snippet('pow(${1:base}, ${2:exp})') },
  { label: 'stoi', detail: 'stoi(str)', type: 'function', info: 'Parses string to signed integer.', apply: snippet('stoi(${1:str})') },
  { label: 'stoll', detail: 'stoll(str)', type: 'function', info: 'Parses string to 64-bit integer.', apply: snippet('stoll(${1:str})') },
  { label: 'to_string', detail: 'to_string(val)', type: 'function', info: 'Converts numeric value to std::string.', apply: snippet('to_string(${1:val})') },
  { label: 'getline', detail: 'getline(cin, str)', type: 'function', info: 'Reads line from input stream.', apply: snippet('getline(cin, ${1:str});') },
  { label: 'cin', detail: 'std::cin', type: 'variable', info: 'Standard input stream.', apply: 'cin' },
  { label: 'cout', detail: 'std::cout', type: 'variable', info: 'Standard output stream.', apply: 'cout' },
  { label: 'endl', detail: 'std::endl', type: 'variable', info: 'Newline & stream flush.', apply: 'endl' },
];

// ── 7. Global C Word Completions ──
const C_WORD_COMPLETIONS = [
  // C Keywords
  { label: 'int', detail: '32-bit signed integer', type: 'keyword' },
  { label: 'long', detail: 'At least 32-bit integer', type: 'keyword' },
  { label: 'float', detail: 'Single precision float', type: 'keyword' },
  { label: 'double', detail: 'Double precision float', type: 'keyword' },
  { label: 'char', detail: 'Character type', type: 'keyword' },
  { label: 'void', detail: 'Empty or returnless type', type: 'keyword' },
  { label: 'short', detail: '16-bit integer', type: 'keyword' },
  { label: 'unsigned', detail: 'Unsigned modifier', type: 'keyword' },
  { label: 'signed', detail: 'Signed modifier', type: 'keyword' },
  { label: 'const', detail: 'Constant variable modifier', type: 'keyword' },
  { label: 'static', detail: 'Static storage duration', type: 'keyword' },
  { label: 'struct', detail: 'struct declaration', type: 'keyword', apply: snippet('struct ${1:Name} {\n\t${2}\n};') },
  { label: 'union', detail: 'union declaration', type: 'keyword', apply: snippet('union ${1:Name} {\n\t${2}\n};') },
  { label: 'enum', detail: 'enum declaration', type: 'keyword', apply: snippet('enum ${1:Name} {\n\t${2}\n};') },
  { label: 'typedef', detail: 'typedef definition', type: 'keyword', apply: snippet('typedef ${1:type} ${2:alias};') },
  { label: 'sizeof', detail: 'sizeof(type)', type: 'keyword', apply: snippet('sizeof(${1:type})') },

  // Control Flow
  { label: 'if', detail: 'if statement', type: 'keyword', apply: snippet('if (${1:condition}) {\n\t${2}\n}') },
  { label: 'else', detail: 'else statement', type: 'keyword', apply: snippet('else {\n\t${1}\n}') },
  { label: 'switch', detail: 'switch statement', type: 'keyword', apply: snippet('switch (${1:expression}) {\ncase ${2:value}:\n\t${3}\n\tbreak;\ndefault:\n\tbreak;\n}') },
  { label: 'case', detail: 'case statement', type: 'keyword', apply: snippet('case ${1:value}:\n\t${2}\n\tbreak;') },
  { label: 'default', detail: 'default statement', type: 'keyword', apply: snippet('default:\n\t${1}\n\tbreak;') },
  { label: 'for', detail: 'for loop', type: 'keyword', apply: snippet('for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}') },
  { label: 'while', detail: 'while loop', type: 'keyword', apply: snippet('while (${1:condition}) {\n\t${2}\n}') },
  { label: 'do', detail: 'do-while loop', type: 'keyword', apply: snippet('do {\n\t${2}\n} while (${1:condition});') },
  { label: 'return', detail: 'return statement', type: 'keyword' },
  { label: 'break', detail: 'break statement', type: 'keyword' },
  { label: 'continue', detail: 'continue statement', type: 'keyword' },

  // C Standard Library Functions
  { label: 'printf', detail: 'int printf(const char* format, ...)', type: 'function', info: 'Prints formatted output to stdout.', apply: snippet('printf("${1:%d}\\n", ${2:val});') },
  { label: 'scanf', detail: 'int scanf(const char* format, ...)', type: 'function', info: 'Reads formatted input from stdin.', apply: snippet('scanf("${1:%d}", &${2:val});') },
  { label: 'malloc', detail: 'void* malloc(size_t size)', type: 'function', info: 'Allocates uninitialized dynamic memory.', apply: snippet('(${1:int}*)malloc(${2:n} * sizeof(${1:int}))') },
  { label: 'calloc', detail: 'void* calloc(size_t num, size_t size)', type: 'function', info: 'Allocates zero-initialized dynamic memory.', apply: snippet('(${1:int}*)calloc(${2:n}, sizeof(${1:int}))') },
  { label: 'realloc', detail: 'void* realloc(void* ptr, size_t new_size)', type: 'function', info: 'Reallocates previously allocated dynamic memory block.', apply: snippet('realloc(${1:ptr}, ${2:new_size})') },
  { label: 'free', detail: 'void free(void* ptr)', type: 'function', info: 'Deallocates dynamic memory previously allocated by malloc/calloc.', apply: snippet('free(${1:ptr});') },
  { label: 'memset', detail: 'void* memset(void* dest, int ch, size_t count)', type: 'function', info: 'Fills memory buffer with a constant byte value.', apply: snippet('memset(${1:arr}, ${2:0}, sizeof(${1:arr}));') },
  { label: 'memcpy', detail: 'void* memcpy(void* dest, const void* src, size_t count)', type: 'function', info: 'Copies count bytes from src to dest.', apply: snippet('memcpy(${1:dest}, ${2:src}, ${3:count});') },
  { label: 'strlen', detail: 'size_t strlen(const char* str)', type: 'function', info: 'Calculates the length of null-terminated string.', apply: snippet('strlen(${1:str})') },
  { label: 'strcpy', detail: 'char* strcpy(char* dest, const char* src)', type: 'function', info: 'Copies null-terminated string src to dest.', apply: snippet('strcpy(${1:dest}, ${2:src});') },
  { label: 'strcmp', detail: 'int strcmp(const char* lhs, const char* rhs)', type: 'function', info: 'Compares two null-terminated strings lexicographically.', apply: snippet('strcmp(${1:s1}, ${2:s2})') },
  { label: 'atoi', detail: 'int atoi(const char* str)', type: 'function', info: 'Converts C-string to integer.', apply: snippet('atoi(${1:str})') },
  { label: 'abs', detail: 'int abs(int n)', type: 'function', info: 'Calculates absolute value of integer.', apply: snippet('abs(${1:n})') },
  { label: 'sqrt', detail: 'double sqrt(double x)', type: 'function', info: 'Calculates square root.', apply: snippet('sqrt(${1:x})') },
  { label: 'pow', detail: 'double pow(double base, double exp)', type: 'function', info: 'Calculates base raised to power exp.', apply: snippet('pow(${1:base}, ${2:exp})') },
  { label: 'qsort', detail: 'void qsort(void* ptr, size_t count, size_t size, comp)', type: 'function', info: 'Sorts array using quicksort algorithm.', apply: snippet('qsort(${1:arr}, ${2:n}, sizeof(${3:int}), ${4:compare});') },
  { label: 'bsearch', detail: 'void* bsearch(const void* key, const void* ptr, count, size, comp)', type: 'function', info: 'Searches array using binary search.', apply: snippet('bsearch(&${1:key}, ${2:arr}, ${3:n}, sizeof(${4:int}), ${5:compare})') },
];

/**
 * Scans the source document for variable declarations to infer their container or type.
 * Supports: vector, string, map, unordered_map, set, unordered_set, stack, queue, priority_queue, deque, pair.
 */
export function inferVariableTypes(doc) {
  const types = {};
  if (!doc) return types;

  // Matches: [const] [std::]Type [<nested<templates>>] [*&] varName
  const declRegex = /\b(?:const\s+)?(?:std::)?(vector|string|unordered_map|map|unordered_set|set|stack|queue|priority_queue|deque|pair)\s*(?:<[^;()]*?(?:<[^;()]*?>)?[^;()]*?>)?\s*[*&]?\s*([a-zA-Z_]\w*)/g;
  let match;
  while ((match = declRegex.exec(doc)) !== null) {
    const type = match[1];
    const varName = match[2];
    if (varName && !types[varName]) {
      types[varName] = type;
    }
  }

  return types;
}

/**
 * Returns methods and properties appropriate for a given variable.
 */
function getMethodsForVariable(varName, doc) {
  const inferred = inferVariableTypes(doc);
  let detectedType = inferred[varName];

  // If not explicitly declared, use smart heuristic names commonly found in DSA
  if (!detectedType) {
    const lower = varName.toLowerCase();
    if (lower === 'v' || lower === 'vec' || lower === 'nums' || lower === 'arr' || lower.endsWith('list') || lower.endsWith('arr')) {
      detectedType = 'vector';
    } else if (lower === 's' || lower === 'str' || lower === 'text' || lower === 'line') {
      detectedType = 'string';
    } else if (lower === 'mp' || lower === 'map' || lower === 'freq' || lower === 'count') {
      detectedType = 'map';
    } else if (lower === 'st' && doc.includes('stack')) {
      detectedType = 'stack';
    } else if (lower === 'seen' || lower === 'visited' || lower === 'set') {
      detectedType = 'set';
    } else if (lower === 'q' || lower === 'queue') {
      detectedType = 'queue';
    } else if (lower === 'pq' || lower === 'heap') {
      detectedType = 'priority_queue';
    } else if (lower === 'p' || lower === 'pr' || lower === 'pair') {
      detectedType = 'pair';
    } else if (lower === 'dq' || lower === 'deque') {
      detectedType = 'deque';
    }
  }

  switch (detectedType) {
    case 'vector':
      return VECTOR_METHODS;
    case 'string':
      return STRING_METHODS;
    case 'map':
    case 'unordered_map':
      return MAP_METHODS;
    case 'set':
    case 'unordered_set':
      return SET_METHODS;
    case 'stack':
      return STACK_METHODS;
    case 'queue':
      return QUEUE_METHODS;
    case 'priority_queue':
      return PRIORITY_QUEUE_METHODS;
    case 'deque':
      return DEQUE_METHODS;
    case 'pair':
      return PAIR_PROPERTIES;
    default:
      return GENERIC_CONTAINER_METHODS;
  }
}

/**
 * CodeMirror 6 Autocomplete Source for C++
 */
export function cppAutocompleteSource(context) {
  const { state, pos, explicit } = context;
  const doc = state.doc.toString();

  // ── Context 1: #include <... ──
  const includeMatch = context.matchBefore(/#\s*include\s*<([\w./]*)/);
  if (includeMatch) {
    const afterPosChar = state.sliceDoc(pos, pos + 1);
    const hasClosingBracket = afterPosChar === '>';
    const startOfHeader = includeMatch.from + includeMatch.text.lastIndexOf('<') + 1;

    return {
      from: startOfHeader,
      options: CPP_HEADERS.map((h) => ({
        label: h.label,
        detail: h.detail,
        type: h.type,
        apply: hasClosingBracket ? h.label : `${h.label}>`,
        boost: h.label === 'iostream' || h.label === 'vector' || h.label === 'algorithm' ? 30 : 10,
      })),
      validFor: /^[\w./]*$/,
    };
  }

  // ── Context 2: Template type parameter (e.g. vector<... or pair<int, ...) ──
  const templateMatch = context.matchBefore(/(?:vector|deque|list|set|multiset|unordered_set|queue|priority_queue|stack|pair|map|unordered_map)<\s*[\w:, ]*$/);
  if (templateMatch) {
    const lastDelimIdx = Math.max(templateMatch.text.lastIndexOf('<'), templateMatch.text.lastIndexOf(','));
    const startFrom = templateMatch.from + lastDelimIdx + 1;
    // Skip spaces after < or ,
    const query = templateMatch.text.slice(lastDelimIdx + 1).replace(/^\s+/, '');
    const actualFrom = pos - query.length;

    const afterPosChar = state.sliceDoc(pos, pos + 1);
    const hasClosingAngle = afterPosChar === '>';

    return {
      from: actualFrom,
      options: TEMPLATE_TYPES.map((t) => ({
        label: t.label,
        detail: t.detail,
        type: t.type,
        apply: hasClosingAngle ? t.label : (t.label.includes('<') ? t.label : `${t.label}>`),
        boost: t.boost,
      })),
      validFor: /^[\w:]*$/,
    };
  }

  // ── Context 3: std:: Namespace Members ──
  const stdMatch = context.matchBefore(/(?:std::)(\w*)$/);
  if (stdMatch) {
    const query = stdMatch.text.slice(5); // after 'std::'
    const startFrom = pos - query.length;

    return {
      from: startFrom,
      options: STD_MEMBERS,
      validFor: /^\w*$/,
    };
  }

  // ── Context 4: Member Access (arr. or v. or s. or ptr->) ──
  const memberMatch = context.matchBefore(/(\b[a-zA-Z_]\w*)(?:\.|->)(\w*)$/);
  if (memberMatch) {
    const isArrow = memberMatch.text.includes('->');
    const dotIdx = isArrow ? memberMatch.text.lastIndexOf('->') + 1 : memberMatch.text.lastIndexOf('.');
    const varName = memberMatch.text.slice(0, isArrow ? dotIdx - 1 : dotIdx);
    const query = memberMatch.text.slice(dotIdx + 1);
    const startFrom = pos - query.length;

    const methods = getMethodsForVariable(varName, doc);
    return {
      from: startFrom,
      options: methods,
      validFor: /^\w*$/,
    };
  }

  // ── Context 5: Parameter assistance for STL algorithm calls (e.g. sort(...) ──
  const sortCallMatch = context.matchBefore(/(?:std::)?sort\s*\([\s\w.,]*$/);
  if (sortCallMatch && !sortCallMatch.text.includes(')')) {
    const afterPosChar = state.sliceDoc(pos, pos + 1);
    const hasClosingParen = afterPosChar === ')';

    // Find any vector name declared in current document
    const inferred = inferVariableTypes(doc);
    const firstVec = Object.keys(inferred).find((k) => inferred[k] === 'vector') || 'v';

    const sortOptions = [
      {
        label: `${firstVec}.begin(), ${firstVec}.end()`,
        detail: `sort(${firstVec}.begin(), ${firstVec}.end())`,
        type: 'function',
        info: `Sorts entire ${firstVec} container in ascending order (default <).\n\nComplexity: O(N log N)`,
        apply: hasClosingParen ? `${firstVec}.begin(), ${firstVec}.end()` : `${firstVec}.begin(), ${firstVec}.end())`,
        boost: 30,
      },
      {
        label: `${firstVec}.begin(), ${firstVec}.end(), greater<int>()`,
        detail: `sort descending using greater<int>()`,
        type: 'function',
        info: `Sorts ${firstVec} in descending order using std::greater comparator.`,
        apply: hasClosingParen ? `${firstVec}.begin(), ${firstVec}.end(), greater<int>()` : `${firstVec}.begin(), ${firstVec}.end(), greater<int>())`,
        boost: 25,
      },
      {
        label: `${firstVec}.rbegin(), ${firstVec}.rend()`,
        detail: `sort descending using reverse iterators`,
        type: 'function',
        info: `Sorts ${firstVec} in descending order via reverse iterators.`,
        apply: hasClosingParen ? `${firstVec}.rbegin(), ${firstVec}.rend()` : `${firstVec}.rbegin(), ${firstVec}.rend())`,
        boost: 20,
      },
      {
        label: 'arr, arr + n',
        detail: 'sort(arr, arr + n)',
        type: 'function',
        info: 'Sorts raw array of size n into ascending order.',
        apply: hasClosingParen ? 'arr, arr + n' : 'arr, arr + n)',
        boost: 15,
      },
    ];

    const commaIdx = sortCallMatch.text.lastIndexOf(',');
    const parenIdx = sortCallMatch.text.lastIndexOf('(');
    const lastDelim = Math.max(commaIdx, parenIdx);
    const query = sortCallMatch.text.slice(lastDelim + 1).replace(/^\s+/, '');
    const startFrom = pos - query.length;

    return {
      from: startFrom,
      options: sortOptions,
      validFor: /^[\w.,\s]*$/,
    };
  }

  // ── Context 6: General Word Completion ──
  const wordMatch = context.matchBefore(/\b[a-zA-Z_]\w*$/);
  if (!wordMatch && !explicit) {
    return null;
  }

  const from = wordMatch ? wordMatch.from : pos;
  return {
    from,
    options: CPP_WORD_COMPLETIONS,
    validFor: /^[a-zA-Z_]\w*$/,
  };
}

/**
 * CodeMirror 6 Autocomplete Source for C
 */
export function cAutocompleteSource(context) {
  const { state, pos, explicit } = context;

  // ── Context 1: #include <... ──
  const includeMatch = context.matchBefore(/#\s*include\s*<([\w./]*)/);
  if (includeMatch) {
    const afterPosChar = state.sliceDoc(pos, pos + 1);
    const hasClosingBracket = afterPosChar === '>';
    const startOfHeader = includeMatch.from + includeMatch.text.lastIndexOf('<') + 1;

    return {
      from: startOfHeader,
      options: C_HEADERS.map((h) => ({
        label: h.label,
        detail: h.detail,
        type: h.type,
        apply: hasClosingBracket ? h.label : `${h.label}>`,
        boost: h.label === 'stdio.h' || h.label === 'stdlib.h' || h.label === 'string.h' ? 30 : 10,
      })),
      validFor: /^[\w./]*$/,
    };
  }

  // ── Context 2: General C Word Completion ──
  const wordMatch = context.matchBefore(/\b[a-zA-Z_]\w*$/);
  if (!wordMatch && !explicit) {
    return null;
  }

  const from = wordMatch ? wordMatch.from : pos;
  return {
    from,
    options: C_WORD_COMPLETIONS,
    validFor: /^[a-zA-Z_]\w*$/,
  };
}

/**
 * Returns a configured LanguageSupport extension for C++
 */
export function cppLanguageSupport() {
  return new LanguageSupport(cppLanguage, [
    cppLanguage.data.of({ autocomplete: cppAutocompleteSource }),
  ]);
}

/**
 * Returns a configured LanguageSupport extension for C
 */
export function cLanguageSupport() {
  return new LanguageSupport(cppLanguage, [
    cppLanguage.data.of({ autocomplete: cAutocompleteSource }),
  ]);
}

