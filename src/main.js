import { router } from './router.js';
import { api } from './api.js';
import { initCallCenterApp } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] DOMContentLoaded triggered');
    // 1. Navigation Init
    const btnGoToCallCenter = document.getElementById('btnGoToCallCenter');
    const btnGoToTraining = document.getElementById('btnGoToTraining');
    const btnBackToPortal = document.getElementById('btnBackToPortal');
    const btnBackToPortalApp = document.getElementById('btnBackToPortalApp');

    let callCenterAppInitialized = false;

    try {
        console.log('[App] Starting Call Center app initialization');
        await initCallCenterApp(api, { forceSplash: true });
        callCenterAppInitialized = true;
        console.log('[App] Call Center app initialized');
    } catch (error) {
        console.error('[App] Failed to init app', error);
        document.getElementById('global-loader')?.classList.add('hidden');
    }

    function showCallCenterSplash() {
        const portalLanding = document.getElementById('portalLanding');
        const splashScreen = document.getElementById('splashScreen');
        const appShell = document.getElementById('appShell');
        const trainingShell = document.getElementById('trainingShell');

        document.documentElement.classList.remove('resume-ready');
        portalLanding?.classList.add('hidden');
        trainingShell?.classList.add('hidden');
        appShell?.classList.add('hidden', 'is-hidden');
        splashScreen?.classList.remove('hidden', 'is-hiding');
    }

    btnGoToCallCenter?.addEventListener('click', async () => {
        showCallCenterSplash();

        if (!callCenterAppInitialized) {
            try {
                console.log('[App] Lazy retry Call Center app initialization');
                await initCallCenterApp(api, { forceSplash: true });
                callCenterAppInitialized = true;
            } catch (error) {
                console.error('[App] Failed to init app', error);
                document.getElementById('global-loader')?.classList.add('hidden');
            }
        }
    });

    btnGoToTraining?.addEventListener('click', () => {
        router.navigate('training');
    });

    btnBackToPortal?.addEventListener('click', () => {
        router.navigate('portal');
    });

    btnBackToPortalApp?.addEventListener('click', () => {
        router.navigate('portal');
    });

    // 2. Training tabs 
    const trainingTabs = document.querySelectorAll('.training-tab');
    const trainingModuleTitle = document.getElementById('trainingModuleTitle');
    const trainingGridBtn = document.querySelectorAll('#trainingGrid > div');
    const sideFilters = document.querySelectorAll('.w-full.lg\\:w-72.lg\\:shrink-0 .space-y-2 button');
    const filterLabel = document.querySelector('.w-full.lg\\:w-72.lg\\:shrink-0 p.text-xs');

    const trainingMaterials = {
        TV: [
            { title: '2026 TV Alignments', type: 'PDF Guides', meta: 'PDF Document • 2.4 MB' },
            { title: 'Titan OS Overview', type: 'Video Courses', meta: 'Video Course • 15 mins' }
        ],
        MNT: [
            { title: 'MNT Display Alignment Guide', type: 'PDF Guides', meta: 'PDF Document • 1.8 MB' },
            { title: 'Smart Monitor OS Overview', type: 'Video Courses', meta: 'Video Course • 12 mins' }
        ],
        AVA: [
            { title: 'AVA Product Alignment Guide', type: 'PDF Guides', meta: 'PDF Document • 2.1 MB' },
            { title: 'Audio Setup Overview', type: 'Video Courses', meta: 'Video Course • 10 mins' }
        ]
    };

    let currentTrainModule = 'TV';
    let currentTrainFilter = 'All Materials';

    function updateTrainingMaterials() {
        if (trainingModuleTitle) {
            trainingModuleTitle.textContent = currentTrainModule + ' Training Materials';
        }

        const materials = trainingMaterials[currentTrainModule] || trainingMaterials.TV;
        trainingGridBtn.forEach(item => {
            const material = materials[Number(item.dataset.trainingIndex || 0)];
            const h3 = item.querySelector('h3');
            const meta = item.querySelector('p');

            if (!material) {
                item.style.display = 'none';
                return;
            }

            item.dataset.type = material.type;
            if (h3) {
                h3.textContent = material.title;
            }
            if (meta) {
                meta.textContent = material.meta;
            }
            if (currentTrainFilter === 'All Materials' || material.type === currentTrainFilter) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    trainingTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            trainingTabs.forEach(t => {
                t.classList.remove('is-active', 'bg-slate-100', 'shadow-sm', 'text-slate-900');
                t.classList.add('text-slate-600');
            });
            const btn = e.currentTarget;
            btn.classList.add('is-active', 'bg-slate-100', 'shadow-sm', 'text-slate-900');
            btn.classList.remove('text-slate-600');
            currentTrainModule = btn.dataset.trainTab;
            updateTrainingMaterials();
        });
    });

    sideFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            sideFilters.forEach(b => {
                b.classList.remove('bg-blue-50', 'text-blue-700', 'font-semibold');
                b.classList.add('text-slate-600', 'font-medium');
            });
            const target = e.currentTarget;
            target.classList.replace('text-slate-600', 'text-blue-700');
            target.classList.replace('font-medium', 'font-semibold');
            target.classList.add('bg-blue-50');
            currentTrainFilter = target.textContent;
            if (filterLabel) {
                filterLabel.textContent = 'Filter applied: ' + currentTrainFilter;
            }
            updateTrainingMaterials();
        });
    });

    trainingGridBtn.forEach((item, idx) => {
        item.dataset.trainingIndex = String(idx);
    });
    updateTrainingMaterials();
});
