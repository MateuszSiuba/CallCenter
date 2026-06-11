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

        try {
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                ...(options || {})
            });

            if (!res.ok) {
                const message = 'Failed to fetch ' + url + ' (' + res.status + ')';
                const error = new Error(message);
                error.status = res.status;
                throw error;
            }

            const data = await res.json();
            if (!options) this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            if (error && error.status) {
                throw error;
            }

            const wrapped = new Error('Network error while fetching ' + url + ': ' + (error && error.message ? error.message : 'unknown error'));
            wrapped.cause = error;
            throw wrapped;
        }
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
        const boot = await this._loadBootstrap();
        const payload = boot && boot.ModelsData ? boot : (boot && boot.models ? boot.models : null);
        if (payload && payload.ok && Array.isArray(payload.ModelsData)) return payload.ModelsData;
        if (payload && Array.isArray(payload.ModelsData)) return payload.ModelsData;
        if (payload && Array.isArray(payload.models)) return payload.models;
        throw new Error('Backend did not return models data');
    }

    async getPolicies() {
        const boot = await this._loadBootstrap();
        const payload = boot && boot.PoliciesData ? boot : (boot && boot.policies ? boot.policies : null);
        if (payload && payload.ok && payload.PoliciesData && typeof payload.PoliciesData === 'object') return payload.PoliciesData;
        if (payload && payload.PoliciesData && typeof payload.PoliciesData === 'object') return payload.PoliciesData;
        if (payload && payload.policies && typeof payload.policies === 'object') return payload.policies;
        throw new Error('Backend did not return policies data');
    }

    async getKnowledge() {
        const boot = await this._loadBootstrap();
        const payload = boot && boot.KnowledgeBaseData ? boot : (boot && boot.knowledge ? boot.knowledge : null);
        if (payload && payload.ok && Array.isArray(payload.KnowledgeBaseData)) return payload.KnowledgeBaseData;
        if (payload && Array.isArray(payload.KnowledgeBaseData)) return payload.KnowledgeBaseData;
        if (payload && Array.isArray(payload.knowledge)) return payload.knowledge;
        throw new Error('Backend did not return knowledge data');
    }

    async getChangelog() {
        const boot = await this._loadBootstrap();
        const payload = boot && boot.ChangelogEntriesData ? boot : (boot && boot.changelog ? boot.changelog : null);
        if (payload && payload.ok && Array.isArray(payload.ChangelogEntriesData)) return payload.ChangelogEntriesData;
        if (payload && Array.isArray(payload.ChangelogEntriesData)) return payload.ChangelogEntriesData;
        if (payload && Array.isArray(payload.changelogEntries)) return payload.changelogEntries;
        if (payload && Array.isArray(payload.entries)) return payload.entries;
        throw new Error('Backend did not return changelog data');
    }

    async getDocs() {
        const boot = await this._loadBootstrap();
        const payload = boot && boot.DocumentationLinksData ? boot : (boot && boot.docs ? boot.docs : null);
        if (payload && payload.ok && payload.DocumentationLinksData && typeof payload.DocumentationLinksData === 'object') return payload.DocumentationLinksData;
        if (payload && payload.DocumentationLinksData && typeof payload.DocumentationLinksData === 'object') return payload.DocumentationLinksData;
        if (payload && payload.documentationLinks && typeof payload.documentationLinks === 'object') return payload.documentationLinks;
        throw new Error('Backend did not return documentation links data');
    }

    async getChassis() {
        // This data is typically bundled with models in the backend.
        const boot = await this._loadBootstrap();
        const payload = boot && boot.ModelPlatformChassisData ? boot : (boot && boot.models ? boot.models : null);
        if (payload && payload.ok && Array.isArray(payload.ModelPlatformChassisData)) return payload.ModelPlatformChassisData;
        if (payload && Array.isArray(payload.ModelPlatformChassisData)) return payload.ModelPlatformChassisData;
        if (payload && Array.isArray(payload.modelPlatformChassis)) return payload.modelPlatformChassis;
        throw new Error('Backend did not return chassis data');
    }

    async getModelMedia() {
        // Model media is typically bundled with models in the backend.
        const boot = await this._loadBootstrap();
        const payload = boot && boot.ModelMediaData ? boot : (boot && boot.models ? boot.models : null);
        if (payload && payload.ok && payload.ModelMediaData && typeof payload.ModelMediaData === 'object') return payload.ModelMediaData;
        if (payload && payload.ModelMediaData && typeof payload.ModelMediaData === 'object') return payload.ModelMediaData;
        if (payload && payload.modelMedia && typeof payload.modelMedia === 'object') return payload.modelMedia;
        throw new Error('Backend did not return model media data');
    }

    async searchModels(query) {
        const q = String(query || '').trim();
        if (!q) throw new Error('Search query is required');
        return this.fetchJSON('/api/models/search?q=' + encodeURIComponent(q));
    }
}

export const api = new ApiService();
