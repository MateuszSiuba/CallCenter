export class Router {
    constructor() {
        this.views = {
            portal: document.getElementById('portalLanding'),
            splash: document.getElementById('splashScreen'),
            app: document.getElementById('appShell'),
            training: document.getElementById('trainingShell')
        };
        
        // Clean up legacy classes
        if (this.views.app && this.views.app.classList.contains('is-hidden')) {
            this.views.app.classList.remove('is-hidden');
            this.views.app.classList.add('hidden');
        }
    }

    navigate(viewName) {
        Object.values(this.views).forEach(el => {
            if (el) el.classList.add('hidden');
        });
        
        if (this.views[viewName]) {
            this.views[viewName].classList.remove('hidden');
            if (viewName === 'splash') {
                document.documentElement.classList.remove('resume-ready');
                this.views.splash.classList.remove('is-hiding');
                this.views.app?.classList.add('is-hidden');
            }
            if (viewName === 'app') {
                this.views.app?.classList.remove('is-hidden');
            }
        }
    }
}

export const router = new Router();
