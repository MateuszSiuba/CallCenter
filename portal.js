// portal.js - routing portalu i integracja wyłącznie z backendem API

function getPortalApiBaseUrl() {
    const runtimeConfig = (window && window.SupportHubConfig && typeof window.SupportHubConfig === 'object')
        ? window.SupportHubConfig
        : {};

    const rawUrl = String(runtimeConfig.apiBaseUrl || '').trim();
    return rawUrl ? rawUrl.replace(/\/+$/, '') : '';
}

function buildPortalApiUrl(path) {
    const baseUrl = getPortalApiBaseUrl();
    return baseUrl ? baseUrl + path : path;
}

// Globalny stan artykułów szkoleniowych
let trainingArticles = [];

document.addEventListener('DOMContentLoaded', () => {
    initPortalRouting();
});

function initPortalRouting() {
    // Pobranie elementów na podstawie dokładnej struktury Twojego index.html
    const btnCallCenter = document.getElementById('btnGoToCallCenter');
    const btnTraining = document.getElementById('btnGoToTraining');
    const btnBackToPortal = document.getElementById('btnBackToPortal');
    
    const portalLanding = document.getElementById('portalLanding');
    const appShell = document.getElementById('appShell');
    const trainingShell = document.getElementById('trainingShell');

    // 1. Obsługa wejścia do Call Center Tool
    if (btnCallCenter) {
        btnCallCenter.addEventListener('click', () => {
            console.log("Uruchamianie: Call Center Tool...");
            
            // Ukrywamy landing page portalu
            if (portalLanding) portalLanding.style.display = 'none';
            
            // Pokazujemy główną konsolę aplikacji (appShell)
            if (appShell) {
                appShell.style.display = 'block';
                appShell.classList.remove('is-hidden');
                appShell.classList.remove('hidden');
            }
            
            // Opcjonalnie: wyślij zdarzenie do app.js, jeśli wymaga odświeżenia/inicjalizacji parametrów
            window.dispatchEvent(new Event('resize')); 
        });
    }

    // 2. Obsługa wejścia do Training Materials
    if (btnTraining) {
        btnTraining.addEventListener('click', async () => {
            console.log("Uruchamianie: Training Materials...");
            
            // Ukrywamy landing page portalu
            if (portalLanding) portalLanding.style.display = 'none';
            
            // Pokazujemy powłokę szkoleniową (trainingShell)
            if (trainingShell) {
                trainingShell.style.display = 'block';
                trainingShell.classList.remove('hidden');
            }
            
            // Dynamicznie zaciągamy artykuły szkoleniowe z backendu
            await fetchTrainingArticles();
        });
    }

    // 3. Obsługa powrotu z modułu szkoleniowego do ekranu głównego (Global Portal)
    if (btnBackToPortal) {
        btnBackToPortal.addEventListener('click', () => {
            console.log("Powrót do ekranu głównego portalu.");
            
            if (trainingShell) trainingShell.style.display = 'none';
            if (appShell) {
                appShell.style.display = 'none';
                appShell.classList.add('is-hidden');
            }
            if (portalLanding) portalLanding.style.display = 'flex';
        });
    }
}

// Funkcja pobierająca artykuły szkoleniowe z bazy danych backendu
async function fetchTrainingArticles() {
    const trainingGrid = document.getElementById('trainingGrid');
    if (!trainingGrid) return;

    // Wstrzykujemy animowany loader na czas budzenia instancji na Renderze
    trainingGrid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mb-3"></div>
            <p class="text-slate-700 font-semibold text-sm">Pobieranie aktualnych materiałów treningowych...</p>
            <p class="text-xs text-slate-400 mt-1 max-w-md">Darmowe plany na platformie Render potrzebują około 50 sekund na automatyczne wybudzenie przy pierwszym zapytaniu.</p>
        </div>
    `;

    try {
        const response = await fetch(buildPortalApiUrl('/api/knowledge'), {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Backend zwrócił błąd ' + response.status);
        }

        const payload = await response.json();
        trainingArticles = Array.isArray(payload && payload.KnowledgeBaseData)
            ? payload.KnowledgeBaseData
            : [];
        renderTrainingArticles(trainingArticles);
    } catch (error) {
        console.error('Problem podczas pobierania artykułów treningowych:', error);
        trainingGrid.innerHTML = `
            <div class="col-span-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
                <p class="font-semibold text-sm">Nie udało się pobrać materiałów z backendu.</p>
                <p class="mt-1 text-xs">Sprawdź konfigurację API i status renderowanej usługi.</p>
            </div>
        `;
    }
}

// Funkcja generująca strukturę HTML dla pobranych artykułów
function renderTrainingArticles(articles) {
    const trainingGrid = document.getElementById('trainingGrid');
    if (!trainingGrid) return;

    if (!articles || articles.length === 0) {
        trainingGrid.innerHTML = `
            <p class="text-slate-500 col-span-full text-center py-6 text-sm">
                Brak dostępnych dynamicznych modułów szkoleniowych w bazie danych.
            </p>
        `;
        return;
    }

    trainingGrid.innerHTML = articles.map(article => `
        <div class="rounded-2xl border border-slate-200 p-5 hover:border-cyan-400 hover:shadow-md transition duration-200 cursor-pointer flex gap-4 items-start bg-white">
            <div class="rounded-lg bg-cyan-50 p-3 text-brand-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <div class="flex-1">
                <h3 class="font-semibold text-slate-900 leading-snug">${article.title || 'Moduł szkoleniowy'}</h3>
                <p class="text-xs text-slate-500 mt-1">${article.summary || 'Brak dodatkowego opisu struktury.'}</p>
                ${article.category ? `<span class="inline-block mt-3 px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">${article.category}</span>` : ''}
            </div>
        </div>
    `).join('');
}

