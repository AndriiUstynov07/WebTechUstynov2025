document.addEventListener('DOMContentLoaded', () => {
    const booksGrid = document.getElementById('books-grid');
    const filtersContainer = document.getElementById('filters-container');
    const authorSearchInput = document.createElement('input');
    const sortSelect = document.getElementById('sort-select');
    const popup = document.getElementById('book-popup');
    const popupCloseBtn = document.getElementById('popup-close');
    const popupBookDetails = document.getElementById('popup-book-details');
    const favoritesBtn = document.getElementById('favorites-btn');
    const homeBtn = document.getElementById('home-btn');
    const sectionTitle = document.getElementById('section-title').querySelector('.section-title-text');

    let allBooks = [];
    let favorites = getFavorites();
    let currentView = 'all'; // 'all' or 'favorites'

    async function loadBooks() {
        try {
            const response = await fetch('books.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allBooks = await response.json();
            renderFilters(allBooks);
            applyFiltersAndSort();
            initEventListeners();
        } catch (error) {
            console.error('Error loading books:', error);
            booksGrid.innerHTML = '<p>Error loading books. Please check the console and ensure you are running this from a web server.</p>';
        }
    }

    function renderBooks(books) {
        booksGrid.innerHTML = '';
        if (books.length === 0) {
            booksGrid.innerHTML = '<p>No books found.</p>';
            return;
        }
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.innerHTML = `
                <div class="book-cover ${book.cover || ''}"></div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                </div>
            `;
            bookCard.addEventListener('click', () => openPopup(book));
            booksGrid.appendChild(bookCard);
        });
    }

    function renderFilters(books) {
        const genres = [...new Set(books.map(b => b.genre))];
        const years = [...new Set(books.map(b => b.year))].sort((a, b) => a - b);
        const languages = [...new Set(books.map(b => b.language))];

        filtersContainer.innerHTML = `
            <div class="filter-section">
                <h4 class="filter-title">Author</h4>
                <input type="text" class="text-input" id="author-search" placeholder="Enter author">
            </div>
            <div class="filter-section">
                <h4 class="filter-title">Genre</h4>
                <div class="filter-group" id="genre-filter">
                    ${genres.map(g => `
                        <label class="checkbox-item">
                            <input type="checkbox" value="${g}">
                            <span>${g}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="filter-section">
                <h4 class="filter-title">Year</h4>
                <div class="filter-group" id="year-filter">
                     ${years.map(y => `
                        <label class="checkbox-item">
                            <input type="checkbox" value="${y}">
                            <span>${y}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="filter-section">
                <h4 class="filter-title">Language</h4>
                <div class="filter-group" id="language-filter">
                     ${languages.map(l => `
                        <label class="checkbox-item">
                            <input type="checkbox" value="${l}">
                            <span>${l}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        document.getElementById('author-search').addEventListener('input', applyFiltersAndSort);
        document.querySelectorAll('#genre-filter input, #year-filter input, #language-filter input').forEach(el => {
            el.addEventListener('change', applyFiltersAndSort);
        });
    }
    
    function applyFiltersAndSort() {
        const booksToShow = currentView === 'favorites' ? allBooks.filter(b => favorites.includes(b.id)) : allBooks;
        const filteredBooks = filterAndSortBooks(booksToShow);
        renderBooks(filteredBooks);
    }

    function filterAndSortBooks(books) {
        const authorSearchEl = document.getElementById('author-search');
        const authorQuery = authorSearchEl ? authorSearchEl.value.toLowerCase() : '';
        
        const selectedGenres = Array.from(document.querySelectorAll('#genre-filter input:checked')).map(el => el.value);
        const selectedYears = Array.from(document.querySelectorAll('#year-filter input:checked')).map(el => parseInt(el.value));
        const selectedLanguages = Array.from(document.querySelectorAll('#language-filter input:checked')).map(el => el.value);

        let filtered = books.filter(book => {
            const authorMatch = book.author.toLowerCase().includes(authorQuery);
            const genreMatch = selectedGenres.length === 0 || selectedGenres.includes(book.genre);
            const yearMatch = selectedYears.length === 0 || selectedYears.includes(book.year);
            const languageMatch = selectedLanguages.length === 0 || selectedLanguages.includes(book.language);
            return authorMatch && genreMatch && yearMatch && languageMatch;
        });

        const sortValue = sortSelect.value;
        if (sortValue === 'year') {
            filtered.sort((a, b) => a.year - b.year);
        } else if (sortValue === 'genre') {
            filtered.sort((a, b) => a.genre.localeCompare(b.genre));
        }

        return filtered;
    }

    function openPopup(book) {
        popupBookDetails.innerHTML = `
            <div class="book-cover ${book.cover || ''}"></div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Year:</strong> ${book.year}</p>
                <p><strong>Genre:</strong> ${book.genre}</p>
                <p><strong>Language:</strong> ${book.language}</p>
                <p>${book.description}</p>
                <button class="btn btn-primary" id="add-to-favorites-btn" data-id="${book.id}">
                    ${favorites.includes(book.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
            </div>
        `;
        popup.style.display = 'flex';
        document.getElementById('add-to-favorites-btn').addEventListener('click', (e) => {
            const bookId = parseInt(e.target.dataset.id, 10);
            toggleFavorite(bookId);
            openPopup(book); 
             if(currentView === 'favorites') {
                applyFiltersAndSort();
                if (!favorites.includes(bookId)) {
                    closePopup();
                }
            }
        });
    }

    function closePopup() {
        popup.style.display = 'none';
    }

    function toggleFavorite(bookId) {
        const favIndex = favorites.indexOf(bookId);
        if (favIndex > -1) {
            favorites.splice(favIndex, 1);
        } else {
            favorites.push(bookId);
        }
        localStorage.setItem('favoriteBooks', JSON.stringify(favorites));
    }

    function getFavorites() {
        return JSON.parse(localStorage.getItem('favoriteBooks')) || [];
    }

    function showFavorites() {
        currentView = 'favorites';
        sectionTitle.textContent = 'Favorite Books';
        applyFiltersAndSort();
    }

    function showAllBooks() {
        currentView = 'all';
        sectionTitle.textContent = 'All Books';
        applyFiltersAndSort();
    }

    function initEventListeners() {
        popupCloseBtn.addEventListener('click', closePopup);
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closePopup();
            }
        });
        sortSelect.addEventListener('change', applyFiltersAndSort);
        favoritesBtn.addEventListener('click', showFavorites);
        homeBtn.addEventListener('click', showAllBooks);
    }

    loadBooks();

    // --- Мобільне/планшетне відкриття бокової панелі фільтрів ---
    const filterBtn = document.getElementById('filter-btn');
    const sidebar = document.querySelector('.sidebar');
    if (filterBtn && sidebar) {
        filterBtn.addEventListener('click', function (e) {
            sidebar.classList.toggle('active');
            e.stopPropagation();
        });
        document.addEventListener('click', function (e) {
            if (!sidebar.contains(e.target) && !filterBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
});
