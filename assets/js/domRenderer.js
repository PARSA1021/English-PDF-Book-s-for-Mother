// assets/js/domRenderer.js

let bookData = []; // 전역 변수로 관리
let lastUpdated = '';

const mainContent = document.getElementById('main-content');
const favoritesSection = document.getElementById('favorites-section');
const favoritesBookshelf = document.getElementById('favorites-bookshelf');
const loadingOverlay = document.getElementById('loading-overlay');

// 데이터 로드 함수
export const loadBookData = async () => {
    try {
        // 캐시 방지를 위해 타임스탬프 추가
        const response = await fetch(`./assets/js/bookData.json?v=${Date.now()}`);
        const data = await response.json();
        bookData = data.categories;
        lastUpdated = data.lastUpdated;
        console.log(`Data loaded. Last updated: ${lastUpdated}`);
    } catch (e) {
        console.error("Failed to load book data", e);
    }
};

// 즐겨찾기 상태를 로컬 스토리지에서 로드모달 관련 엘리먼트
const pdfModal = document.getElementById('pdf-modal');
const pdfIframe = document.getElementById('pdf-iframe');
const pdfModalTitle = document.getElementById('pdf-modal-title');
const closePdfModalBtn = document.getElementById('close-pdf-modal');

// 즐겨찾기 상태를 로컬 스토리지에서 로드
const getFavorites = () => {
    try {
        const favorites = localStorage.getItem('moms-bookshelf-favorites');
        return favorites ? new Set(JSON.parse(favorites)) : new Set();
    } catch (e) {
        console.error("Failed to load favorites from localStorage", e);
        return new Set();
    }
};

// 즐겨찾기 상태를 로컬 스토리지에 저장
const saveFavorites = (favoritesSet) => {
    try {
        localStorage.setItem('moms-bookshelf-favorites', JSON.stringify(Array.from(favoritesSet)));
    } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
    }
};

let currentFavorites = getFavorites();

// 로딩 오버레이 표시/숨김
export const showLoadingOverlay = () => {
    loadingOverlay.classList.add('visible');
};

export const hideLoadingOverlay = () => {
    loadingOverlay.classList.remove('visible');
};

// PDF 모달 제어
export const openPdfModal = (pdfUrl, title) => {
    pdfModalTitle.textContent = title;
    pdfIframe.src = pdfUrl;
    pdfModal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

export const closePdfModal = () => {
    pdfModal.classList.remove('active');
    pdfIframe.src = '';
    document.body.style.overflow = '';
};

if (closePdfModalBtn) {
    closePdfModalBtn.addEventListener('click', closePdfModal);
}

// PDF 뷰어 URL 생성 함수
const getPdfViewerUrl = (pdfPath) => {
    // PDF.js 뷰어의 viewer.html 경로를 기준으로 PDF 파일 경로를 인코딩합니다.
    const encodedPdfPath = encodeURIComponent(pdfPath).replace(/%2F/g, '/');
    // 상대 경로로 변경하여 호환성 유지
    return `pdfjs/web/viewer.html?file=../../${encodedPdfPath}`;
};

// PDF 프리페치 함수
const prefetchPdf = (pdfPath) => {
    // 이미 캐시되어 있을 수 있으므로 fetch만 호출 (브라우저/서비스워커 캐시 활용)
    fetch(pdfPath, { mode: 'no-cors' }).catch(() => {});
};

// 책 카드 생성 함수
const createBookCard = (book) => {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.dataset.id = book.id;

    // 마우스 호버 시 PDF 미리 로드 (프리페치)
    bookCard.addEventListener('mouseenter', () => {
        prefetchPdf(book.pdf);
    }, { once: true }); // 한 번만 실행

    // 즐겨찾기 버튼
    const favoriteToggle = document.createElement('button');
    favoriteToggle.className = 'favorite-toggle';
    favoriteToggle.innerHTML = '❤'; // 하트로 변경
    favoriteToggle.setAttribute('aria-label', '즐겨찾기 토글');
    if (currentFavorites.has(book.id)) {
        favoriteToggle.classList.add('active');
    }

    favoriteToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(book.id, bookCard);
    });

    // PDF 뷰어 링크
    const pdfLink = document.createElement('a');
    pdfLink.href = '#';
    pdfLink.setAttribute('aria-label', `${book.title} PDF 열기`);

    pdfLink.addEventListener('click', (e) => {
        e.preventDefault();
        const viewerUrl = getPdfViewerUrl(book.pdf);
        openPdfModal(viewerUrl, book.title);
    });

    const bookCover = document.createElement('div');
    bookCover.className = 'book-cover';
    const img = document.createElement('img');
    img.src = book.image;
    img.alt = book.title;
    img.loading = 'lazy';
    
    img.onerror = () => {
        img.src = 'assets/icons/icon-512x512.png';
        img.classList.add('fallback-icon');
    };
    
    bookCover.appendChild(img);

    const title = document.createElement('h3');
    title.textContent = book.title;

    // 신규 배지 추가 (최근 7일 이내 추가된 경우)
    const isNew = (dateStr) => {
        if (!dateStr) return false;
        const added = new Date(dateStr);
        const diff = (new Date() - added) / (1000 * 60 * 60 * 24);
        return diff < 7;
    };

    if (isNew(book.addedDate)) {
        const newBadge = document.createElement('span');
        newBadge.className = 'new-badge';
        newBadge.textContent = 'NEW';
        bookCard.appendChild(newBadge);
    }

    pdfLink.appendChild(bookCover);
    pdfLink.appendChild(title);
    
    // N/A 정보가 아닌 경우에만 정보 표시
    if (book.extraInfo && book.extraInfo.type && book.extraInfo.type !== 'N/A') {
        const typeInfo = document.createElement('p');
        typeInfo.className = 'extra-info';
        typeInfo.textContent = book.extraInfo.type;
        pdfLink.appendChild(typeInfo);
    }

    bookCard.appendChild(favoriteToggle);
    bookCard.appendChild(pdfLink);

    return bookCard;
};

// 사이드바 카테고리 목록 렌더링
const renderSidebar = () => {
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '';

    // 즐겨찾기 항목 추가
    const favItem = document.createElement('li');
    favItem.className = 'category-item';
    const favLink = document.createElement('a');
    favLink.href = '#favorites-section';
    favLink.className = 'category-link';
    favLink.innerHTML = '💖 즐겨찾기';
    favItem.appendChild(favLink);
    categoryList.appendChild(favItem);

    // 각 시리즈 추가
    bookData.forEach(category => {
        const item = document.createElement('li');
        item.className = 'category-item';
        const link = document.createElement('a');
        link.href = `#${category.id}`;
        link.className = 'category-link';
        link.textContent = category.title;
        item.appendChild(link);
        categoryList.appendChild(item);
    });

    // 부드러운 스크롤 이벤트 및 액티브 클래스 처리
    const links = categoryList.querySelectorAll('.category-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // 기존 액티브 제거
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // 모바일에서 클릭 시 사이드바 닫기
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });

    // 스크롤 감시를 통한 액티브 클래스 자동 업데이트
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                links.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, observerOptions);

    // 모든 섹션 감시
    document.querySelectorAll('.book-category-section').forEach(section => {
        observer.observe(section);
    });
};

// 즐겨찾기 토글 함수
const toggleFavorite = (bookId, bookCardElement = null) => {
    if (currentFavorites.has(bookId)) {
        currentFavorites.delete(bookId);
    } else {
        currentFavorites.add(bookId);
    }
    saveFavorites(currentFavorites);
    updateFavoritesDisplay(); // 즐겨찾기 섹션 업데이트
    
    // 전체 페이지의 해당 책 카드 업데이트 (별 모양 활성화/비활성화)
    const allBookCards = document.querySelectorAll(`.book-card[data-id="${bookId}"] .favorite-toggle`);
    allBookCards.forEach(btn => {
        if (currentFavorites.has(bookId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

// 즐겨찾기 섹션 업데이트 함수
export const updateFavoritesDisplay = () => {
    favoritesBookshelf.innerHTML = ''; // 기존 즐겨찾기 목록 비우기
    const favoriteBooks = [];

    bookData.forEach(category => {
        category.books.forEach(book => {
            if (currentFavorites.has(book.id)) {
                favoriteBooks.push(book);
            }
        });
    });

    if (favoriteBooks.length > 0) {
        favoritesSection.style.display = 'block';
        favoriteBooks.forEach((book, index) => {
            const card = createBookCard(book);
            favoritesBookshelf.appendChild(card);
            setTimeout(() => card.classList.add('fade-in'), index * 50); // 애니메이션 지연
        });
        // 즐겨찾기 섹션에 비어있음 메시지 제거 (있다면)
        const emptyMessage = favoritesBookshelf.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
    } else {
        favoritesSection.style.display = 'none';
        // 즐겨찾기 목록이 비어있음을 표시
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '즐겨찾기에 추가된 책이 없습니다.';
        favoritesBookshelf.appendChild(emptyMessage);
    }
};

// 모든 책 시리즈 렌더링 함수
export const renderBooks = (searchTerm = '') => {
    mainContent.querySelectorAll('.book-category-section:not(#favorites-section)').forEach(section => section.remove());

    const normalizedSearchTerm = searchTerm.toLowerCase();
    
    // 사이드바 다시 렌더링 (검색어 없을 때만 또는 초기 1회)
    if (!searchTerm) {
        renderSidebar();
    }

    let anyBookFound = false;

    bookData.forEach(category => {
        const categorySection = document.createElement('section');
        categorySection.className = 'book-category-section';
        categorySection.id = category.id;

        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category.title;
        categoryTitle.setAttribute('tabindex', '0'); // 키보드 접근성
        categoryTitle.setAttribute('aria-expanded', 'true'); // 초기 상태
        categorySection.appendChild(categoryTitle);

        const bookshelf = document.createElement('div');
        bookshelf.className = 'bookshelf';
        categorySection.appendChild(bookshelf);

        let categoryHasVisibleBooks = false;

        category.books.forEach((book, index) => {
            const normalizedBookTitle = book.title.toLowerCase();
            const normalizedCategoryTitle = category.title.toLowerCase();
            
            // 검색어 필터링
            if (normalizedSearchTerm === '' || 
                normalizedBookTitle.includes(normalizedSearchTerm) ||
                normalizedCategoryTitle.includes(normalizedSearchTerm)) {
                
                const bookCard = createBookCard(book);
                bookshelf.appendChild(bookCard);
                setTimeout(() => bookCard.classList.add('fade-in'), index * 50); // 애니메이션 지연
                categoryHasVisibleBooks = true;
                anyBookFound = true;
            }
        });

        // 카테고리 내에 보이는 책이 없으면 숨김
        if (categoryHasVisibleBooks) {
            mainContent.appendChild(categorySection);
        }

        // 카테고리 제목 클릭 시 접기/펼치기 토글
        categoryTitle.addEventListener('click', () => {
            bookshelf.classList.toggle('hidden');
            const isHidden = bookshelf.classList.contains('hidden');
            categoryTitle.classList.toggle('collapsed', isHidden);
            categoryTitle.setAttribute('aria-expanded', (!isHidden).toString());
        });
        // 키보드 엔터/스페이스바로도 토글 가능하게
        categoryTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                bookshelf.classList.toggle('hidden');
                const isHidden = bookshelf.classList.contains('hidden');
                categoryTitle.classList.toggle('collapsed', isHidden);
                categoryTitle.setAttribute('aria-expanded', (!isHidden).toString());
            }
        });
    });

    // 검색 결과가 없을 때 메시지 표시
    const existingEmptyMessage = mainContent.querySelector('p.empty-message');
    if (!anyBookFound && normalizedSearchTerm !== '') {
        if (!existingEmptyMessage) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = `'${searchTerm}'에 대한 검색 결과가 없습니다.`;
            mainContent.appendChild(emptyMessage);
        } else {
            existingEmptyMessage.textContent = `'${searchTerm}'에 대한 검색 결과가 없습니다.`;
        }
    } else if (existingEmptyMessage) {
        existingEmptyMessage.remove(); // 검색 결과가 있거나 검색어가 비어있으면 메시지 제거
    }
};

// 초기 렌더링 시 즐겨찾기 업데이트
updateFavoritesDisplay();