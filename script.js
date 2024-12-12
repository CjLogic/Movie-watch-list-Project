const OMDB_API_KEY = '6183ff91';

function removeFromWatchlist(imdbID) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    watchlist = watchlist.filter(movie => movie.imdbID !== imdbID);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showToast('Movie removed from watchlist', 'success');
    loadWatchlist(); // Refresh the display
}

function loadWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const watchlistContainer = document.querySelector('.watchlist-movies');

    if (watchlist.length === 0) {
        watchlistContainer.innerHTML = `
            <div class="empty-watchlist">
                <h2 class="start-exploring">Your Watchlist is looking a little empty...<i class="fa fa-plus-circle text_button" aria-hidden="true"><a href="index.html" class="text_button2"> Let's add some movies!</a></i></h2>
            </div>
        `;
        return;
    }

    watchlistContainer.innerHTML = watchlist.map(movie => `
        <div class="movie-card">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'placeholder-image.jpg'}"
                alt="${movie.Title}"
                class="movie-poster">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <p>Year: ${movie.Year}</p>
                <p>Rating: ⭐ ${movie.imdbRating}</p>
                <p>Runtime: ${movie.Runtime}</p>
                <p>Genre: ${movie.Genre}</p>
                <p>${movie.Plot}</p>
                <button class="btn btn-danger btn-sm"
                        onclick="removeFromWatchlist('${movie.imdbID}')">
                    Remove from Watchlist
                </button>
            </div>
        </div>
    `).join('');
}

async function addToWatchlist(imdbID) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

    if (watchlist.some(movie => movie.imdbID === imdbID)) {
        showToast('Movie already in watchlist', 'warning');
        return;
    }

    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}`);
        const movie = await response.json();
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        showToast('Added to watchlist!', 'success');
    } catch (error) {
        showToast('Error adding to watchlist', 'danger');
        console.error('Error:', error);
    }
}

function showToast(message, type = 'success') {
    const toastHTML = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    const toastContainer = document.getElementById('toast-container');
    toastContainer.innerHTML = toastHTML;
    const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
    toast.show();
}

document.addEventListener('DOMContentLoaded', () => {
    const isWatchlistPage = window.location.pathname.includes('watchlist.html');

    if (!isWatchlistPage) {

        const searchInput = document.getElementById('titleSearch');
        const searchButton = document.getElementById('searchButton');

        if (searchInput && searchButton) {

            async function searchMovies(searchTerm) {
                try {

                    const searchResponse = await fetch(`https://www.omdbapi.com/?s=${searchTerm}&apikey=${OMDB_API_KEY}`);
                    const searchData = await searchResponse.json();

                    if (searchData.Response === 'True') {

                        const detailedMovies = await Promise.all(
                            searchData.Search.map(async (movie) => {
                                const detailResponse = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${OMDB_API_KEY}`);
                                return await detailResponse.json();
                            })
                        );
                        return detailedMovies;
                    } else {
                        showToast(searchData.Error, 'danger');
                        return [];
                    }
                } catch (error) {
                    showToast('Error fetching movies', 'danger');
                    console.error('Error:', error);
                    return [];
                }
            }


            function displayMovies(movies) {
                const moviesContainer = document.querySelector('#movies-list');
                if (!moviesContainer) return;

                moviesContainer.innerHTML = movies.map(movie => `
                    <div class="movie-card">
                        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'placeholder-image.jpg'}"
                            alt="${movie.Title}"
                            class="movie-poster">
                        <div class="movie-info">
                            <h3>${movie.Title}</h3>
                            <p class="year">${movie.Year}</p>
                            <p class="rating">⭐ ${movie.imdbRating}</p>
                            <p class="runtime">${movie.Runtime}</p>
                            <p class="genre">${movie.Genre}</p>
                            <p class="plot">${movie.Plot}</p>
                            <button class="btn btn-info btn-sm"
                                onclick="addToWatchlist('${movie.imdbID}')">
                            Add To Watchlist
                        </button>
                        </div>
                    </div>
                `).join('');
            }


            async function performSearch() {
                const searchTerm = searchInput.value.trim();

                if (!searchTerm) {
                    showToast('Please enter a search term', 'warning');
                    return;
                }

                showToast('Searching movies...', 'info');
                const movies = await searchMovies(searchTerm);

                if (movies.length === 0) {
                    showToast('No movies found', 'info');
                } else {
                    showToast(`Found ${movies.length} movies`, 'success');
                    displayMovies(movies);
                }
            }


            searchButton.addEventListener('click', performSearch);


            searchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    if (isWatchlistPage) {
        loadWatchlist();
    }
});