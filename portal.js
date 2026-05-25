document.addEventListener("DOMContentLoaded", () => {
    const portalLanding = document.getElementById("portalLanding");
    const splashScreen = document.getElementById("splashScreen");
    const appShell = document.getElementById("appShell");
    const trainingShell = document.getElementById("trainingShell");
    
    const btnGoToCallCenter = document.getElementById("btnGoToCallCenter");
    const btnGoToTraining = document.getElementById("btnGoToTraining");
    const btnBackToPortal = document.getElementById("btnBackToPortal");

    const trainingTabs = document.querySelectorAll(".training-tab");
    const trainingModuleTitle = document.getElementById("trainingModuleTitle");

    btnGoToCallCenter.addEventListener("click", () => {
        portalLanding.classList.add("hidden");
        // If appShell is still hidden, we must show splashScreen for region selection
        if (appShell.classList.contains("is-hidden")) {
            splashScreen.classList.remove("hidden");
        }
    });

    btnGoToTraining.addEventListener("click", () => {
        portalLanding.classList.add("hidden");
        trainingShell.classList.remove("hidden");
        
        // Hide others just in case
        splashScreen.classList.add("hidden");
        appShell.classList.add("is-hidden");
    });

    btnBackToPortal.addEventListener("click", () => {
        trainingShell.classList.add("hidden");
        portalLanding.classList.remove("hidden");
    });

    // Add back to portal button inside Call Center
    const ccHeader = document.querySelector("#appShell header .flex.items-center.gap-3");
    if (ccHeader) {
        const backToPortalBtnCode = `<button id="btnExitCallCenter" class="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>`;
        ccHeader.insertAdjacentHTML('afterbegin', backToPortalBtnCode);
        document.getElementById("btnExitCallCenter").addEventListener("click", () => {
            // We just overlay portalLanding again
            portalLanding.classList.remove("hidden");
        });
    }

    // Add back to portal button in splashScreen
    const splashControls = document.querySelector("#splashScreen .mt-8");
    if (splashControls) {
         // insert a back button beside/under continue or above region select
         const btnCode = `<button type="button" id="btnSplashToPortal" class="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300">Back to Portal</button>`;
         document.getElementById("continueBtn").insertAdjacentHTML("afterend", btnCode);
         document.getElementById("btnSplashToPortal").addEventListener("click", () => {
            splashScreen.classList.add("hidden");
            portalLanding.classList.remove("hidden");
         });
    }

    // Training tabs navigation
    trainingTabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            trainingTabs.forEach(t => t.classList.remove("is-active", "bg-slate-100", "shadow-sm", "text-slate-900"));
            trainingTabs.forEach(t => t.classList.add("text-slate-600"));
            
            const btn = e.currentTarget;
            btn.classList.add("is-active", "bg-slate-100", "shadow-sm", "text-slate-900");
            btn.classList.remove("text-slate-600");

            const moduleName = btn.dataset.trainTab;
            trainingModuleTitle.textContent = `${moduleName} Training Materials`;
            
            // Dummy content update based on tab
            const grid = document.getElementById("trainingGrid");
            if (moduleName === 'TV') {
                grid.innerHTML = `
                    <div class="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md transition cursor-pointer flex gap-4 items-start">
                            <div class="rounded-lg bg-red-50 p-3 text-red-500"><svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg></div>
                            <div><h3 class="font-semibold text-slate-900">2026 TV Alignments</h3><p class="text-xs text-slate-500 mt-1">PDF Document &bull; 2.4 MB</p></div>
                    </div>
                    <div class="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md transition cursor-pointer flex gap-4 items-start">
                            <div class="rounded-lg bg-brand-50 p-3 text-brand-500"><svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
                            <div><h3 class="font-semibold text-slate-900">Titan OS Overview</h3><p class="text-xs text-slate-500 mt-1">Video Course &bull; 15 mins</p></div>
                    </div>
                `;
            } else if (moduleName === 'MNT') {
                grid.innerHTML = `
                    <div class="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md transition cursor-pointer flex gap-4 items-start">
                            <div class="rounded-lg bg-red-50 p-3 text-red-500"><svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg></div>
                            <div><h3 class="font-semibold text-slate-900">Evnia Gaming Monitors 2026</h3><p class="text-xs text-slate-500 mt-1">PDF Document &bull; 4.1 MB</p></div>
                    </div>
                `;
            } else {
                grid.innerHTML = `
                    <div class="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md transition cursor-pointer flex gap-4 items-start">
                            <div class="rounded-lg bg-red-50 p-3 text-red-500"><svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg></div>
                            <div><h3 class="font-semibold text-slate-900">Fidelio Audio Systems Setup</h3><p class="text-xs text-slate-500 mt-1">PDF Document &bull; 1.8 MB</p></div>
                    </div>
                `;
            }
        });
    });
});
