export class ApiService {
    constructor(options) {
        this.cache = new Map();
        this.baseUrl = (options && options.baseUrl ? String(options.baseUrl) : '').trim().replace(/\/+$/, '');
        this._bootstrapPromise = null;
    }

    _resolveBaseUrl() {
        if (this.baseUrl) return this.baseUrl;
        const cfg = (window && window.SupportHubConfig && typeof window.SupportHubConfig === 'object') ? window.SupportHubConfig : {};
        const raw = String(cfg.apiBaseUrl || '').trim();
        return raw ? raw.replace(/\/+$/, '') : '';
    }

    _buildUrl(path) {
        const base = this._resolveBaseUrl();
        if (!base) return path;
        if (!path) return base;
        return base + (path.startsWith('/') ? path : '/' + path);
    }

    async fetchJSON(path, options) {
        const url = this._buildUrl(path);
        const cacheKey = url;
        if (!options && this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            ...(options || {})
        });
        if (!res.ok) throw new Error('Failed to fetch ' + url + ' (' + res.status + ')');
        const data = await res.json();
        if (!options) this.cache.set(cacheKey, data);
        return data;
    }

    async _loadBootstrap() {
        if (this._bootstrapPromise) return this._bootstrapPromise;
        this._bootstrapPromise = (async () => {
            // Prefer backend bootstrap if present.
            try {
                const payload = await this.fetchJSON('/api/bootstrap');
                if (payload && typeof payload === 'object') return payload;
            } catch (_) {
                // Fall back to per-endpoint calls.
            }

            const [models, knowledge, policies, changelog, docs] = await Promise.all([
                this.fetchJSON('/api/models'),
                this.fetchJSON('/api/knowledge'),
                this.fetchJSON('/api/policies'),
                this.fetchJSON('/api/changelog'),
                this.fetchJSON('/api/documentation-links').catch(() => null)
            ]);

            return { models, knowledge, policies, changelog, docs };
        })();

        return this._bootstrapPromise;
    }

    async getModels() {
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.ModelsData ? boot : (boot && boot.models ? boot.models : null);
            if (payload && payload.ok && Array.isArray(payload.ModelsData)) return payload.ModelsData;
            if (payload && Array.isArray(payload.ModelsData)) return payload.ModelsData;
            if (payload && Array.isArray(payload.models)) return payload.models;
        } catch (_) {}
        return this.fetchJSON('/data/models.json');
    }

    async getPolicies() {
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.PoliciesData ? boot : (boot && boot.policies ? boot.policies : null);
            if (payload && payload.ok && payload.PoliciesData && typeof payload.PoliciesData === 'object') return payload.PoliciesData;
            if (payload && payload.PoliciesData && typeof payload.PoliciesData === 'object') return payload.PoliciesData;
            if (payload && payload.policies && typeof payload.policies === 'object') return payload.policies;
        } catch (_) {}
        return this.fetchJSON('/data/policies.json');
    }

    async getKnowledge() {
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.KnowledgeBaseData ? boot : (boot && boot.knowledge ? boot.knowledge : null);
            if (payload && payload.ok && Array.isArray(payload.KnowledgeBaseData)) return payload.KnowledgeBaseData;
            if (payload && Array.isArray(payload.KnowledgeBaseData)) return payload.KnowledgeBaseData;
            if (payload && Array.isArray(payload.knowledge)) return payload.knowledge;
        } catch (_) {}
        return this.fetchJSON('/data/knowledge.json');
    }

    async getChangelog() {
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.ChangelogEntriesData ? boot : (boot && boot.changelog ? boot.changelog : null);
            if (payload && payload.ok && Array.isArray(payload.ChangelogEntriesData)) return payload.ChangelogEntriesData;
            if (payload && Array.isArray(payload.ChangelogEntriesData)) return payload.ChangelogEntriesData;
            if (payload && Array.isArray(payload.changelogEntries)) return payload.changelogEntries;
            if (payload && Array.isArray(payload.entries)) return payload.entries;
        } catch (_) {}
        return this.fetchJSON('/data/changelog.json');
    }

    async getDocs() {
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.DocumentationLinksData ? boot : (boot && boot.docs ? boot.docs : null);
            if (payload && payload.ok && payload.DocumentationLinksData && typeof payload.DocumentationLinksData === 'object') return payload.DocumentationLinksData;
            if (payload && payload.DocumentationLinksData && typeof payload.DocumentationLinksData === 'object') return payload.DocumentationLinksData;
            if (payload && payload.documentationLinks && typeof payload.documentationLinks === 'object') return payload.documentationLinks;
        } catch (_) {}
        return this.fetchJSON('/data/documentation-links.json');
    }

    async getChassis() {
        // This data is typically bundled with models in the backend.
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.ModelPlatformChassisData ? boot : (boot && boot.models ? boot.models : null);
            if (payload && payload.ok && Array.isArray(payload.ModelPlatformChassisData)) return payload.ModelPlatformChassisData;
            if (payload && Array.isArray(payload.ModelPlatformChassisData)) return payload.ModelPlatformChassisData;
            if (payload && Array.isArray(payload.modelPlatformChassis)) return payload.modelPlatformChassis;
        } catch (_) {}
        return this.fetchJSON('/data/model-platform-chassis.json');
    }

    async getModelMedia() {
        // Model media is typically bundled with models in the backend.
        try {
            const boot = await this._loadBootstrap();
            const payload = boot && boot.ModelMediaData ? boot : (boot && boot.models ? boot.models : null);
            if (payload && payload.ok && payload.ModelMediaData && typeof payload.ModelMediaData === 'object') return payload.ModelMediaData;
            if (payload && payload.ModelMediaData && typeof payload.ModelMediaData === 'object') return payload.ModelMediaData;
            if (payload && payload.modelMedia && typeof payload.modelMedia === 'object') return payload.modelMedia;
        } catch (_) {}
        return this.fetchJSON('/data/model-media.json');
    }
}

export const api = new ApiService();
