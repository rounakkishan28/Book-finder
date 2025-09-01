import { useState, useEffect } from 'react';
import { Search, Book, Calendar, ExternalLink, Filter, X, BookOpen, Bookmark, Heart } from 'lucide-react';

const BookFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const [favorites, setFavorites] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('bookfinder-favorites')) || [];
  } catch {
    return [];
  }
});

const [readingList, setReadingList] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('bookfinder-reading-list')) || [];
  } catch {
    return [];
  }
});

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    publishYear: '',
    language: '',
    hasEbook: false
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentView, setCurrentView] = useState('search'); // search, favorites, reading-list

  // Load saved data from localStorage
  useEffect(() => {
    try{
        const savedFavorites = localStorage.getItem('bookfinder-favorites');
        const savedReadingList = localStorage.getItem('bookfinder-reading-list');
        if(savedFavorites?.length) setFavorites(JSON.parse(savedFavorites));
        if(savedReadingList?.length) setReadingList(JSON.parse(savedReadingList));
    } catch(error){
        console.error('Error loading saved data:', error);
        setFavorites([]);
        setReadingList([]);
    }
  }, []);

  // Set favorites data to localStorage
  useEffect(() => {
    try{
        localStorage.setItem('bookfinder-favorites', JSON.stringify(favorites));
    } catch(error){
        console.error('Error saving favorites:', error);
    }
  }, [favorites]);

  // Set reading list data to localStorage
  useEffect(() => {
    try{
        localStorage.setItem('bookfinder-reading-list', JSON.stringify(readingList));
    } catch(error){
        console.error('Error saving reading list:', error);
    }
  }, [readingList]);

  // Search Books
  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      let url = '';
      switch (searchType) {
        case 'title':
          url = `https://openlibrary.org/search.json?title=${encodeURIComponent(searchQuery)}`;
          break;
        case 'author':
          url = `https://openlibrary.org/search.json?author=${encodeURIComponent(searchQuery)}`;
          break;
        case 'subject':
          url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(searchQuery)}`;
          break;
        case 'isbn':
          url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(searchQuery)}`;
          break;
        default:
          url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      let filteredBooks = data.docs || [];
      
      // Apply filters
      if (filters.publishYear) {
        filteredBooks = filteredBooks.filter(book => 
          book.first_publish_year && book.first_publish_year.toString().includes(filters.publishYear)
        );
      }
      
      if (filters.language) {
        filteredBooks = filteredBooks.filter(book => 
          book.language && book.language.includes(filters.language)
        );
      }
      
      if (filters.hasEbook) {
        filteredBooks = filteredBooks.filter(book => book.ebook_access === 'public');
      }
      
      setBooks(filteredBooks.slice(0, 20)); // Limit to 20 results
    } catch (err) {
      setError('Failed to search books. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  const toggleFavorite = (book) => {
    const isAlreadyFavorite = favorites.some(fav => fav.key === book.key);
    if (isAlreadyFavorite) {
      setFavorites(favorites.filter(fav => fav.key !== book.key));
    } else {
      setFavorites([...favorites, book]);
    }
  };

  const toggleReadingList = (book) => {
    const isAlreadyInList = readingList.some(item => item.key === book.key);
    if (isAlreadyInList) {
      setReadingList(readingList.filter(item => item.key !== book.key));
    } else {
      setReadingList([...readingList, book]);
    }
  };

  const getCoverUrl = (book) => {
    if (book.cover_i) {
      return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
    }
    return null;
  };

  const formatAuthors = (authors) => {
    if (!authors) return 'Unknown Author';
    return authors.slice(0, 3).join(', ') + (authors.length > 3 ? '...' : '');
  };

  const BookCard = ({ book }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {getCoverUrl(book) ? (
            <img
              src={getCoverUrl(book)}
              alt={book.title}
              className="w-16 h-24 object-cover rounded shadow-sm"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
              <Book className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
            {book.title}
          </h3>
          <p className="text-gray-600 text-xs mb-2">
            by {formatAuthors(book.author_name)}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {book.first_publish_year && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <Calendar className="w-3 h-3 mr-1" />
                {book.first_publish_year}
              </span>
            )}
            {book.ebook_access === 'public' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <BookOpen className="w-3 h-3 mr-1" />
                E-book
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedBook(book)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              View Details
            </button>
            
            <div className="flex gap-1">
              <button
                onClick={() => toggleFavorite(book)}
                className={`p-1 rounded ${
                  favorites.some(fav => fav.key === book.key)
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                title="Add to Favorites"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleReadingList(book)}
                className={`p-1 rounded ${
                  readingList.some(item => item.key === book.key)
                    ? 'text-blue-500 hover:text-blue-600'
                    : 'text-gray-400 hover:text-blue-500'
                }`}
                title="Add to Reading List"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BookModal = ({ book, onClose }) => {
    if (!book) return null;
    
    return (
      <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">{book.title}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex gap-6 mb-4">
              {getCoverUrl(book) && (
                <img
                  src={getCoverUrl(book)}
                  alt={book.title}
                  className="w-32 h-48 object-cover rounded shadow-md"
                />
              )}
              
              <div className="flex-grow">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Author(s): </span>
                    {formatAuthors(book.author_name)}
                  </div>
                  {book.first_publish_year && (
                    <div>
                      <span className="font-semibold">First Published: </span>
                      {book.first_publish_year}
                    </div>
                  )}
                  {book.number_of_pages_median && (
                    <div>
                      <span className="font-semibold">Pages: </span>
                      {book.number_of_pages_median}
                    </div>
                  )}
                  {book.language && (
                    <div>
                      <span className="font-semibold">Languages: </span>
                      {book.language.slice(0, 3).join(', ')}
                    </div>
                  )}
                  {book.publisher && (
                    <div>
                      <span className="font-semibold">Publishers: </span>
                      {book.publisher.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
                
                {book.subject && (
                  <div className="mt-4">
                    <span className="font-semibold">Subjects: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {book.subject.slice(0, 10).map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => toggleFavorite(book)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  favorites.some(fav => fav.key === book.key)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Heart className="w-4 h-4" />
                {favorites.some(fav => fav.key === book.key) ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
              <button
                onClick={() => toggleReadingList(book)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  readingList.some(item => item.key === book.key)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {readingList.some(item => item.key === book.key) ? 'Remove from Reading List' : 'Add to Reading List'}
              </button>
              {book.key && (
                <a
                  href={`https://openlibrary.org${book.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on OpenLibrary
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">BookFinder</h1>
              <span className="text-sm text-gray-500">for College Students</span>
            </div>
            
            <nav className="flex gap-4">
              <button
                onClick={() => setCurrentView('search')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  currentView === 'search' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                onClick={() => setCurrentView('favorites')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  currentView === 'favorites' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favorites ({favorites.length})
              </button>
              <button
                onClick={() => setCurrentView('reading-list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  currentView === 'reading-list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Reading List ({readingList.length})
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentView === 'search' && (
          <>
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-grow">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search for books..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="subject">Subject</option>
                    <option value="isbn">ISBN</option>
                    <option value="general">General</option>
                  </select>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  
                  <button
                    onClick={searchBooks}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {/* Filters */}
                {showFilters && (
                  <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Publish Year
                      </label>
                      <input
                        type="text"
                        value={filters.publishYear}
                        onChange={(e) => setFilters({...filters, publishYear: e.target.value})}
                        placeholder="e.g., 2020"
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <select
                        value={filters.language}
                        onChange={(e) => setFilters({...filters, language: e.target.value})}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Any Language</option>
                        <option value="eng">English</option>
                        <option value="spa">Spanish</option>
                        <option value="fre">French</option>
                        <option value="ger">German</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.hasEbook}
                          onChange={(e) => setFilters({...filters, hasEbook: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Has E-book</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {books.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Found {books.length} books
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book, index) => (
                <BookCard key={`${book.key}-${index}`} book={book} />
              ))}
            </div>

            {books.length === 0 && searchQuery && !loading && (
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No books found</h3>
                <p className="text-gray-500">Try adjusting your search terms or filters</p>
              </div>
            )}
          </>
        )}

        {currentView === 'favorites' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Favorites</h2>
              <p className="text-gray-600">Books you've marked as favorites</p>
            </div>
            
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No favorites yet</h3>
                <p className="text-gray-500">Start searching and add books to your favorites!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((book, index) => (
                  <BookCard key={`fav-${book.key}-${index}`} book={book} />
                ))}
              </div>
            )}
          </>
        )}

        {currentView === 'reading-list' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Reading List</h2>
              <p className="text-gray-600">Books you want to read</p>
            </div>
            
            {readingList.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No books in your reading list</h3>
                <p className="text-gray-500">Add books from your search results to build your reading list!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readingList.map((book, index) => (
                  <BookCard key={`reading-${book.key}-${index}`} book={book} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Book Details Modal */}
      <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
};

export default BookFinder;