// assets/js/main.js

import { renderBooks, updateFavoritesDisplay, closePdfModal, loadBookData } from './domRenderer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpModalBtn = document.getElementById('close-help-modal');

    // 데이터 먼저 로드
    await loadBookData();

    // 초기 렌더링
    renderBooks(); 
    updateFavoritesDisplay();

    // 도움말 모달
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            helpModal.classList.add('active');
        });
    }

    if (closeHelpModalBtn) {
        closeHelpModalBtn.addEventListener('click', () => {
            helpModal.classList.remove('active');
        });
    }

    // 사이드바 토글 (모바일)
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // 외부 클릭 시 사이드바 닫기
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            e.target !== menuToggle) {
            sidebar.classList.remove('active');
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePdfModal();
        }
    });

    // 검색 기능
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        renderBooks(searchTerm); // 검색어에 따라 책 필터링 및 렌더링
        
        // 검색어 입력 시 'X' 버튼 표시/숨김
        if (searchTerm.length > 0) {
            clearSearchBtn.style.display = 'flex'; // 'flex'로 변경하여 버튼 중앙 정렬
        } else {
            clearSearchBtn.style.display = 'none';
        }
    });

    // 검색 지우기 버튼
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = ''; // 입력 필드 지우기
        renderBooks(); // 모든 책 다시 렌더링
        clearSearchBtn.style.display = 'none'; // 버튼 숨기기
        searchInput.focus(); // 검색창에 다시 포커스
    });

    // PWA 서비스 워커 등록
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // 설치 배너 프롬프트 (PWA 설치 가능성 감지)
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        console.log('beforeinstallprompt fired. Deferred prompt saved.');

        // 여기에 사용자에게 설치 UI를 보여줄 수 있는 버튼 등을 활성화하는 로직 추가
        // 예: const installAppButton = document.getElementById('installApp');
        // installAppButton.style.display = 'block';
        // installAppButton.addEventListener('click', () => {
        //   deferredPrompt.prompt();
        //   deferredPrompt.userChoice.then((choiceResult) => {
        //     if (choiceResult.outcome === 'accepted') {
        //       console.log('User accepted the A2HS prompt');
        //     } else {
        //       console.log('User dismissed the A2HS prompt');
        //     }
        //     deferredPrompt = null;
        //   });
        // });
    });

    window.addEventListener('appinstalled', () => {
        // Hide the app-provided install promotion
        // installAppButton.style.display = 'none';
        console.log('PWA was successfully installed!');
    });
});