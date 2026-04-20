(() => {
			const countryConfigs = {
				UK: {
					label: "United Kingdom (UK)"
				},
				PL: {
					label: "Poland (PL)"
				},
				DE: {
					label: "Germany (DE)"
				}
			};

			const moduleDescriptions = {
				TV: "TV module active. MNT and AVA are visual placeholders for future domains.",
				MNT: "MNT is currently a placeholder module. TV data remains active.",
				AVA: "AVA is currently a placeholder module. TV data remains active."
			};

			            const RelationalMockData = {
				ModelsData: window.ModelsData || (typeof ModelsData !== "undefined" ? ModelsData : []),
				PoliciesData: window.PoliciesData || (typeof PoliciesData !== "undefined" ? PoliciesData : {}),
				TroubleshootingData: window.TroubleshootingData || (typeof TroubleshootingData !== "undefined" ? TroubleshootingData : {}),
				KnowledgeBaseData: [
					...((Array.isArray(window.KnowledgeBaseData) ? window.KnowledgeBaseData : [])),
					...((typeof KnowledgeBaseData !== "undefined" && Array.isArray(KnowledgeBaseData)) ? KnowledgeBaseData : [])
				],
								ModelMediaData: window.ModelMediaData || (typeof ModelMediaData !== "undefined" ? ModelMediaData : {}),
						ModelPlatformChassisData: window.ModelPlatformChassisData || (typeof ModelPlatformChassisData !== "undefined" ? ModelPlatformChassisData : []),
						DocumentationLinksData: window.DocumentationLinksData || (typeof DocumentationLinksData !== "undefined" ? DocumentationLinksData : {})
			};

			const storageKeyCountry = "support-hub-country";
			const storageKeySession = "support-hub-session-v1";

			const splashScreen = document.getElementById("splashScreen");
			const countrySelect = document.getElementById("countrySelect");
			const continueBtn = document.getElementById("continueBtn");
			const appShell = document.getElementById("appShell");
			const splashHint = document.getElementById("splashHint");

			const countryBadge = document.getElementById("countryBadge");
			const printModeBtn = document.getElementById("printModeBtn");
			const changeCountryBtn = document.getElementById("changeCountryBtn");
			const changelogBtn = document.getElementById("changelogBtn");
			const changelogPanel = document.getElementById("changelogPanel");
			const closeChangelogBtn = document.getElementById("closeChangelogBtn");
			const changelogAccordion = document.getElementById("changelogAccordion");
			const changelogUnreadDot = document.getElementById("changelogUnreadDot");

			const moduleTabButtons = Array.from(document.querySelectorAll(".module-tab"));
			const moduleNotice = document.getElementById("moduleNotice");

			const globalSearch = document.getElementById("globalSearch");
			const omniSearchDropdown = document.getElementById("omniSearchDropdown");

			const yearFilter = document.getElementById("yearFilter");
			const osFilter = document.getElementById("osFilter");
			const panelFilter = document.getElementById("panelFilter");
			const activePath = document.getElementById("activePath");

			const modelResultsSection = document.getElementById("modelResultsSection");
			const modelGrid = document.getElementById("modelGrid");
			const resultsSectionTitle = document.getElementById("resultsSectionTitle");
			const resultsModeModelsBtn = document.getElementById("resultsModeModelsBtn");
			const resultsModeArticlesBtn = document.getElementById("resultsModeArticlesBtn");
			const resultCountBadge = document.getElementById("resultCountBadge");
			const emptyState = document.getElementById("emptyState");

			const modelDetailSection = document.getElementById("modelDetailSection");
			const detailTitle = document.getElementById("detailTitle");
			const detailSubTitle = document.getElementById("detailSubTitle");
			const detailBadges = document.getElementById("detailBadges");
			const detailTabButtons = Array.from(document.querySelectorAll(".detail-tab"));
			const detailPanes = Array.from(document.querySelectorAll("[data-pane]"));
			const backToResultsBtn = document.getElementById("backToResultsBtn");
			const printNowBtn = document.getElementById("printNowBtn");

			const articleViewSection = document.getElementById("articleViewSection");
			const articleTypeLabel = document.getElementById("articleTypeLabel");
			const articleTitle = document.getElementById("articleTitle");
			const articleSummary = document.getElementById("articleSummary");
			const articleContent = document.getElementById("articleContent");
			const articleRecommendationDock = document.getElementById("articleRecommendationDock");
			const articleBackBtn = document.getElementById("articleBackBtn");
			const articlePrintBtn = document.getElementById("articlePrintBtn");

			const quickInfoModal = document.getElementById("quickInfoModal");
			const quickInfoCard = document.getElementById("quickInfoCard");
			const quickInfoTitle = document.getElementById("quickInfoTitle");
			const quickInfoSummary = document.getElementById("quickInfoSummary");
			const quickInfoPoints = document.getElementById("quickInfoPoints");
			const quickInfoCloseBtn = document.getElementById("quickInfoCloseBtn");
			const quickInfoDismissBtn = document.getElementById("quickInfoDismissBtn");
			const quickInfoReadBtn = document.getElementById("quickInfoReadBtn");
			const quickInfoToast = document.getElementById("quickInfoToast");
			const specDetailsModal = document.getElementById("specDetailsModal");
			const specDetailsCard = document.getElementById("specDetailsCard");
			const specDetailsTitle = document.getElementById("specDetailsTitle");
			const specDetailsSummary = document.getElementById("specDetailsSummary");
			const specDetailsBody = document.getElementById("specDetailsBody");
			const specDetailsCloseBtn = document.getElementById("specDetailsCloseBtn");
			const specDetailsDismissBtn = document.getElementById("specDetailsDismissBtn");
			const imageZoomModal = document.getElementById("imageZoomModal");
			const imageZoomCard = document.getElementById("imageZoomCard");
			const imageZoomPreview = document.getElementById("imageZoomPreview");
			const imageZoomLoading = document.getElementById("imageZoomLoading");
			const imageZoomCloseBtn = document.getElementById("imageZoomCloseBtn");
			const zoomImageCache = new Set();
			let imageZoomLoadToken = 0;

			const scrollTopBtn = document.getElementById("scrollTopBtn");

			const state = {
				countryCode: "UK",
				activeModule: "TV",
				data: null,
				modelSearchIndex: null,
				globalSearchIndex: null,
				filteredModels: [],
				filteredArticles: [],
				selectedModelId: null,
				activeDetailTab: "specs",
				searchQuery: "",
				resultsView: "models",
				filters: {
					year: "all",
					os: "all",
					panel: "all"
				},
				printPreview: false,
				viewMode: "browse",
				quickInfoArticleId: null,
				articleBackModelId: null,
				quickInfoToastTimer: null,
				selectedSizeByModelId: {},
				specDetailsContext: null,
				articleViewContext: null,
				isRestoringSession: false,
				modelPlatformChassisLookup: null
			};

			const defaultChangelogEntries = [
				{
					id: "2026-04-15-v094",
					date: "15 Apr 2026",
					dateIso: "2026-04-15",
					version: "v0.9.4",
					title: "Changelog UX Refactor",
					details: [
						"Navbar: Replaced changelog icon with a proper bell-style SVG.",
						"Changelog Panel: Converted flat list into expandable accordion entries.",
						"Interaction: Added chevron rotation and toggle behavior for each entry."
					]
				}
			];

			const externalChangelogEntries = Array.isArray(window.ChangelogEntriesData)
				? window.ChangelogEntriesData
				: ((typeof ChangelogEntriesData !== "undefined" && Array.isArray(ChangelogEntriesData)) ? ChangelogEntriesData : []);

			const changelogEntries = (externalChangelogEntries.length > 0 ? externalChangelogEntries : defaultChangelogEntries)
				.map((entry, index) => {
					const parsedDate = Date.parse(safeText(entry && entry.dateIso, ""));
					return {
						id: safeText(entry && entry.id, "changelog-entry-" + String(index)),
						date: safeText(entry && entry.date, "Date not set"),
						dateIso: Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : "",
						version: safeText(entry && entry.version, "v0.0.0"),
						title: safeText(entry && entry.title, "Untitled update"),
						details: safeList(entry && entry.details)
							.map((detail) => safeText(detail, ""))
							.filter(Boolean)
					};
				})
				.sort((a, b) => {
					const tsA = a.dateIso ? Date.parse(a.dateIso) : 0;
					const tsB = b.dateIso ? Date.parse(b.dateIso) : 0;
					if (tsA !== tsB) {
						return tsB - tsA;
					}
					return b.id.localeCompare(a.id);
				});

			const changelogVisibleLimit = 4;
			const changelogVisibleEntries = changelogEntries.slice(0, changelogVisibleLimit);

			const changelogSeenStorageKey = "support-hub-changelog-seen-v1";
			const seenChangelogIds = new Set();

			const savedCountry = localStorage.getItem(storageKeyCountry);
			if (savedCountry && countryConfigs[savedCountry]) {
				countrySelect.value = savedCountry;
				splashHint.textContent = "Last used profile found. You can keep it or switch before continuing.";
			}

			function loadSeenChangelogIds() {
				try {
					const raw = localStorage.getItem(changelogSeenStorageKey);
					if (!raw) {
						return;
					}

					const parsed = JSON.parse(raw);
					if (!Array.isArray(parsed)) {
						return;
					}

					parsed.forEach((id) => {
						seenChangelogIds.add(String(id));
					});
				} catch (error) {
					// Ignore malformed localStorage values.
				}
			}

			function persistSeenChangelogIds() {
				localStorage.setItem(changelogSeenStorageKey, JSON.stringify(Array.from(seenChangelogIds)));
			}

			function updateChangelogUnreadDot() {
				if (!changelogUnreadDot) {
					return;
				}

				const allSeen = changelogVisibleEntries.every((entry) => seenChangelogIds.has(entry.id));
				changelogUnreadDot.classList.toggle("hidden", allSeen);
			}

			function normalizeText(value) {
				return String(value || "")
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.replace(/[^a-z0-9+]+/g, " ")
					.trim();
			}

			function compactText(value) {
				return normalizeText(value).replace(/\s+/g, "");
			}

			function safeText(value, fallback) {
				if (value === undefined || value === null) {
					return fallback;
				}

				const text = String(value).trim();
				return text ? text : fallback;
			}

			function safeList(value) {
				return Array.isArray(value) ? value : [];
			}

			function isPlainObject(value) {
				return value !== null && typeof value === "object" && !Array.isArray(value);
			}

			function normalizeDocumentationLinksData(value) {
				const source = isPlainObject(value) ? value : {};
				const woodpecker = isPlainObject(source.woodpecker) ? source.woodpecker : {};
				const manualsByModelRaw = isPlainObject(source.manualsByModel) ? source.manualsByModel : {};

				const manualsByModel = {};
				Object.entries(manualsByModelRaw).forEach(([modelCode, links]) => {
					const normalizedModelCode = safeText(modelCode, "").toUpperCase();
					if (!normalizedModelCode) {
						return;
					}

					const normalizedLinks = safeList(links)
						.map((entry) => {
							const label = safeText(entry && entry.label, "");
							const url = getSafeHttpUrl(entry && entry.url);
							if (!label || !url) {
								return null;
							}

							return { label, url };
						})
						.filter(Boolean);

					if (normalizedLinks.length > 0) {
						manualsByModel[normalizedModelCode] = normalizedLinks;
					}
				});

				return {
					woodpecker: {
						portalUrl: getSafeHttpUrl(woodpecker.portalUrl),
						searchUrlTemplate: safeText(woodpecker.searchUrlTemplate, "")
					},
					manualsByModel
				};
			}

			function joinNonEmpty(parts, separator) {
				return parts.filter((part) => safeText(part, "") !== "").join(separator);
			}

			function escapeHtml(value) {
				return String(value ?? "")
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/\"/g, "&quot;")
					.replace(/'/g, "&#39;");
			}

			function loadPersistedSessionState() {
				try {
					const raw = localStorage.getItem(storageKeySession);
					if (!raw) {
						return null;
					}

					const parsed = JSON.parse(raw);
					return isPlainObject(parsed) ? parsed : null;
				} catch (error) {
					return null;
				}
			}

			function buildSessionSnapshot() {
				return {
					countryCode: state.countryCode,
					activeModule: state.activeModule,
					viewMode: state.viewMode,
					selectedModelId: state.selectedModelId,
					activeDetailTab: state.activeDetailTab,
					resultsView: state.resultsView,
					searchQuery: state.searchQuery,
					filters: {
						year: state.filters.year,
						os: state.filters.os,
						panel: state.filters.panel
					},
					articleBackModelId: state.articleBackModelId,
					selectedSizeByModelId: state.selectedSizeByModelId,
					articleViewContext: state.articleViewContext
				};
			}

			function persistSessionState() {
				if (state.isRestoringSession) {
					return;
				}

				try {
					localStorage.setItem(storageKeySession, JSON.stringify(buildSessionSnapshot()));
				} catch (error) {
					// Ignore storage quota or privacy mode write failures.
				}
			}

			function clearPersistedSessionState() {
				localStorage.removeItem(storageKeySession);
			}

			function applyPersistedSessionState(snapshot) {
				if (!isPlainObject(snapshot)) {
					return;
				}

				const viewMode = safeText(snapshot.viewMode, "browse");
				state.viewMode = ["browse", "detail", "article"].includes(viewMode) ? viewMode : "browse";

				const activeModule = safeText(snapshot.activeModule, "TV");
				state.activeModule = moduleDescriptions[activeModule] ? activeModule : "TV";

				const resultsView = safeText(snapshot.resultsView, "models");
				state.resultsView = resultsView === "articles" ? "articles" : "models";

				state.searchQuery = safeText(snapshot.searchQuery, "");
				state.selectedModelId = safeText(snapshot.selectedModelId, "") || null;

				const activeDetailTab = safeText(snapshot.activeDetailTab, "specs");
				state.activeDetailTab = ["specs", "ports", "troubleshooting", "policies", "gallery"].includes(activeDetailTab)
					? activeDetailTab
					: "specs";

				const rawFilters = isPlainObject(snapshot.filters) ? snapshot.filters : {};
				state.filters = {
					year: safeText(rawFilters.year, "all") || "all",
					os: safeText(rawFilters.os, "all") || "all",
					panel: safeText(rawFilters.panel, "all") || "all"
				};

				state.articleBackModelId = safeText(snapshot.articleBackModelId, "") || null;
				state.selectedSizeByModelId = isPlainObject(snapshot.selectedSizeByModelId)
					? snapshot.selectedSizeByModelId
					: {};

				if (isPlainObject(snapshot.articleViewContext)) {
					const kind = safeText(snapshot.articleViewContext.kind, "");
					if (kind === "knowledge") {
						state.articleViewContext = {
							kind,
							id: safeText(snapshot.articleViewContext.id, "")
						};
					} else if (kind === "policy" && isPlainObject(snapshot.articleViewContext.payload)) {
						state.articleViewContext = {
							kind,
							payload: snapshot.articleViewContext.payload
						};
					} else {
						state.articleViewContext = null;
					}
				} else {
					state.articleViewContext = null;
				}

				if (globalSearch) {
					globalSearch.value = state.searchQuery;
				}
			}

			function restoreViewFromPersistedSession() {
				setArticleBackTarget(state.articleBackModelId || null);

				if (state.viewMode === "detail") {
					const model = getModelById(state.selectedModelId);
					if (model) {
						renderModelDetail(model);
						setViewMode("detail");
						return;
					}
				}

				if (state.viewMode === "article" && isPlainObject(state.articleViewContext)) {
					if (state.articleViewContext.kind === "knowledge") {
						const articleId = safeText(state.articleViewContext.id, "");
						if (articleId && getKnowledgeArticleById(articleId)) {
							openKnowledgeArticle(articleId, { fromModelId: state.articleBackModelId || state.selectedModelId || null });
							return;
						}
					}

					if (state.articleViewContext.kind === "policy" && isPlainObject(state.articleViewContext.payload)) {
						openPolicyArticle(state.articleViewContext.payload);
						return;
					}
				}

				setViewMode("browse");
			}

			function renderKnowledgePill(label, extraClasses, isInteractive) {
				const text = safeText(label, "-");
				const interactive = Boolean(isInteractive);
				const classes = [];

				if (interactive) {
					classes.push(
						"js-kb-pill",
						"cursor-pointer",
						"transition",
						"duration-150",
						"hover:bg-cyan-100",
						"hover:border-cyan-300",
						"focus-visible:outline-none",
						"focus-visible:ring-2",
						"focus-visible:ring-cyan-400"
					);
				}

				if (extraClasses) {
					classes.push(extraClasses);
				}

				const ariaRole = interactive ? " role=\"button\" tabindex=\"0\"" : "";
				const kbDataAttr = interactive ? (" data-kb-term=\"" + escapeHtml(text) + "\"") : "";

				return "<span"
					+ ariaRole
					+ " class=\""
					+ classes.join(" ")
					+ "\""
					+ kbDataAttr
					+ ">"
					+ escapeHtml(text)
					+ "</span>";
			}

			function getExplicitKnowledgeArticleByTerm(term, options) {
				if (!state.data) {
					return null;
				}

				const normalizedTerm = normalizeText(term);
				if (!normalizedTerm) {
					return null;
				}

				const contextModel = options && options.model ? options.model : null;
				let bestMatch = null;
				let bestScore = -1;

				safeList(state.data.KnowledgeBaseData).forEach((article) => {
					const profile = getArticleFilterProfile(article);
					if (contextModel && !isModelMatchingArticleScope(contextModel, profile)) {
						return;
					}

					const titleExact = normalizeText(article && article.title) === normalizedTerm;
					const tagExact = safeList(article && article.tags).some((tag) => normalizeText(tag) === normalizedTerm);
					if (!titleExact && !tagExact) {
						return;
					}

					let score = titleExact ? 300 : 220;
					if (contextModel && (safeList(profile.os).length > 0 || safeList(profile.panel).length > 0 || safeList(profile.years).length > 0)) {
						score += 20;
					}

					if (score > bestScore) {
						bestScore = score;
						bestMatch = article;
					}
				});

				return bestMatch;
			}

			function setArticleBackTarget(modelId) {
				state.articleBackModelId = modelId || null;

				if (!articleBackBtn) {
					persistSessionState();
					return;
				}

				if (!state.articleBackModelId) {
					articleBackBtn.textContent = "Back to model list";
					persistSessionState();
					return;
				}

				const model = getModelById(state.articleBackModelId);
				articleBackBtn.textContent = model
					? "Back to " + getModelName(model)
					: "Back to model list";
				persistSessionState();
			}

			function getArticleContentPoints(article) {
				const directPoints = safeList(article && article.contentPoints)
					.map((point) => safeText(point, ""))
					.filter(Boolean);

				if (directPoints.length > 0) {
					return directPoints.slice(0, 5);
				}

				const sectionPoints = safeList(article && article.sections)
					.flatMap((section) => {
						const bullets = safeList(section && section.bullets);
						if (bullets.length > 0) {
							return bullets;
						}

						return safeList(section && section.paragraphs).map((paragraph) => {
							const sentence = safeText(paragraph, "");
							if (!sentence) {
								return "";
							}
							const cutIndex = sentence.indexOf(".");
							return cutIndex > 0 ? sentence.slice(0, cutIndex + 1) : sentence;
						});
					})
					.map((point) => safeText(point, ""))
					.filter(Boolean);

				if (sectionPoints.length > 0) {
					return sectionPoints.slice(0, 5);
				}

				return safeList(article && article.tags)
					.map((tag) => "Related: " + safeText(tag, ""))
					.filter((text) => text !== "Related: ")
					.slice(0, 5);
			}

			function flattenObjectValues(value) {
				if (Array.isArray(value)) {
					return value.flatMap((item) => flattenObjectValues(item));
				}

				if (isPlainObject(value)) {
					return Object.values(value).flatMap((item) => flattenObjectValues(item));
				}

				if (value === undefined || value === null) {
					return [];
				}

				return [value];
			}

			function normalizeFilterTextList(values) {
				return Array.from(new Set(
					safeList(values)
						.map((value) => normalizeText(value))
						.filter(Boolean)
				));
			}

			function normalizeFilterYears(values) {
				return Array.from(new Set(
					safeList(values)
						.map((value) => Number(value))
						.filter((value) => Number.isFinite(value) && value >= 2000)
				));
			}

			function getTopicAliases(topicValue) {
				const normalized = normalizeText(topicValue);
				if (!normalized) {
					return [];
				}

				const aliases = [];
				if (normalized.includes("bluetooth")) {
					aliases.push("bluetooth");
				}
				if (normalized.includes("ambilight")) {
					aliases.push("ambilight");
				}
				if (normalized.includes("matter")) {
					aliases.push("matter");
				}
				if (normalized.includes("dolby vision")) {
					aliases.push("dolby vision");
				}
				if (normalized.includes("hdr10") || normalized === "hdr") {
					aliases.push("hdr");
				}

				return aliases;
			}

			function normalizeKnowledgeFilters(filters) {
				const raw = isPlainObject(filters) ? filters : {};
				const baseTopics = normalizeFilterTextList(raw.topics);
				const expandedTopics = Array.from(new Set([
					...baseTopics,
					...baseTopics.flatMap((topic) => getTopicAliases(topic))
				]));
				return {
					topics: expandedTopics,
					os: normalizeFilterTextList(raw.os),
					panel: normalizeFilterTextList(raw.panel),
					years: normalizeFilterYears(raw.years)
				};
			}

			function mergeKnowledgeFilters(baseFilters, nextFilters) {
				const base = normalizeKnowledgeFilters(baseFilters);
				const next = normalizeKnowledgeFilters(nextFilters);
				return {
					topics: Array.from(new Set([...(base.topics || []), ...(next.topics || [])])),
					os: Array.from(new Set([...(base.os || []), ...(next.os || [])])),
					panel: Array.from(new Set([...(base.panel || []), ...(next.panel || [])])),
					years: Array.from(new Set([...(base.years || []), ...(next.years || [])]))
				};
			}

			function inferArticleFilters(article) {
				const title = safeText(article && article.title, "");
				const tags = safeList(article && article.tags);
				const joined = normalizeText([title, ...tags].join(" "));
				const topics = [];
				const os = [];
				const panel = [];

				if (joined.includes("4 sided ambilight")) {
					topics.push("4 sided ambilight", "ambilight");
				}
				if (joined.includes("3 sided ambilight")) {
					topics.push("3 sided ambilight", "ambilight");
				}
				if (joined.includes("ambilight") && !topics.includes("ambilight")) {
					topics.push("ambilight");
				}
				if (joined.includes("matter dash") || joined.includes("ambiscape")) {
					topics.push("matter dash", "matter");
				}
				if (joined.includes("matter") && !topics.includes("matter")) {
					topics.push("matter");
				}
				if (joined.includes("dolby vision 2 max")) {
					topics.push("dolby vision 2 max", "dolby vision");
				}
				if (joined.includes("dolby vision") && !topics.includes("dolby vision")) {
					topics.push("dolby vision");
				}
				if (joined.includes("hdr10+")) {
					topics.push("hdr10+");
				}
				if (joined.includes("hdr10")) {
					topics.push("hdr10");
				}
				if (joined.includes("easylink")) {
					topics.push("easylink+");
				}
				if (joined.includes("auracast")) {
					topics.push("auracast");
				}
				if (joined.includes("bluetooth")) {
					topics.push("bluetooth");
				}
				if (joined.includes("vrr") || joined.includes("hdmi vrr")) {
					topics.push("hdmi vrr", "vrr");
				}

				if (joined.includes("titan os") || joined.includes("titan")) {
					os.push("titan os");
				}
				if (joined.includes("google tv") || joined.includes("google os") || joined.includes("android tv") || joined.includes("play store")) {
					os.push("google tv", "google os", "android tv");
				}

				if (joined.includes("oled")) {
					panel.push("oled");
				}
				if (joined.includes("mini led") || joined.includes("miniled")) {
					panel.push("miniled");
				}
				if (joined.includes("qled") || joined.includes("quantum dot") || joined.includes("dled qd")) {
					panel.push("qled");
				}

				return normalizeKnowledgeFilters({ topics, os, panel, years: [] });
			}

			function getArticleFilterProfile(article) {
				const explicit = normalizeKnowledgeFilters(article && article.filters);
				const inferred = inferArticleFilters(article);
				return {
					topics: explicit.topics.length ? explicit.topics : inferred.topics,
					os: explicit.os.length ? explicit.os : inferred.os,
					panel: explicit.panel.length ? explicit.panel : inferred.panel,
					years: explicit.years.length ? explicit.years : inferred.years
				};
			}

			function normalizeOsKey(value) {
				const normalized = normalizeText(value);
				if (!normalized) {
					return "";
				}
				if (normalized.includes("titan")) {
					return "titan";
				}
				if (normalized.includes("google") || normalized.includes("android")) {
					return "google";
				}
				return normalized;
			}

			function normalizePanelKey(value) {
				const normalized = normalizeText(value);
				if (!normalized) {
					return "";
				}
				if (normalized.includes("oled")) {
					return "oled";
				}
				if (normalized.includes("mini led") || normalized.includes("miniled")) {
					return "miniled";
				}
				if (normalized.includes("qled") || normalized.includes("dled qd") || normalized.includes("quantum dot")) {
					return "qled";
				}
				if (normalized.includes("dled") || normalized.includes("led")) {
					return "led";
				}
				return normalized;
			}

			function isModelMatchingArticleScope(model, articleProfile) {
				if (!model) {
					return false;
				}

				const osFilters = safeList(articleProfile && articleProfile.os).map((value) => normalizeOsKey(value)).filter(Boolean);
				if (osFilters.length > 0) {
					const modelOs = normalizeOsKey(getModelOS(model));
					if (!osFilters.includes(modelOs)) {
						return false;
					}
				}

				const panelFilters = safeList(articleProfile && articleProfile.panel).map((value) => normalizePanelKey(value)).filter(Boolean);
				if (panelFilters.length > 0) {
					const modelPanel = normalizePanelKey(getModelPanel(model));
					if (!panelFilters.includes(modelPanel)) {
						return false;
					}
				}

				const yearFilters = safeList(articleProfile && articleProfile.years).map((value) => Number(value)).filter((value) => Number.isFinite(value));
				if (yearFilters.length > 0) {
					const modelYear = getModelYearNumber(model);
					if (!yearFilters.includes(modelYear)) {
						return false;
					}
				}

				return true;
			}

			function areArticleScopesCompatible(baseProfile, candidateProfile) {
				function hasOverlapWithNormalizer(baseValues, candidateValues, normalizer) {
					const normalizedBase = safeList(baseValues).map((value) => normalizer(value)).filter(Boolean);
					const normalizedCandidate = safeList(candidateValues).map((value) => normalizer(value)).filter(Boolean);
					if (normalizedBase.length === 0 || normalizedCandidate.length === 0) {
						return true;
					}
					const baseSet = new Set(normalizedBase);
					return normalizedCandidate.some((value) => baseSet.has(value));
				}

				function hasNumericOverlap(baseValues, candidateValues) {
					const normalizedBase = safeList(baseValues).map((value) => Number(value)).filter((value) => Number.isFinite(value));
					const normalizedCandidate = safeList(candidateValues).map((value) => Number(value)).filter((value) => Number.isFinite(value));
					if (normalizedBase.length === 0 || normalizedCandidate.length === 0) {
						return true;
					}
					const baseSet = new Set(normalizedBase);
					return normalizedCandidate.some((value) => baseSet.has(value));
				}

				return hasOverlapWithNormalizer(baseProfile && baseProfile.os, candidateProfile && candidateProfile.os, normalizeOsKey)
					&& hasOverlapWithNormalizer(baseProfile && baseProfile.panel, candidateProfile && candidateProfile.panel, normalizePanelKey)
					&& hasNumericOverlap(baseProfile && baseProfile.years, candidateProfile && candidateProfile.years);
			}

			function getFeatureTopicMatchScore(term, candidateTopic) {
				const normalizedTerm = normalizeText(term);
				const normalizedCandidate = normalizeText(candidateTopic);
				if (!normalizedTerm || !normalizedCandidate) {
					return 0;
				}

				const termTokens = tokenizeNormalizedText(normalizedTerm);
				const candidateTokens = tokenizeNormalizedText(normalizedCandidate);
				if (termTokens.length === 1 && candidateTokens.includes(termTokens[0])) {
					return 220;
				}

				const score = computeKnowledgeMatchScore(
					normalizedTerm,
					normalizedTerm.replace(/\s+/g, ""),
					normalizedCandidate
				);
				if (score <= 0) {
					return 0;
				}

				const candidateSet = new Set(candidateTokens);
				const overlap = termTokens.filter((token) => candidateSet.has(token)).length;

				if (overlap === 0) {
					return 0;
				}

				const strictPhraseMatch = hasWholePhraseMatch(normalizedCandidate, normalizedTerm)
					|| hasWholePhraseMatch(normalizedTerm, normalizedCandidate);

				if (!strictPhraseMatch && termTokens.length >= 2 && overlap < 2) {
					return 0;
				}

				return score;
			}

			function getArticleTopicCandidates(article) {
				const stopWords = new Set([
					"what", "with", "from", "this", "that", "using", "into", "over", "your",
					"for", "the", "and", "are", "smart", "home", "standard", "article", "guide"
				]);

				const candidates = new Map();
				function addCandidate(rawValue, weight) {
					const normalized = normalizeText(rawValue);
					if (!normalized || normalized.length < 3) {
						return;
					}

					const existing = candidates.get(normalized);
					if (!existing || existing.weight < weight) {
						candidates.set(normalized, {
							normalized,
							compact: normalized.replace(/\s+/g, ""),
							weight
						});
					}
				}

				safeList(article && article.tags).forEach((tag) => {
					addCandidate(tag, 12);
					normalizeText(tag).split(/\s+/).forEach((token) => {
						if (token.length >= 4 && !stopWords.has(token)) {
							addCandidate(token, 6);
						}
					});
				});

				const titleText = normalizeText(article && article.title);
				addCandidate(titleText, 5);
				titleText.split(/\s+/).forEach((token) => {
					if (token.length >= 4 && !stopWords.has(token)) {
						addCandidate(token, 4);
					}
				});

				const summaryTokens = normalizeText(article && article.summary)
					.split(/\s+/)
					.filter((token) => token.length >= 5 && !stopWords.has(token))
					.slice(0, 8);
				summaryTokens.forEach((token) => addCandidate(token, 2));

				return Array.from(candidates.values());
			}

			function getRelatedKnowledgeArticles(article, limit) {
				if (!state.data) {
					return [];
				}

				const currentId = safeText(article && article.id, "");
				const currentProfile = getArticleFilterProfile(article);
				const currentCandidates = getArticleTopicCandidates(article);
				const currentTags = new Set(
					safeList(article && article.tags)
						.map((tag) => normalizeText(tag))
						.filter(Boolean)
				);
				const currentTopics = new Set(safeList(currentProfile && currentProfile.topics).map((topic) => normalizeText(topic)).filter(Boolean));
				const requireTopicOverlap = currentTopics.size > 0;

				return safeList(state.data.KnowledgeBaseData)
					.filter((candidate) => safeText(candidate && candidate.id, "") !== currentId)
					.map((candidate) => {
						const candidateProfile = getArticleFilterProfile(candidate);
						if (!areArticleScopesCompatible(currentProfile, candidateProfile)) {
							return {
								article: candidate,
								score: 0
							};
						}

						const candidateTopics = new Set(safeList(candidateProfile && candidateProfile.topics).map((topic) => normalizeText(topic)).filter(Boolean));
						const hasTopicOverlap = currentTopics.size > 0 && candidateTopics.size > 0
							? Array.from(currentTopics).some((topic) => candidateTopics.has(topic))
							: false;
						if (requireTopicOverlap && !hasTopicOverlap) {
							return {
								article: candidate,
								score: 0
							};
						}

						const candidateTags = new Set(
							safeList(candidate && candidate.tags)
								.map((tag) => normalizeText(tag))
								.filter(Boolean)
						);

						let score = 0;
						if (hasTopicOverlap) {
							score += 120;
						}
						currentTags.forEach((tag) => {
							if (candidateTags.has(tag)) {
								score += 20;
							}
						});

						const candidateTitle = normalizeText(candidate && candidate.title);
						const candidateSummary = normalizeText(candidate && candidate.summary);
						currentCandidates.forEach((topic) => {
							if (candidateTitle.includes(topic.normalized)) {
								score += topic.weight * 3;
							} else if (candidateSummary.includes(topic.normalized)) {
								score += topic.weight;
							}
						});

						return {
							article: candidate,
							score
						};
					})
					.filter((item) => item.score > 0)
					.sort((a, b) => b.score - a.score)
					.slice(0, limit || 3)
					.map((item) => item.article);
			}

			function getCompatibleModelsForArticle(article, limit) {
				if (!state.data) {
					return [];
				}

				const articleProfile = getArticleFilterProfile(article);

				const topics = safeList(articleProfile && articleProfile.topics).length > 0
					? safeList(articleProfile.topics).map((topic, index) => {
						const normalized = normalizeText(topic);
						return {
							normalized,
							compact: normalized.replace(/\s+/g, ""),
							weight: index === 0 ? 16 : 10
						};
					})
					: getArticleTopicCandidates(article);
				if (topics.length === 0) {
					return [];
				}

				const strictTerms = getArticleStrictTerms(article);
				let primaryTerm = strictTerms.length > 0 ? strictTerms[0] : null;
				const profileTopics = normalizeFilterTextList(articleProfile && articleProfile.topics);
				if (profileTopics.includes("bluetooth")) {
					primaryTerm = "bluetooth";
				}
				const primaryHasNumbers = primaryTerm
					? extractNumericTokens(tokenizeNormalizedText(primaryTerm)).length > 0
					: false;

				return safeList(state.data.ModelsData)
					.map((model) => {
						if (!isModelMatchingArticleScope(model, articleProfile)) {
							return null;
						}

						const capabilityValues = [
							getModelName(model),
							getModelOS(model),
							getModelPanel(model),
							...flattenFeatureValues(model && model.features),
							...flattenObjectValues(getModelSpecs(model)),
							...safeList(model && model.apps)
						];
						const normalizedCapabilities = capabilityValues
							.map((value) => normalizeText(value))
							.filter(Boolean);

						const haystack = normalizeText(capabilityValues.join(" "));
						const compactHaystack = haystack.replace(/\s+/g, "");

						let score = 0;
						if (primaryTerm) {
							const primaryScore = getBestCapabilityMatchScore(primaryTerm, normalizedCapabilities);
							if (primaryHasNumbers && primaryScore < 200) {
								return null;
							}
							if (!primaryHasNumbers && primaryScore < 120) {
								return null;
							}
							score += primaryScore * 2;
						}

						topics.forEach((topic) => {
							const topicScore = getBestCapabilityMatchScore(topic.normalized, normalizedCapabilities);
							if (topicScore >= 120) {
								score += topic.weight * 3;
							} else if (topicScore >= 70 || (topic.compact.length >= 4 && compactHaystack.includes(topic.compact))) {
								score += topic.weight;
							}
						});

						if (score <= 0 || (primaryTerm && score < 200)) {
							return null;
						}

						return {
							model,
							score
						};
					})
					.filter(Boolean)
					.sort((a, b) => b.score - a.score || getModelYearNumber(b.model) - getModelYearNumber(a.model))
					.slice(0, limit || 12)
					.map((item) => item.model);
			}

			function getArticleStrictTerms(article) {
				const profile = getArticleFilterProfile(article);
				const rawTerms = [...safeList(profile && profile.topics), safeText(article && article.title, ""), ...safeList(article && article.tags)]
					.map((value) => normalizeText(value))
					.filter((value) => value.length >= 3);

				const uniqueTerms = Array.from(new Set(rawTerms));
				const pruned = uniqueTerms.filter((term) => {
					const termNumbers = extractNumericTokens(tokenizeNormalizedText(term));
					return !uniqueTerms.some((other) => {
						if (other === term || !other.includes(term) || other.length <= term.length) {
							return false;
						}

						const otherNumbers = extractNumericTokens(tokenizeNormalizedText(other));
						return otherNumbers.length > 0 && termNumbers.length === 0;
					});
				});

				return pruned.sort((a, b) => {
					const aTokens = tokenizeNormalizedText(a);
					const bTokens = tokenizeNormalizedText(b);
					const aHasNum = extractNumericTokens(aTokens).length > 0;
					const bHasNum = extractNumericTokens(bTokens).length > 0;
					if (aHasNum !== bHasNum) {
						return aHasNum ? -1 : 1;
					}
					if (aTokens.length !== bTokens.length) {
						return bTokens.length - aTokens.length;
					}
					return b.length - a.length;
				});
			}

			function getBestCapabilityMatchScore(termNormalized, normalizedCapabilities) {
				let bestScore = 0;
				normalizedCapabilities.forEach((capability) => {
					const score = getFeatureTopicMatchScore(termNormalized, capability);
					if (score > bestScore) {
						bestScore = score;
					}
				});
				return bestScore;
			}

			function tokenizeNormalizedText(value) {
				return normalizeText(value)
					.split(/\s+/)
					.map((token) => token.trim())
					.filter(Boolean);
			}

			function extractNumericTokens(tokens) {
				const digits = [];
				tokens.forEach((token) => {
					const matches = token.match(/\d+/g);
					if (!matches) {
						return;
					}

					matches.forEach((match) => {
						digits.push(match);
					});
				});
				return digits;
			}

			function hasWholePhraseMatch(haystack, needle) {
				if (!haystack || !needle) {
					return false;
				}

				if (haystack === needle) {
					return true;
				}

				return haystack.startsWith(needle + " ")
					|| haystack.endsWith(" " + needle)
					|| haystack.includes(" " + needle + " ");
			}

			function computeKnowledgeMatchScore(termNormalized, termCompact, candidateText) {
				const candidateNormalized = normalizeText(candidateText);
				const candidateCompact = compactText(candidateText);

				if (!termNormalized || !candidateNormalized) {
					return 0;
				}

				if (termCompact && candidateCompact && termCompact === candidateCompact) {
					return 500;
				}

				if (termNormalized === candidateNormalized) {
					return 420;
				}

				const termTokens = tokenizeNormalizedText(termNormalized);
				const candidateTokens = tokenizeNormalizedText(candidateNormalized);
				if (termTokens.length === 0 || candidateTokens.length === 0) {
					return 0;
				}

				const termNumbers = extractNumericTokens(termTokens);
				const candidateNumbers = extractNumericTokens(candidateTokens);
				if (termNumbers.length === 0 && candidateNumbers.length > 0) {
					return -900;
				}
				if (termNumbers.length > 0 && candidateNumbers.length === 0) {
					return -900;
				}
				if (termNumbers.length > 0 && candidateNumbers.length > 0) {
					const candidateNumberSet = new Set(candidateNumbers);
					const hasSharedNumber = termNumbers.some((num) => candidateNumberSet.has(num));
					if (!hasSharedNumber) {
						return -1000;
					}
				}

				let score = 0;
				if (hasWholePhraseMatch(candidateNormalized, termNormalized)) {
					score += 150;
				}
				if (hasWholePhraseMatch(termNormalized, candidateNormalized)) {
					score += 90;
				}

				const candidateTokenSet = new Set(candidateTokens);
				let overlap = 0;
				termTokens.forEach((token) => {
					if (candidateTokenSet.has(token)) {
						overlap += 1;
					}
				});

				if (overlap === 0) {
					return 0;
				}

				const termCoverage = overlap / termTokens.length;
				const candidateCoverage = overlap / candidateTokens.length;
				score += overlap * 35;
				score += Math.round(termCoverage * 80);
				score += Math.round(candidateCoverage * 30);

				if (termNumbers.length === 0 && candidateNumbers.length > 0 && termTokens.length <= 2) {
					score -= 70;
				}

				return score;
			}

			function hideQuickInfoModal() {
				state.quickInfoArticleId = null;
				if (quickInfoModal) {
					quickInfoModal.classList.add("hidden");
				}
			}

			function showQuickInfoToast(message) {
				if (!quickInfoToast) {
					return;
				}

				quickInfoToast.textContent = message;
				quickInfoToast.classList.remove("hidden");

				if (state.quickInfoToastTimer) {
					window.clearTimeout(state.quickInfoToastTimer);
				}

				state.quickInfoToastTimer = window.setTimeout(() => {
					quickInfoToast.classList.add("hidden");
					state.quickInfoToastTimer = null;
				}, 2400);
			}

			function showQuickInfoModal(article) {
				if (!quickInfoModal || !quickInfoTitle || !quickInfoSummary || !quickInfoPoints) {
					return;
				}

				state.quickInfoArticleId = safeText(article && article.id, "");
				quickInfoTitle.textContent = safeText(article && article.title, "Knowledge Base");
				quickInfoSummary.textContent = safeText(article && article.summary, "No summary available.");
				quickInfoPoints.innerHTML = "";

				const points = getArticleContentPoints(article);
				if (points.length === 0) {
					const item = document.createElement("li");
					item.textContent = "No detailed points available yet.";
					quickInfoPoints.appendChild(item);
				} else {
					points.forEach((point) => {
						const item = document.createElement("li");
						item.textContent = point;
						quickInfoPoints.appendChild(item);
					});
				}

				quickInfoModal.classList.remove("hidden");
			}

			function hideSpecDetailsModal() {
				state.specDetailsContext = null;
				if (specDetailsModal) {
					specDetailsModal.classList.add("hidden");
				}
			}

			function setImageZoomLoadingState(isLoading) {
				if (imageZoomLoading) {
					imageZoomLoading.classList.toggle("hidden", !isLoading);
					imageZoomLoading.classList.toggle("flex", isLoading);
				}

				if (imageZoomPreview) {
					imageZoomPreview.classList.toggle("opacity-0", isLoading);
				}
			}

			function preloadZoomImage(value) {
				const imageUrl = getSafeHttpUrl(value);
				if (!imageUrl || zoomImageCache.has(imageUrl)) {
					return Promise.resolve(imageUrl);
				}

				return new Promise((resolve) => {
					const probe = new Image();
					probe.decoding = "async";
					probe.onload = () => {
						zoomImageCache.add(imageUrl);
						resolve(imageUrl);
					};
					probe.onerror = () => {
						resolve("");
					};
					probe.src = imageUrl;
				});
			}

			function primeZoomImageFromTarget(target) {
				if (!(target instanceof Element)) {
					return;
				}

				const zoomableImage = target.closest(".js-zoomable-image");
				if (!zoomableImage) {
					return;
				}

				const zoomSrc = safeText(zoomableImage.getAttribute("data-zoom-src"), zoomableImage.getAttribute("src") || "");
				if (!zoomSrc) {
					return;
				}

				preloadZoomImage(zoomSrc);
			}

			function primeZoomImagesInContainer(container) {
				if (!(container instanceof Element)) {
					return;
				}

				const zoomUrls = Array.from(container.querySelectorAll(".js-zoomable-image"))
					.map((image) => safeText(image.getAttribute("data-zoom-src"), image.getAttribute("src") || ""))
					.filter(Boolean);

				zoomUrls.forEach((zoomUrl, index) => {
					window.setTimeout(() => {
						preloadZoomImage(zoomUrl);
					}, index * 90);
				});
			}

			function primeModelMediaZoomImages(model) {
				const media = getModelMedia(model);
				if (!media) {
					return;
				}

				const zoomCandidates = [
					getRenderableImageUrl(getSafeHttpUrl(media.frontImageUrl), 2400),
					getRenderableImageUrl(getSafeHttpUrl(media.remoteImageUrl), 2400),
					getRenderableImageUrl(getSafeHttpUrl(media.portsImageUrl), 2400)
				].filter(Boolean);

				zoomCandidates.forEach((zoomUrl, index) => {
					window.setTimeout(() => {
						preloadZoomImage(zoomUrl);
					}, 60 + (index * 120));
				});
			}

			function hideImageZoomModal() {
				imageZoomLoadToken += 1;
				setImageZoomLoadingState(false);

				if (imageZoomModal) {
					imageZoomModal.classList.add("hidden");
				}

				if (imageZoomPreview) {
					imageZoomPreview.setAttribute("src", "");
					imageZoomPreview.setAttribute("alt", "Zoom preview");
				}
			}

			function showImageZoomModal(src, altText) {
				const imageUrl = getSafeHttpUrl(src);
				if (!imageZoomModal || !imageZoomPreview || !imageUrl) {
					return;
				}

				const loadToken = imageZoomLoadToken + 1;
				imageZoomLoadToken = loadToken;

				imageZoomPreview.setAttribute("src", "");
				imageZoomPreview.setAttribute("alt", safeText(altText, "Zoom preview"));
				imageZoomModal.classList.remove("hidden");

				if (zoomImageCache.has(imageUrl)) {
					imageZoomPreview.setAttribute("src", imageUrl);
					setImageZoomLoadingState(false);
					return;
				}

				setImageZoomLoadingState(true);
				preloadZoomImage(imageUrl).then((loadedUrl) => {
					if (loadToken !== imageZoomLoadToken) {
						return;
					}

					imageZoomPreview.setAttribute("src", loadedUrl || imageUrl);
					setImageZoomLoadingState(false);
				});
			}

			function getSpecDetailsModalConfig(detailType) {
				const modalConfig = {
					audio: {
						title: "Audio Specifications - Full View",
						summary: "Extended audio fields from Philips technical sheet.",
						categoryPatterns: [/^Sound$/i, /^Dźwięk$/i],
						keyPatterns: [/Audio/i, /Dźwięk/i, /Głośnik/i, /Subwoofer/i, /Dolby/i, /DTS/i, /Moc wyjściowa/i, /Output power/i]
					},
					connectivity: {
						title: "Connectivity - Full View",
						summary: "Wireless and wired communication details for advanced troubleshooting.",
						categoryPatterns: [/^Connectivity$/i, /^Łączność/i],
						keyPatterns: [/Wi[-\s]?Fi/i, /Bluetooth/i, /Ethernet/i, /HDMI/i, /USB/i, /ARC/i, /eARC/i, /HDCP/i, /VRR/i]
					},
					dimensions: {
						title: "Dimensions - Full View",
						summary: "Packed and unpacked dimensions for logistics and support calls.",
						categoryPatterns: [/^Dimensions$/i, /^Wymiary$/i],
						keyPatterns: [/Dimensions/i, /Wymiary/i, /Telewizor bez podstawy/i, /TV without stand/i, /Telewizor z podstawą/i, /TV with stand/i, /Packaged/i, /Opakowanie/i, /Weight/i, /Waga/i]
					}
				};

				return modalConfig[detailType] || modalConfig.audio;
			}

			function collectUniqueTechnicalRows(model, modalConfig) {
				const rowsByCategory = collectTechnicalRowsByCategory(model, modalConfig.categoryPatterns);
				const rowsByKeys = collectTechnicalRowsByFlatKeys(model, modalConfig.keyPatterns);
				const uniqueRows = [];
				const seenKeys = new Set();

				rowsByCategory.concat(rowsByKeys).forEach((row) => {
					const uniqueKey = [row.category, row.label, row.value].join("||");
					if (seenKeys.has(uniqueKey)) {
						return;
					}
					seenKeys.add(uniqueKey);
					uniqueRows.push(row);
				});

				return uniqueRows;
			}

			function collectDimensionsScrewRows(model) {
				const specs = getModelSpecs(model);
				const rows = [];

				const standMountScrew = safeText(specs.standMountScrew, "");
				if (standMountScrew) {
					rows.push({
						category: "Mounting Screws",
						label: "Stand Mount Screw",
						value: standMountScrew
					});
				}

				const vesaScrewType = safeText(specs.vesaScrewType, "");
				const rawVesaLength = safeText(specs.vesaScrewLengthMm, "");
				let normalizedVesaLength = rawVesaLength.replace(/\s+/g, "").replace(/~/g, "-");
				if (normalizedVesaLength && !/mm$/i.test(normalizedVesaLength)) {
					normalizedVesaLength += "mm";
				}

				const vesaScrewCombined = [vesaScrewType, normalizedVesaLength].filter(Boolean).join(" ");
				if (vesaScrewCombined) {
					rows.push({
						category: "Mounting Screws",
						label: "VESA Screw",
						value: vesaScrewCombined
					});
				}

				return rows;
			}

			function renderSpecDetailsModalFromContext() {
				if (!specDetailsModal || !specDetailsTitle || !specDetailsSummary || !specDetailsBody) {
					return;
				}

				const context = state.specDetailsContext;
				if (!context) {
					return;
				}

				const model = getModelById(context.modelId);
				if (!model) {
					return;
				}

				const selectedConfig = getSpecDetailsModalConfig(context.detailType);
				let scopedModel = model;
				let controlsHtml = "";
				let selectedSizeLabel = "";
				let sizeOptionsCount = 0;

				if (context.detailType === "dimensions") {
					let selectedSize = getModelSelectedSize(model);
					const sizeOptions = getModelSizes(model);
					sizeOptionsCount = sizeOptions.length;
					if (sizeOptions.length > 0 && !sizeOptions.includes(normalizeModelSize(selectedSize))) {
						const primary = normalizeModelSize(getModelPrimarySize(model));
						selectedSize = sizeOptions.includes(primary) ? primary : sizeOptions[0];
					}
					selectedSizeLabel = formatSizeWithInch(selectedSize);
					scopedModel = getModelForSize(model, selectedSize, { fallbackToBase: false });

					if (sizeOptions.length > 1) {
						const sizeButtons = sizeOptions
							.map((size) => {
								const normalizedSize = normalizeModelSize(size);
								const isActive = normalizedSize === normalizeModelSize(selectedSize);
								const buttonClass = isActive
									? "border-cyan-300 bg-cyan-50 text-brand-700"
									: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
								return ""
									+ "<button type=\"button\" data-spec-size=\"" + escapeHtml(normalizedSize) + "\" class=\"js-spec-size-trigger rounded-md border px-2 py-1 text-xs font-semibold transition " + buttonClass + "\">"
									+ escapeHtml(formatSizeWithInch(normalizedSize))
									+ "</button>";
							})
							.join("");

						controlsHtml = ""
							+ "<div class=\"mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3\">"
							+ "<p class=\"text-xs font-semibold uppercase tracking-[0.12em] text-slate-500\">Screen Size</p>"
							+ "<div class=\"mt-2 flex flex-wrap gap-2\">" + sizeButtons + "</div>"
							+ "</div>";
					}
				}

				let uniqueRows = collectUniqueTechnicalRows(scopedModel, selectedConfig);
				if (context.detailType === "connectivity") {
					const hiddenConnectivityFieldPatterns = [
						/^Number of HDMI connections$/i,
						/^Number of USBs?$/i,
						/^HDMI ARC$/i,
						/^HDMI 2\.1 features$/i,
						/^EasyLink 2\.0$/i
					];

					uniqueRows = uniqueRows.filter((row) => {
						const label = safeText(row && row.label, "");
						return !hiddenConnectivityFieldPatterns.some((pattern) => pattern.test(label));
					});
				}
				if (context.detailType === "dimensions") {
					const screwRows = collectDimensionsScrewRows(scopedModel || model);
					screwRows.forEach((row) => {
						const duplicate = uniqueRows.some((existing) => {
							return existing.category === row.category && existing.label === row.label && existing.value === row.value;
						});
						if (!duplicate) {
							uniqueRows.push(row);
						}
					});
				}
				const modalModelName = getModelName(scopedModel || model);
				const modalTitleSuffix = context.detailType === "dimensions" && selectedSizeLabel
					? modalModelName + " (" + selectedSizeLabel + ")"
					: modalModelName;
				let emptyMessage = "No extended technical fields available for this section.";
				if (context.detailType === "dimensions") {
					emptyMessage = "No dimensions data for selected size " + (selectedSizeLabel || "-") + ".";
					if (sizeOptionsCount > 1) {
						emptyMessage += " Try another size.";
					}
				}
				specDetailsTitle.textContent = selectedConfig.title + " - " + modalTitleSuffix;
				specDetailsSummary.textContent = selectedConfig.summary;
				specDetailsBody.innerHTML = controlsHtml + renderTechnicalRowsTable(uniqueRows, emptyMessage);
				specDetailsModal.classList.remove("hidden");
			}

			function showSpecDetailsModal(model, detailType) {
				if (!model) {
					return;
				}

				state.specDetailsContext = {
					modelId: getModelKey(model),
					detailType: safeText(detailType, "audio")
				};

				renderSpecDetailsModalFromContext();
			}

			function getModelKey(model, index) {
				if (model && model.__key) {
					return String(model.__key);
				}

				if (model && safeText(model.id, "") !== "") {
					return String(model.id);
				}

				const fallbackIndex = typeof index === "number" ? index : 0;
				const rawKey = [
					safeText(model && model.modelName, "model"),
					safeText(model && model.year, ""),
					safeText(model && model.osProfileId, ""),
					safeText(model && model.panelType, ""),
					String(fallbackIndex)
				].join("|");

				return "m_" + compactText(rawKey || String(fallbackIndex));
			}

			function getModelName(model) {
				return safeText(model && model.modelName, "-");
			}

			function normalizeModelLookupName(value) {
				return safeText(value, "")
					.toUpperCase()
					.replace(/\s+/g, "")
					.replace(/_/g, "")
					.replace(/\/.*$/, "");
			}

			function getModelLookupKeys(modelName, yearValue) {
				const normalized = normalizeModelLookupName(modelName);
				if (!normalized) {
					return [];
				}

				const yearNumber = Number(yearValue);
				const keys = [];

				if (Number.isFinite(yearNumber) && yearNumber > 0) {
					keys.push(String(yearNumber) + "|" + normalized);
				}

				keys.push("*|" + normalized);

				return keys;
			}

			function buildModelPlatformChassisLookup(records) {
				const lookup = new Map();

				const mergeEntry = (key, nextValue) => {
					const existing = lookup.get(key) || { platform: "", chassis: "" };
					lookup.set(key, {
						platform: existing.platform || nextValue.platform,
						chassis: existing.chassis || nextValue.chassis
					});
				};

				safeList(records).forEach((record) => {
					const modelName = safeText(record && record.modelName, "");
					const year = Number(record && record.year);
					const platform = safeText(record && record.platform, "");
					const chassis = safeText(record && record.chassis, "");

					if (!modelName || (!platform && !chassis)) {
						return;
					}

					const keys = getModelLookupKeys(modelName, year);
					if (keys.length === 0) {
						return;
					}

					const value = { platform, chassis };
					keys.forEach((key) => {
						mergeEntry(key, value);
					});
				});

				return lookup;
			}

			function getModelLookupMeta(model) {
				if (!model || !(state.modelPlatformChassisLookup instanceof Map)) {
					return null;
				}

				const keys = getModelLookupKeys(getModelName(model), getModelYearNumber(model));
				for (let index = 0; index < keys.length; index += 1) {
					const value = state.modelPlatformChassisLookup.get(keys[index]);
					if (value) {
						return value;
					}
				}

				return null;
			}

			function getSafeHttpUrl(value) {
				const url = safeText(value, "");
				return /^https?:\/\//i.test(url) ? url : "";
			}

			function getRenderableImageUrl(value, width) {
				const url = getSafeHttpUrl(value);
				if (!url) {
					return "";
				}

				if (!/images\.philips\.com\/is\/image\//i.test(url)) {
					return url;
				}

				const base = url.split("?")[0];
				const normalizedWidth = Math.max(320, Number(width) || 1200);
				return base + "?wid=" + normalizedWidth;
			}

			function getModelMedia(model) {
				if (!state.data || !isPlainObject(state.data.ModelMediaData)) {
					return null;
				}

				const media = state.data.ModelMediaData[getModelName(model)];
				return isPlainObject(media) ? media : null;
			}

			function getModelCommercialName(model) {
				return safeText(model && model.commercialName, "");
			}

			function getModelDisplayTitle(model) {
				const modelName = getModelName(model);
				const commercialName = getModelCommercialName(model);
				return commercialName ? modelName + " - " + commercialName : modelName;
			}

			function getModelYear(model) {
				return safeText(model && model.year, "-");
			}

			function getModelYearNumber(model) {
				const yearNum = Number(getModelYear(model));
				return Number.isFinite(yearNum) ? yearNum : 0;
			}

			function normalizeOsLabel(value) {
				const raw = safeText(value, "");
				if (!raw) {
					return "";
				}

				if (/^google\b/i.test(raw)) {
					return "Google TV";
				}

				if (/^titan\s*os$/i.test(raw)) {
					return "Titan OS";
				}

				return raw;
			}

			function getModelOS(model) {
				return safeText(normalizeOsLabel(model && (model.osProfileId || model.os)), "-");
			}

			function getModelPanel(model) {
				return safeText(model && model.panelType, "-");
			}

			function getModelSpecs(model) {
				return model && typeof model.specs === "object" && model.specs !== null ? model.specs : {};
			}

			function getModelChassis(model) {
				const directValue = safeText(getModelSpecs(model).chassis, "");
				if (directValue) {
					return directValue;
				}

				const lookupValue = getModelLookupMeta(model);
				return safeText(lookupValue && lookupValue.chassis, "");
			}

			function getModelPlatform(model) {
				const directValue = safeText(getModelSpecs(model).platform, "");
				if (directValue) {
					return directValue;
				}

				const lookupValue = getModelLookupMeta(model);
				return safeText(lookupValue && lookupValue.platform, "");
			}

			function normalizeModelCodeWithRegion(value) {
				return safeText(value, "")
					.toUpperCase()
					.replace(/\s+/g, "")
					.replace(/_/g, "/")
					.replace(/-(\d{2})$/, "/$1")
					.replace(/[^A-Z0-9/]/g, "");
			}

			function getModelDocumentationCodes(model) {
				const rawBaseModelName = safeText(getModelName(model), "").toUpperCase();
				const baseModelName = rawBaseModelName.replace(/\/\d{2}$/i, "");
				if (!baseModelName) {
					return [];
				}

				const modelYear = getModelYearNumber(model);
				const suffixes = [];
				const addSuffix = (suffix) => {
					const normalized = safeText(suffix, "").replace(/\D/g, "");
					if (!/^\d{2}$/.test(normalized) || suffixes.includes(normalized)) {
						return;
					}
					suffixes.push(normalized);
				};

				safeList(state.data && state.data.ModelPlatformChassisData).forEach((record) => {
					const recordModelName = normalizeModelCodeWithRegion(record && record.modelName);
					if (!recordModelName) {
						return;
					}

					const recordBaseName = recordModelName.replace(/\/\d{2}$/i, "");
					if (recordBaseName !== baseModelName) {
						return;
					}

					const recordYear = Number(record && record.year);
					if (modelYear > 0 && Number.isFinite(recordYear) && recordYear > 0 && recordYear !== modelYear) {
						return;
					}

					const suffixMatch = recordModelName.match(/\/(\d{2})$/i);
					if (suffixMatch) {
						addSuffix(suffixMatch[1]);
					}
				});

				const officialProductUrl = safeText(model && model.officialProductUrl, "");
				const officialUrlSuffixMatch = officialProductUrl.match(/_(\d{2})(?:[\/?#]|$)/i);
				if (officialUrlSuffixMatch) {
					addSuffix(officialUrlSuffixMatch[1]);
				}

				addSuffix("12");
				addSuffix("05");

				return suffixes.map((suffix) => baseModelName + "/" + suffix);
			}

			function buildWoodpeckerSearchUrl(template, modelCode) {
				const normalizedTemplate = safeText(template, "");
				if (!normalizedTemplate || normalizedTemplate.indexOf("{model}") === -1) {
					return "";
				}

				const resolvedUrl = normalizedTemplate.replace("{model}", encodeURIComponent(modelCode));
				return getSafeHttpUrl(resolvedUrl);
			}

			function getModelDocumentationContext(model) {
				const docsData = isPlainObject(state.data && state.data.DocumentationLinksData)
					? state.data.DocumentationLinksData
					: normalizeDocumentationLinksData(null);

				const modelCodes = getModelDocumentationCodes(model);
				const manualsByModel = isPlainObject(docsData.manualsByModel) ? docsData.manualsByModel : {};
				const manualLinks = [];

				modelCodes.forEach((modelCode) => {
					safeList(manualsByModel[modelCode]).forEach((entry) => {
						manualLinks.push({
							modelCode,
							label: safeText(entry && entry.label, "Manual"),
							url: getSafeHttpUrl(entry && entry.url)
						});
					});
				});

				const uniqueManualLinks = [];
				const seenManualKeys = new Set();
				manualLinks.forEach((entry) => {
					if (!entry.url) {
						return;
					}

					const dedupeKey = entry.modelCode + "|" + entry.label + "|" + entry.url;
					if (seenManualKeys.has(dedupeKey)) {
						return;
					}

					seenManualKeys.add(dedupeKey);
					uniqueManualLinks.push(entry);
				});

				const woodpecker = isPlainObject(docsData.woodpecker) ? docsData.woodpecker : {};
				const woodpeckerPortalUrl = getSafeHttpUrl(woodpecker.portalUrl);
				const searchUrlTemplate = safeText(woodpecker.searchUrlTemplate, "");

				const woodpeckerSearchLinks = modelCodes
					.map((modelCode) => {
						const searchUrl = buildWoodpeckerSearchUrl(searchUrlTemplate, modelCode);
						if (!searchUrl) {
							return null;
						}

						return {
							modelCode,
							label: "Search in Woodpecker",
							url: searchUrl
						};
					})
					.filter(Boolean);

				return {
					modelCodes,
					manualLinks: uniqueManualLinks,
					woodpeckerSearchLinks,
					woodpeckerPortalUrl,
					hasSearchTemplate: Boolean(searchUrlTemplate)
				};
			}

			function normalizeModelSize(value) {
				return safeText(value, "").replace(/\D/g, "");
			}

			function getModelPrimarySize(model) {
				const match = getModelName(model).match(/^(\d{2,3})/);
				return match ? match[1] : "";
			}

			function getModelFamilyCode(model) {
				return safeText(getModelName(model), "")
					.toUpperCase()
					.replace(/^\d{2,3}/, "")
					.replace(/\/\d{2}$/i, "");
			}

			function formatSizeWithInch(size) {
				const normalized = normalizeModelSize(size);
				return normalized ? normalized + "\"" : "-";
			}

			function formatModelSizesWithInches(sizes) {
				return safeList(sizes)
					.map((size) => formatSizeWithInch(size))
					.filter((label) => label !== "-")
					.join(", ");
			}

			function getModelVesa(model) {
				const directVesa = safeText(getModelSpecs(model).vesa, "");
				if (directVesa) {
					return directVesa;
				}

				return getModelTechnicalValue(model, [/Wall-mount compatible/i, /Zgodny uchwyt ścienny/i, /VESA/i]);
			}

			function extractModelPolicyTags(fullModelName) {
				const normalizedName = safeText(fullModelName, "").toUpperCase();
				if (!normalizedName) {
					return null;
				}

				const dnaMatch = normalizedName.match(/(OLED|MLED|PML|PUS|PFS|PHS)(\d+)/i);
				if (!dnaMatch) {
					return null;
				}

				const tagTech = String(dnaMatch[1] || "").trim().toUpperCase();
				const numberPart = String(dnaMatch[2] || "").trim();
				if (!tagTech || !numberPart) {
					return null;
				}

				const firstDigit = numberPart.charAt(0);
				const firstTwoDigits = numberPart.slice(0, 2);

				return {
					tagTech,
					tagSeries: tagTech + firstDigit,
					tagSeries2: firstTwoDigits ? tagTech + firstTwoDigits : "",
					tagModel: tagTech + numberPart
				};
			}

			function getPolicyCriteriaEntries(policy) {
				if (!policy || !isPlainObject(policy.criteria)) {
					return [];
				}

				return Object.entries(policy.criteria)
					.map(([key, value]) => [safeText(key, "Rule"), safeText(value, "-")])
					.filter(([key]) => Boolean(key));
			}

			function getPolicyForModel(model) {
				if (!state.data) {
					return null;
				}

				const fullModelName = safeText(model && model.fullModelName, getModelName(model));
				const modelYear = getModelYearNumber(model);
				const modelTags = extractModelPolicyTags(fullModelName);
				if (!modelTags) {
					return null;
				}

				const tagTech = modelTags.tagTech;
				const tagSeries = modelTags.tagSeries;
				const tagSeries2 = modelTags.tagSeries2;
				const tagModel = modelTags.tagModel;
				const policies = Array.isArray(state.data.PoliciesData) ? state.data.PoliciesData : [];
				let bestMatch = null;
				let bestScore = -1;

				for (const policy of policies) {
					if (!isPlainObject(policy)) {
						continue;
					}

					const validYears = safeList(policy.validYears)
						.map((year) => Number(year))
						.filter((year) => Number.isFinite(year));

					if (validYears.length > 0 && modelYear > 0 && !validYears.includes(modelYear)) {
						continue;
					}

					const tags = safeList(policy.matchTags)
						.map((tag) => safeText(tag, "").toUpperCase())
						.filter(Boolean);

					let policyScore = -1;
					tags.forEach((tag) => {
						let score = -1;

						if (tag === tagModel) {
							score = 500;
						} else if (tagSeries2 && tag === tagSeries2) {
							score = 460;
						} else if (tag === tagSeries) {
							score = 420;
						} else if (tag === tagTech) {
							score = 300;
						} else if (tagModel.startsWith(tag) && tag.length > tagTech.length) {
							// Allow prefix tags like PFS69 to match model DNA PFS6900.
							score = 200 + tag.length;
						}

						if (score > policyScore) {
							policyScore = score;
						}
					});

					if (policyScore > bestScore) {
						bestScore = policyScore;
						bestMatch = policy;
					}
				}

				return bestMatch;
			}

			function getModelSizes(model) {
				const sizes = safeList(model && model.availableSizes)
					.map((size) => normalizeModelSize(size))
					.filter(Boolean);
				const primary = normalizeModelSize(getModelPrimarySize(model));

				if (primary && !sizes.includes(primary)) {
					sizes.unshift(primary);
				}

				return Array.from(new Set(sizes));
			}

			function getModelSelectedSize(model) {
				if (!model) {
					return "";
				}

				const modelId = getModelKey(model);
				const availableSizes = getModelSizes(model);
				if (availableSizes.length === 0) {
					return "";
				}

				const fromState = normalizeModelSize(state.selectedSizeByModelId[modelId]);
				if (fromState && availableSizes.includes(fromState)) {
					return fromState;
				}

				const primary = normalizeModelSize(getModelPrimarySize(model));
				if (primary && availableSizes.includes(primary)) {
					return primary;
				}

				return availableSizes[0];
			}

			function setModelSelectedSize(modelId, size) {
				const model = getModelById(modelId);
				if (!model) {
					return false;
				}

				const normalized = normalizeModelSize(size);
				if (!normalized) {
					return false;
				}

				const available = new Set(getModelSizes(model));
				if (!available.has(normalized)) {
					return false;
				}

				state.selectedSizeByModelId[modelId] = normalized;
				persistSessionState();
				return true;
			}

			function getModelSizeVariantMap(model) {
				const variants = new Map();
				if (!model || !state.data || !Array.isArray(state.data.ModelsData)) {
					return variants;
				}

				const familyCode = getModelFamilyCode(model);
				const modelYear = Number(getModelYear(model));

				state.data.ModelsData.forEach((candidate) => {
					if (!candidate) {
						return;
					}

					if (getModelFamilyCode(candidate) !== familyCode) {
						return;
					}

					if (Number(getModelYear(candidate)) !== modelYear) {
						return;
					}

					const candidateSize = normalizeModelSize(getModelPrimarySize(candidate));
					if (!candidateSize || variants.has(candidateSize)) {
						return;
					}

					variants.set(candidateSize, candidate);
				});

				return variants;
			}

			function getModelForSize(model, selectedSize, options) {
				if (!model || !state.data || !Array.isArray(state.data.ModelsData)) {
					return model;
				}

				const shouldFallbackToBase = !options || options.fallbackToBase !== false;

				const targetSize = normalizeModelSize(selectedSize);
				if (!targetSize) {
					return shouldFallbackToBase ? model : null;
				}

				const scopedModel = getModelSizeVariantMap(model).get(targetSize);

				return scopedModel || (shouldFallbackToBase ? model : null);
			}

			function flattenFeatureValues(features) {
				if (!features || typeof features !== "object") {
					return [];
				}

				return Object.values(features).flatMap((featureValue) => {
					if (Array.isArray(featureValue)) {
						return featureValue.map((item) => safeText(item, "")).filter(Boolean);
					}
					const item = safeText(featureValue, "");
					return item ? [item] : [];
				});
			}

			function getModelStandardSpecs(model) {
				return {
					audioChannels: safeText(model && model.audioChannels, ""),
					audioPower: safeText(model && model.audioPower, ""),
					wifiStandard: safeText(model && model.wifiStandard, ""),
					bluetoothVersion: safeText(model && model.bluetoothVersion, ""),
					vrrMaxRefreshRate: safeText(model && model.vrrMaxRefreshRate, "")
				};
			}

			function stringifyTechnicalValue(value) {
				if (Array.isArray(value)) {
					return value.map((item) => safeText(item, "")).filter(Boolean).join(", ");
				}

				if (isPlainObject(value)) {
					return Object.entries(value)
						.map(([key, item]) => safeText(key, "") + ": " + safeText(item, ""))
						.filter((entry) => entry !== ": ")
						.join(" | ");
				}

				return safeText(value, "");
			}

			function getModelTechnicalByCategory(model) {
				const technicalByCategory = getModelSpecs(model).technicalByCategory;
				return isPlainObject(technicalByCategory) ? technicalByCategory : {};
			}

			function getModelTechnicalFlat(model) {
				const technicalFlat = getModelSpecs(model).technicalFlat;
				return isPlainObject(technicalFlat) ? technicalFlat : {};
			}

			function collectTechnicalRowsByCategory(model, categoryPatterns) {
				const rows = [];
				const technicalByCategory = getModelTechnicalByCategory(model);

				Object.entries(technicalByCategory).forEach(([categoryName, entries]) => {
					const isWantedCategory = safeList(categoryPatterns).some((pattern) => pattern.test(categoryName));
					if (!isWantedCategory || !isPlainObject(entries)) {
						return;
					}

					Object.entries(entries).forEach(([key, value]) => {
						const normalizedValue = stringifyTechnicalValue(value);
						if (!normalizedValue) {
							return;
						}

						rows.push({
							category: safeText(categoryName, "General"),
							label: safeText(key, "Value"),
							value: normalizedValue
						});
					});
				});

				return rows;
			}

			function collectTechnicalRowsByFlatKeys(model, keyPatterns) {
				const rows = [];
				const technicalFlat = getModelTechnicalFlat(model);

				Object.entries(technicalFlat).forEach(([flatKey, value]) => {
					const isWantedKey = safeList(keyPatterns).some((pattern) => pattern.test(flatKey));
					if (!isWantedKey) {
						return;
					}

					const normalizedValue = stringifyTechnicalValue(value);
					if (!normalizedValue) {
						return;
					}

					const keyParts = String(flatKey).split("::").map((part) => safeText(part, "")).filter(Boolean);
					const categoryName = keyParts.length > 1 ? keyParts[0] : "General";
					const label = keyParts.length > 1 ? keyParts.slice(1).join(" :: ") : safeText(flatKey, "Value");

					rows.push({
						category: categoryName,
						label,
						value: normalizedValue
					});
				});

				return rows;
			}

			function getModelTechnicalValue(model, keyPatterns) {
				const rows = collectTechnicalRowsByFlatKeys(model, keyPatterns);
				if (rows.length === 0) {
					return "";
				}

				return safeText(rows[0].value, "");
			}

			function renderTechnicalRowsTable(rows, emptyMessage) {
				function normalizeTechnicalValue(value) {
					const text = safeText(value, "-");
					return text.replace(/\bmm\s+mm\b/gi, "mm").replace(/\s{2,}/g, " ").trim();
				}

				function escapeRegex(value) {
					return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				}

				function formatTechnicalListValue(category, label, value) {
					const normalized = normalizeTechnicalValue(value);
					if (!normalized || normalized === "-" || normalized.includes("|")) {
						return normalized;
					}

					const categoryText = safeText(category, "");
					const labelText = safeText(label, "");
					const shouldFormat = /^(Sound|Connectivity|Supported HDMI video features)$/i.test(categoryText)
						|| /(codec|sound enhancement|headphone features|hdmi features|hdmi 2\.1 features|easylink|gaming|hdr)/i.test(labelText);

					if (!shouldFormat) {
						return normalized;
					}

					const commaParts = normalized
						.split(",")
						.map((part) => safeText(part, ""))
						.filter(Boolean);

					if (commaParts.length >= 2) {
						return commaParts.join(" | ");
					}

					const knownListTerms = [
						"Dolby Media Intelligence",
						"Personal Vocal Boost",
						"Bass Enhancement",
						"Room Calibration",
						"Hearing Profile",
						"Night Mode",
						"Night mode",
						"Clear Dialogue",
						"Dialogue",
						"Equalizer",
						"All Sound Style",
						"Entertainment",
						"Spatial Music",
						"Original",
						"Music",
						"AVL Mode",
						"AI mode",
						"DTS Play-Fi",
						"DTS:X",
						"Dolby Atmos",
						"Dolby Digital",
						"Dolby Vision 2 Max",
						"Dolby Vision",
						"HDR10+ Compatible",
						"HDR10+ Adaptive",
						"HDR10+",
						"HDR10",
						"HLG",
						"One touch play",
						"Remote control pass-through",
						"System audio control",
						"System standby",
						"External setting via TV UI",
						"HDMI-CEC for Philips TV/SB",
						"4K Audio Return Channel",
						"Audio Return Channel",
						"eARC",
						"VRR",
						"ALLM"
					];

					const knownTermsPattern = new RegExp(
						knownListTerms
							.map((term) => escapeRegex(term))
							.sort((a, b) => b.length - a.length)
							.join("|"),
						"gi"
					);

					const matches = normalized.match(knownTermsPattern) || [];
					const matchedLength = matches.reduce((sum, item) => sum + item.length, 0);
					if (matches.length >= 2 && matchedLength >= normalized.length * 0.45) {
						return matches.map((item) => safeText(item, "")).filter(Boolean).join(" | ");
					}

					return normalized;
				}

				const groupedRowsByCategory = new Map();
				const orderedCategories = [];

				safeList(rows).forEach((row) => {
					const category = safeText(row && row.category, "General");
						const label = safeText(row && row.label, "Value");
					if (!groupedRowsByCategory.has(category)) {
						groupedRowsByCategory.set(category, []);
						orderedCategories.push(category);
					}

					groupedRowsByCategory.get(category).push({
							label,
							value: formatTechnicalListValue(category, label, row && row.value)
					});
				});

				const bodyRows = orderedCategories
					.map((category) => {
						const rowsInCategory = groupedRowsByCategory.get(category) || [];
						return rowsInCategory
							.map((row, index) => ""
								+ "<tr>"
								+ (index === 0
									? "<td class=\"px-3 py-2 text-slate-600 align-top\" rowspan=\"" + String(rowsInCategory.length) + "\">" + escapeHtml(category) + "</td>"
									: "")
								+ "<td class=\"px-3 py-2 font-semibold text-slate-800\">" + escapeHtml(row.label) + "</td>"
								+ "<td class=\"px-3 py-2 text-slate-700\">" + escapeHtml(row.value) + "</td>"
								+ "</tr>")
							.join("");
					})
					.join("");

				const fallbackRow = "<tr><td class=\"px-3 py-3 text-slate-500\" colspan=\"3\">" + escapeHtml(safeText(emptyMessage, "No technical details found.")) + "</td></tr>";

				return ""
					+ "<div class=\"overflow-x-auto rounded-xl border border-slate-200\">"
					+ "<table class=\"min-w-full divide-y divide-slate-200 text-sm\">"
					+ "<thead class=\"bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500\">"
					+ "<tr><th class=\"px-3 py-2\">Section</th><th class=\"px-3 py-2\">Field</th><th class=\"px-3 py-2\">Value</th></tr>"
					+ "</thead>"
					+ "<tbody class=\"divide-y divide-slate-100 bg-white\">"
					+ (bodyRows || fallbackRow)
					+ "</tbody>"
					+ "</table>"
					+ "</div>";
			}

			function isBasicFeatureValue(value) {
				const normalized = normalizeText(value);
				if (!normalized) {
					return false;
				}

				if (normalized.includes("wifi") || normalized.includes("bluetooth")) {
					return true;
				}
				if (normalized.includes("speaker") || normalized.includes("subwoofer")) {
					return true;
				}
				if (normalized.includes("vrr") || normalized.includes("hz")) {
					return true;
				}
				if (/\b\d+(?:\.\d+)?\s*ch\b/i.test(normalized)) {
					return true;
				}
				if (/\b\d{2,3}\s*w\b/i.test(normalized)) {
					return true;
				}

				return false;
			}

			function normalizeModelsData(models) {
				return safeList(models).map((model, index) => {
					return {
						...model,
						audioChannels: safeText(model && model.audioChannels, ""),
						audioPower: safeText(model && model.audioPower, ""),
						wifiStandard: safeText(model && model.wifiStandard, ""),
						bluetoothVersion: safeText(model && model.bluetoothVersion, ""),
						vrrMaxRefreshRate: safeText(model && model.vrrMaxRefreshRate, ""),
						__key: getModelKey(model, index)
					};
				});
			}

			function normalizeKnowledgeArticle(article, index) {
				const articleId = safeText(article && article.id, "kb_auto_" + String(index + 1));
				const title = safeText(article && article.title, "Knowledge Article");
				const summary = safeText(article && article.summary, "");
				const imageUrl = safeText(article && article.imageUrl, "").replace(/\\/g, "/");
				const filters = normalizeKnowledgeFilters(article && article.filters);
				const tags = safeList(article && article.tags)
					.map((tag) => safeText(tag, ""))
					.filter(Boolean);

				const sections = safeList(article && article.sections).map((section) => ({
					heading: safeText(section && section.heading, "Details"),
					paragraphs: safeList(section && section.paragraphs).map((text) => safeText(text, "")).filter(Boolean),
					bullets: safeList(section && section.bullets).map((text) => safeText(text, "")).filter(Boolean)
				}));

				const contentPoints = safeList(article && article.contentPoints)
					.map((point) => safeText(point, ""))
					.filter(Boolean);

				if (sections.length === 0 && contentPoints.length > 0) {
					sections.push({
						heading: "Key Points",
						paragraphs: [],
						bullets: contentPoints
					});
				}

				return {
					id: articleId,
					title,
					summary,
					imageUrl,
					filters,
					tags,
					contentPoints,
					sections
				};
			}

			function normalizeKnowledgeData(articles) {
				const merged = new Map();

				safeList(articles).forEach((article, index) => {
					const normalized = normalizeKnowledgeArticle(article, index);
					if (!merged.has(normalized.id)) {
						merged.set(normalized.id, normalized);
						return;
					}

					const existing = merged.get(normalized.id);
					const nextTags = Array.from(new Set([...(existing.tags || []), ...(normalized.tags || [])]));
					const nextPoints = Array.from(new Set([...(existing.contentPoints || []), ...(normalized.contentPoints || [])]));
					const nextFilters = mergeKnowledgeFilters(existing.filters, normalized.filters);
					const nextSections = normalized.sections.length >= existing.sections.length
						? normalized.sections
						: existing.sections;

					merged.set(normalized.id, {
						id: normalized.id,
						title: normalized.title || existing.title,
						summary: normalized.summary || existing.summary,
						imageUrl: normalized.imageUrl || existing.imageUrl || "",
						filters: nextFilters,
						tags: nextTags,
						contentPoints: nextPoints,
						sections: nextSections
					});
				});

				return Array.from(merged.values());
			}

			function wait(ms) {
				return new Promise((resolve) => {
					window.setTimeout(resolve, ms);
				});
			}

			async function loadRelationalData() {
				await wait(90);
				return JSON.parse(JSON.stringify(RelationalMockData));
			}

			function addIdentifierFragments(identifier, tokenSet) {
				const compact = compactText(identifier);
				if (!compact) {
					return;
				}

				tokenSet.add(compact);
				const maxLen = Math.min(7, compact.length);

				for (let len = 3; len <= maxLen; len += 1) {
					for (let i = 0; i <= compact.length - len; i += 1) {
						tokenSet.add(compact.slice(i, i + len));
					}
				}
			}

			function buildSearchIndexFromEntries(entries) {
				const tokenMap = new Map();
				const vectors = new Map();

				entries.forEach((entry) => {
					const fields = [entry.title, entry.subtitle, ...(entry.searchFields || [])];
					const tokens = new Set();

					fields.forEach((field) => {
						const normalized = normalizeText(field);
						if (!normalized) {
							return;
						}
						normalized.split(/\s+/).forEach((token) => {
							if (token.length >= 2) {
								tokens.add(token);
							}
						});
					});

					if (entry.identifiers) {
						entry.identifiers.forEach((identifier) => {
							addIdentifierFragments(identifier, tokens);
						});
					}

					const haystack = fields.map((field) => normalizeText(field)).join(" ");
					vectors.set(entry.id, {
						haystack,
						compactHaystack: haystack.replace(/\s+/g, ""),
						tokens
					});

					tokens.forEach((token) => {
						if (!tokenMap.has(token)) {
							tokenMap.set(token, new Set());
						}
						tokenMap.get(token).add(entry.id);
					});
				});

				return { tokenMap, vectors, entriesById: new Map(entries.map((entry) => [entry.id, entry])) };
			}

			function scoreEntry(entry, vector, normalizedQuery, queryTokens) {
				let score = 0;
				const title = normalizeText(entry.title);
				const subtitle = normalizeText(entry.subtitle);

				if (title === normalizedQuery) {
					score += 220;
				}
				if (title.startsWith(normalizedQuery) && normalizedQuery.length >= 2) {
					score += 140;
				}
				if (title.includes(normalizedQuery) && normalizedQuery.length >= 3) {
					score += 90;
				}

				if (subtitle.includes(normalizedQuery) && normalizedQuery.length >= 3) {
					score += 50;
				}

				queryTokens.forEach((token) => {
					if (vector.tokens.has(token)) {
						score += 45;
					}
					if (vector.haystack.includes(token)) {
						score += 20;
					}
				});

				const compactQuery = normalizedQuery.replace(/\s+/g, "");
				if (compactQuery.length >= 3 && vector.compactHaystack.includes(compactQuery)) {
					score += 40;
				}

				if (entry.entityType === "model") {
					score += 12;
				}

				return score;
			}

			function searchGlobalIndex(query, index) {
				if (!query || !query.trim()) {
					return [];
				}

				if (!index || !(index.tokenMap instanceof Map) || !(index.entriesById instanceof Map) || !(index.vectors instanceof Map)) {
					return [];
				}

				const normalizedQuery = normalizeText(query);
				if (!normalizedQuery) {
					return [];
				}

				const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
				let candidateIds = null;

				queryTokens.forEach((token) => {
					const matches = index.tokenMap.get(token);
					if (!matches) {
						return;
					}

					if (candidateIds === null) {
						candidateIds = new Set(matches);
					} else {
						candidateIds = new Set([...candidateIds].filter((id) => matches.has(id)));
					}
				});

				let candidates = [...index.entriesById.values()];
				if (candidateIds && candidateIds.size > 0) {
					candidates = candidates.filter((entry) => candidateIds.has(entry.id));
				}

				const ranked = candidates
					.map((entry) => {
						const vector = index.vectors.get(entry.id);
						if (!vector) {
							return null;
						}
						return {
							entry,
							score: scoreEntry(entry, vector, normalizedQuery, queryTokens)
						};
					})
					.filter(Boolean)
					.filter((item) => item.score > 0)
					.sort((a, b) => b.score - a.score)
					.slice(0, 14)
					.map((item) => item.entry);

				return ranked;
			}

			function buildModelSearchEntries(models) {
				return models.map((model, index) => {
					const modelKey = getModelKey(model, index);
					const modelName = getModelName(model);
					const commercialName = getModelCommercialName(model);
					const osName = getModelOS(model);
					const platform = getModelPlatform(model);
					const panelType = getModelPanel(model);
					const chassis = getModelChassis(model);
					const year = getModelYear(model);
					const subtitle = joinNonEmpty([year, osName, platform, panelType, chassis], " | ");

					return {
					id: "model:" + modelKey,
					entityType: "model",
					category: "TV Models",
					refId: modelKey,
					title: getModelDisplayTitle(model),
					subtitle: subtitle || "No metadata",
					searchFields: [
						modelName,
						commercialName,
						panelType,
						osName,
						platform,
						chassis,
						getModelVesa(model),
						...getModelSizes(model),
						...flattenFeatureValues(model.features),
						...(model.aliases || []),
						...(model.keywords || [])
					],
					identifiers: [modelName, platform, chassis, ...getModelSizes(model), ...(model.aliases || [])],
					payload: { modelId: modelKey }
					};
				});
			}

			function buildKnowledgeEntries(articles) {
				return safeList(articles).map((article) => ({
					id: "kb:" + article.id,
					entityType: "article",
					category: "Knowledge Base",
					refId: article.id,
					title: safeText(article.title, "Knowledge Article"),
					subtitle: safeText(article.summary, ""),
					searchFields: [
						...(article.tags || []),
						...safeList(article && article.filters && article.filters.topics),
						...safeList(article && article.filters && article.filters.os),
						...safeList(article && article.filters && article.filters.panel),
						...safeList(article.contentPoints),
						...safeList(article.sections).flatMap((section) => [section.heading, ...(section.paragraphs || []), ...(section.bullets || [])])
					],
					identifiers: [article.title, ...(article.tags || [])],
					payload: { articleType: "knowledge", articleId: article.id }
				}));
			}

			function buildPolicyEntries(data) {
				const entries = [];
				const policiesData = data.PoliciesData || {};

				if (Array.isArray(policiesData)) {
					policiesData.forEach((policy, index) => {
						if (!isPlainObject(policy)) {
							return;
						}

						const policyId = safeText(policy.id, "policy_" + String(index + 1));
						const title = safeText(policy.policyName, "Model Policy " + String(index + 1));
						const matchTags = safeList(policy.matchTags).map((tag) => safeText(tag, "")).filter(Boolean);
						const criteriaEntries = getPolicyCriteriaEntries(policy);
						const criteriaBullets = criteriaEntries.map(([ruleName, ruleValue]) => ruleName + ": " + ruleValue);

						entries.push({
							id: "policy:model:" + policyId,
							entityType: "policy",
							category: "Contacts & Policies",
							refId: policyId,
							title,
							subtitle: matchTags.length ? "Match tags: " + matchTags.join(", ") : "Model policy rulebook",
							searchFields: [
								title,
								...matchTags,
								...criteriaEntries.flatMap(([ruleName, ruleValue]) => [ruleName, ruleValue])
							],
							identifiers: [policyId, ...matchTags],
							payload: {
								articleType: "policy",
								title,
								summary: matchTags.length
									? "Policy matched using tags: " + matchTags.join(", ")
									: "Policy without explicit match tags.",
								sections: [
									{
										heading: "Policy Metadata",
										paragraphs: [
											"Policy ID: " + policyId,
											"Match tags: " + (matchTags.length ? matchTags.join(", ") : "-")
										],
										bullets: []
									},
									{
										heading: "Criteria",
										paragraphs: [],
										bullets: criteriaBullets.length ? criteriaBullets : ["No criteria configured."]
									}
								]
							}
						});
					});

					return entries;
				}

				const panelPolicies = policiesData.panelPolicies || {};
				const countryPolicies = policiesData.countryPolicies || {};
				const serviceContacts = policiesData.serviceContacts || {};

				Object.entries(panelPolicies).forEach(([panel, policy]) => {
					entries.push({
						id: "policy:panel:" + panel,
						entityType: "policy",
						category: "Contacts & Policies",
						refId: panel,
						title: panel + " Panel Policy",
						subtitle: "Dead pixel + retention + replacement thresholds",
						searchFields: [panel, policy.deadPixelAcceptability, policy.imageRetention, policy.replacementThreshold],
						identifiers: [panel, "dead pixel", "retention"],
						payload: {
							articleType: "policy",
							title: panel + " Panel Policy",
							summary: "Policy mapped by panel type, not specific model.",
							sections: [
								{
									heading: "Rules",
									paragraphs: [],
									bullets: [
										"Dead pixel: " + safeText(policy.deadPixelAcceptability, "-"),
										"Retention: " + safeText(policy.imageRetention, "-"),
										"Replacement threshold: " + safeText(policy.replacementThreshold, "-")
									]
								}
							]
						}
					});
				});

				Object.entries(countryPolicies).forEach(([countryCode, policy]) => {
					const contacts = serviceContacts[countryCode] || {};
					const countryLabel = countryConfigs[countryCode] ? countryConfigs[countryCode].label : countryCode;
					entries.push({
						id: "policy:country:" + countryCode,
						entityType: "policy",
						category: "Contacts & Policies",
						refId: countryCode,
						title: countryLabel + " Service Policy and Contacts",
						subtitle: "SWAP flow, on-site window, and escalation channels",
						searchFields: [
							countryLabel,
							safeText(policy.swapProcedure, ""),
							safeText(policy.onSiteWindow, ""),
							safeText(policy.customerMessage, ""),
							safeText(contacts.tier1, ""),
							safeText(contacts.logistics, ""),
							safeText(contacts.panelLab, ""),
							"contact numbers",
							"hotline"
						],
						identifiers: [countryCode, safeText(contacts.tier1, "")],
						payload: {
							articleType: "policy",
							title: countryLabel + " Service Policy and Contacts",
							summary: "Country-specific operational policy.",
							sections: [
								{
									heading: "Service Procedure",
									paragraphs: [
										"SWAP: " + safeText(policy.swapProcedure, "-"),
										"On-site: " + safeText(policy.onSiteWindow, "-"),
										"Customer note: " + safeText(policy.customerMessage, "-")
									],
									bullets: []
								},
								{
									heading: "Contact Channels",
									paragraphs: [
										"Tier1: " + safeText(contacts.tier1, "-"),
										"Logistics: " + safeText(contacts.logistics, "-"),
										"Panel Lab: " + safeText(contacts.panelLab, "-")
									],
									bullets: []
								}
							]
						}
					});
				});

				return entries;
			}

			function buildGlobalEntries(data) {
				return [
					...buildModelSearchEntries(data.ModelsData),
					...buildKnowledgeEntries(data.KnowledgeBaseData),
					...buildPolicyEntries(data)
				];
			}

			function fillSelect(select, options, selectedValue, allLabel) {
				const currentValue = selectedValue || "all";
				const fragment = document.createDocumentFragment();

				const allOption = document.createElement("option");
				allOption.value = "all";
				allOption.textContent = allLabel;
				fragment.appendChild(allOption);

				options.forEach((value) => {
					const option = document.createElement("option");
					option.value = value;
					option.textContent = value;
					fragment.appendChild(option);
				});

				select.innerHTML = "";
				select.appendChild(fragment);
				select.value = ["all", ...options].includes(currentValue) ? currentValue : "all";
			}

			function uniqueSorted(values, descNumeric) {
				const unique = Array.from(new Set(values));
				if (descNumeric) {
					return unique.sort((a, b) => Number(b) - Number(a));
				}
				return unique.sort((a, b) => String(a).localeCompare(String(b)));
			}

			function getModelById(id) {
				if (!state.data) {
					return null;
				}
				return state.data.ModelsData.find((model) => getModelKey(model) === id) || null;
			}

			function getKnowledgeArticleById(id) {
				if (!state.data) {
					return null;
				}
				return state.data.KnowledgeBaseData.find((article) => article.id === id) || null;
			}

			function updateFilterOptions() {
				if (!state.data) {
					return;
				}

				const allModels = state.data.ModelsData;
				const yearOptions = uniqueSorted(allModels.map((model) => getModelYear(model)).filter((year) => year !== "-"), true);
				fillSelect(yearFilter, yearOptions, state.filters.year, "Any Year");
				state.filters.year = yearFilter.value;

				const yearScoped = state.filters.year === "all"
					? allModels
					: allModels.filter((model) => String(getModelYear(model)) === state.filters.year);
				const osOptions = uniqueSorted(yearScoped.map((model) => getModelOS(model)).filter(Boolean), false);
				fillSelect(osFilter, osOptions, state.filters.os, "Any OS");
				state.filters.os = osFilter.value;

				const osScoped = state.filters.os === "all"
					? yearScoped
					: yearScoped.filter((model) => getModelOS(model) === state.filters.os);
				const panelOptions = uniqueSorted(osScoped.map((model) => getModelPanel(model)).filter(Boolean), false);
				fillSelect(panelFilter, panelOptions, state.filters.panel, "Any Panel");
				state.filters.panel = panelFilter.value;
			}

			function getFilterScopedModels() {
				if (!state.data) {
					return [];
				}

				let models = [...state.data.ModelsData];

				if (state.filters.year !== "all") {
					models = models.filter((model) => String(getModelYear(model)) === state.filters.year);
				}

				if (state.filters.os !== "all") {
					models = models.filter((model) => getModelOS(model) === state.filters.os);
				}

				if (state.filters.panel !== "all") {
					models = models.filter((model) => getModelPanel(model) === state.filters.panel);
				}

				if (!state.searchQuery.trim()) {
					return models.sort((a, b) => getModelYearNumber(b) - getModelYearNumber(a));
				}

				const modelEntries = searchGlobalIndex(state.searchQuery, state.modelSearchIndex)
					.filter((entry) => entry.entityType === "model")
					.map((entry) => entry.payload.modelId);

				if (modelEntries.length === 0) {
					return [];
				}

				const idSet = new Set(modelEntries);
				return models
					.filter((model) => idSet.has(getModelKey(model)))
					.sort((a, b) => modelEntries.indexOf(getModelKey(a)) - modelEntries.indexOf(getModelKey(b)));
			}

			function getSearchScopedArticles() {
				if (!state.data) {
					return [];
				}

				const articles = safeList(state.data.KnowledgeBaseData);
				if (!state.searchQuery.trim()) {
					return [...articles].sort((a, b) => safeText(a.title, "").localeCompare(safeText(b.title, "")));
				}

				const articleEntries = searchGlobalIndex(state.searchQuery, state.globalSearchIndex)
					.filter((entry) => entry.entityType === "article")
					.map((entry) => safeText(entry.payload && entry.payload.articleId, ""))
					.filter(Boolean);

				if (articleEntries.length === 0) {
					return [];
				}

				const idSet = new Set(articleEntries);
				return articles
					.filter((article) => idSet.has(safeText(article && article.id, "")))
					.sort((a, b) => articleEntries.indexOf(safeText(a && a.id, "")) - articleEntries.indexOf(safeText(b && b.id, "")));
			}

			function updatePath() {
				const model = getModelById(state.selectedModelId);
				const yearLabel = state.filters.year === "all" ? "Any Year" : state.filters.year;
				const osLabel = state.filters.os === "all" ? "Any OS" : state.filters.os;
				const panelLabel = state.filters.panel === "all" ? "Any Panel" : state.filters.panel;
				const modelLabel = model ? " -> " + getModelName(model) : "";
				activePath.textContent = "Path: " + yearLabel + " -> " + osLabel + " -> " + panelLabel + modelLabel;
			}

			function renderModelGrid(models) {
				modelGrid.innerHTML = "";
				emptyState.textContent = "No models matched current filters/query.";

				if (models.length === 0) {
					emptyState.classList.remove("hidden");
					return;
				}

				emptyState.classList.add("hidden");

				models.forEach((model) => {
					const card = document.createElement("button");
					card.type = "button";
					card.className = "model-card rounded-xl p-4 text-left";
					const modelKey = getModelKey(model);

					if (modelKey === state.selectedModelId) {
						card.classList.add("is-active");
					}

					card.innerHTML = ""
						+ "<div class=\"flex items-center justify-between gap-2\">"
						+ "<p class=\"brand-font text-lg text-slate-900\">" + getModelName(model) + "</p>"
						+ "<span class=\"rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600\">" + getModelYear(model) + "</span>"
						+ "</div>"
						+ "<p class=\"mt-1 text-sm font-semibold text-slate-700\">" + safeText(getModelCommercialName(model), "-") + "</p>"
						+ "<p class=\"mt-2 text-xs text-slate-500\">Platform: " + safeText(getModelPlatform(model), "-") + "</p>"
						+ "<p class=\"mt-2 text-xs text-slate-500\">Chassis: " + safeText(getModelChassis(model), "-") + "</p>"
						+ "<div class=\"mt-3 flex flex-wrap gap-2\">"
						+ "<span class=\"rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-brand-700\">" + getModelOS(model) + "</span>"
						+ "</div>";

					card.addEventListener("click", () => {
						selectModel(modelKey);
					});

					modelGrid.appendChild(card);
				});
			}

			function renderArticleGrid(articles) {
				modelGrid.innerHTML = "";

				if (articles.length === 0) {
					emptyState.textContent = "No articles matched current filters/query.";
					emptyState.classList.remove("hidden");
					return;
				}

				emptyState.classList.add("hidden");

				articles.forEach((article) => {
					const card = document.createElement("button");
					card.type = "button";
					card.className = "model-card rounded-xl p-4 text-left";

					const tags = safeList(article && article.tags).slice(0, 4);
					const tagsHtml = tags.map((tag) => ""
						+ "<span class=\"rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700\">"
						+ escapeHtml(safeText(tag, "-"))
						+ "</span>").join("");

					card.innerHTML = ""
						+ "<div class=\"flex items-center justify-between gap-2\">"
						+ "<p class=\"brand-font text-lg text-slate-900\">" + escapeHtml(safeText(article && article.title, "Knowledge Article")) + "</p>"
						+ "<span class=\"rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-brand-700\">KB</span>"
						+ "</div>"
						+ "<p class=\"mt-2 text-sm text-slate-600\">" + escapeHtml(safeText(article && article.summary, "No summary available.")) + "</p>"
						+ "<div class=\"mt-3 flex flex-wrap gap-2\">"
						+ (tagsHtml || "<span class=\"text-xs text-slate-500\">No tags.</span>")
						+ "</div>";

					card.addEventListener("click", () => {
						openKnowledgeArticle(safeText(article && article.id, ""), { fromModelId: state.selectedModelId || null });
					});

					modelGrid.appendChild(card);
				});
			}

			function setResultsView(viewMode) {
				const nextView = viewMode === "articles" ? "articles" : "models";
				state.resultsView = nextView;

				if (resultsSectionTitle) {
					resultsSectionTitle.textContent = nextView === "articles" ? "Article Results" : "Model Results";
				}

				if (resultsModeModelsBtn) {
					const isModels = nextView === "models";
					resultsModeModelsBtn.classList.toggle("is-active", isModels);
				}

				if (resultsModeArticlesBtn) {
					const isArticles = nextView === "articles";
					resultsModeArticlesBtn.classList.toggle("is-active", isArticles);
				}

				if (state.data) {
					refreshModelResults();
				}

				persistSessionState();
			}

			function renderSpecsPane(model) {
				const allSizes = getModelSizes(model);
				const selectedSize = getModelSelectedSize(model);
				const sizeScopedModel = getModelForSize(model, selectedSize);
				const dimensionsModel = getModelForSize(model, selectedSize, { fallbackToBase: false });
				const displayedSize = formatSizeWithInch(selectedSize);
				const specs = getModelSpecs(sizeScopedModel);
				const featureValues = flattenFeatureValues(sizeScopedModel && sizeScopedModel.features);
				const kbFeatureValues = featureValues.filter((item) => !isBasicFeatureValue(item));
				const standardSpecs = getModelStandardSpecs(sizeScopedModel);
				const withStandDimensions = getModelTechnicalValue(dimensionsModel, [/Telewizor z podstawą/i, /TV with stand/i]);
				const withoutStandDimensions = getModelTechnicalValue(dimensionsModel, [/Telewizor bez podstawy/i, /TV without stand/i]);
				const dimensionsWeight = getModelTechnicalValue(dimensionsModel, [/Waga telewizora/i, /Waga z opakowaniem/i, /Weight/i]);
				const vesaStandard = getModelVesa(sizeScopedModel);
				const sizeLabel = displayedSize !== "-" ? displayedSize : "-";
				const allSizesLabel = formatModelSizesWithInches(allSizes) || "-";

				const featureBadges = kbFeatureValues
					.map((item) => {
						const hasExplicitKb = Boolean(getExplicitKnowledgeArticleByTerm(item, { model }));
						return renderKnowledgePill(
							item,
							"rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700",
							hasExplicitKb
						);
					})
					.join(" ");

				return ""
					+ "<div class=\"grid gap-4 xl:grid-cols-2\">"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Core Hardware</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Panel</dt><dd class=\"font-semibold text-slate-800\">" + getModelPanel(sizeScopedModel) + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">OS</dt><dd class=\"font-semibold text-slate-800\">" + getModelOS(sizeScopedModel) + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Platform</dt><dd class=\"font-semibold text-slate-800\">" + safeText(getModelPlatform(sizeScopedModel), "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Chassis</dt><dd class=\"font-semibold text-slate-800\">" + getModelChassis(sizeScopedModel) + "</dd></div>"
					+ "</dl>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Physical Details</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Stand</dt><dd class=\"font-semibold text-slate-800\">" + safeText(specs.stand, "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Sizes</dt><dd class=\"font-semibold text-slate-800\">" + escapeHtml(allSizesLabel) + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">VESA Standard</dt><dd class=\"font-semibold text-slate-800\">" + safeText(vesaStandard, "-") + "</dd></div>"
					+ "</dl>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Audio Specifications</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Channels</dt><dd class=\"font-semibold text-slate-800\">" + safeText(standardSpecs.audioChannels, "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Audio Power</dt><dd class=\"font-semibold text-slate-800\">" + safeText(standardSpecs.audioPower, "-") + "</dd></div>"
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"audio\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">Show full audio details</button>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Connectivity</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">WiFi</dt><dd class=\"font-semibold text-slate-800\">" + safeText(standardSpecs.wifiStandard, "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Bluetooth</dt><dd class=\"font-semibold text-slate-800\">" + safeText(standardSpecs.bluetoothVersion, "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Max VRR Refresh Rate</dt><dd class=\"font-semibold text-slate-800\">" + safeText(standardSpecs.vrrMaxRefreshRate, "-") + "</dd></div>"
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"connectivity\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">Show full connectivity details</button>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-2 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Dimensions</h5>"
					+ "<p class=\"mt-2 text-xs text-slate-500\">Selected size: " + escapeHtml(sizeLabel) + "</p>"
					+ "<dl class=\"mt-3 grid gap-2 text-sm sm:grid-cols-2 flex-1 pb-2\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">TV With Stand</dt><dd class=\"font-semibold text-slate-800\">" + safeText(withStandDimensions, "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">TV Without Stand</dt><dd class=\"font-semibold text-slate-800\">" + safeText(withoutStandDimensions, "-") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Weight</dt><dd class=\"font-semibold text-slate-800\">" + safeText(dimensionsWeight, "-") + "</dd></div>"
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"dimensions\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">Show full dimensions details</button>"
					+ "</div>"
					+ "</div>"
					+ "<div class=\"mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Knowledge Features</h5>"
					+ "<div class=\"mt-2 flex flex-wrap gap-2\">" + (featureBadges || "<span class=\"text-xs text-slate-500\">No knowledge-linked features for this model.</span>") + "</div>"
					+ "</div>";
			}

			function renderPortsPane(model) {
				const media = getModelMedia(model);
				const portsImageUrl = getSafeHttpUrl(media && media.portsImageUrl);
				const portsImageDisplayUrl = getRenderableImageUrl(portsImageUrl, 1800);
				const portsImageZoomUrl = getRenderableImageUrl(portsImageUrl, 2400);
				const sourcePageUrl = getSafeHttpUrl((media && media.pageUrl) || (model && model.officialProductUrl));
				const visualBlock = portsImageUrl
					? ""
						+ "<section class=\"mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50\">"
						+ "<div class=\"border-b border-slate-200 px-3 py-2\">"
						+ "<p class=\"text-xs font-semibold uppercase tracking-[0.12em] text-slate-500\">Rear Connections Layout</p>"
						+ (sourcePageUrl
							? "<a href=\"" + escapeHtml(sourcePageUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-xs font-semibold text-brand-700 hover:underline\">Open official product page</a>"
							: "")
						+ "</div>"
						+ "<div class=\"bg-white p-2\">"
						+ "<img src=\"" + escapeHtml(portsImageDisplayUrl) + "\" alt=\"" + escapeHtml(getModelName(model) + " rear connectors") + "\" class=\"js-zoomable-image h-auto max-h-[360px] w-full cursor-zoom-in rounded-lg object-contain\" loading=\"lazy\" tabindex=\"0\" role=\"button\" data-zoom-src=\"" + escapeHtml(portsImageZoomUrl) + "\">"
						+ "</div>"
						+ "</section>"
					: "";

				const sourceRows = safeList(model.ports);
				const rows = sourceRows.map((port) => ""
					+ "<tr>"
					+ "<td class=\"px-3 py-2 font-semibold text-slate-800\">" + safeText(port.port, "-") + "</td>"
					+ "<td class=\"px-3 py-2 text-slate-700\">" + safeText(port.qty, "-") + "</td>"
					+ "<td class=\"px-3 py-2 text-slate-700\">" + safeText(port.spec, "-") + "</td>"
					+ "</tr>").join("");

				const rowsWithFallback = rows || "<tr><td class=\"px-3 py-3 text-slate-500\" colspan=\"3\">No ports data available for this model.</td></tr>";

				return ""
					+ visualBlock
					+ "<div class=\"overflow-x-auto rounded-xl border border-slate-200\">"
					+ "<table class=\"min-w-full divide-y divide-slate-200 text-sm\">"
					+ "<thead class=\"bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500\">"
					+ "<tr><th class=\"px-3 py-2\">Port</th><th class=\"px-3 py-2\">Qty</th><th class=\"px-3 py-2\">Specification</th></tr>"
					+ "</thead>"
					+ "<tbody class=\"divide-y divide-slate-100 bg-white\">" + rowsWithFallback + "</tbody>"
					+ "</table>"
					+ "</div>";
			}

			function renderTroubleshootingPane(model) {
				const docsContext = getModelDocumentationContext(model);

				const manualLabelPriority = {
					"user manual": 0,
					"quick start guide": 1,
					"leaflet": 2
				};

				const orderedManualLinks = safeList(docsContext.manualLinks)
					.slice()
					.sort((left, right) => {
						const leftLabel = safeText(left && left.label, "").toLowerCase();
						const rightLabel = safeText(right && right.label, "").toLowerCase();

						const leftRank = Object.prototype.hasOwnProperty.call(manualLabelPriority, leftLabel)
							? manualLabelPriority[leftLabel]
							: 99;
						const rightRank = Object.prototype.hasOwnProperty.call(manualLabelPriority, rightLabel)
							? manualLabelPriority[rightLabel]
							: 99;

						if (leftRank !== rightRank) {
							return leftRank - rightRank;
						}

						return leftLabel.localeCompare(rightLabel);
					});

				const directManualLinksBlock = orderedManualLinks.map((entry) => {
					const label = safeText(entry && entry.label, "Manual");
					const url = getSafeHttpUrl(entry && entry.url);
					if (!url) {
						return "";
					}

					return ""
						+ "<a href=\"" + escapeHtml(url) + "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100\">"
						+ "<span>" + escapeHtml(label) + "</span>"
						+ "</a>";
				}).join("");

				const woodpeckerLinksBlock = docsContext.woodpeckerSearchLinks.map((entry) => {
					const modelCode = safeText(entry && entry.modelCode, "");
					const url = getSafeHttpUrl(entry && entry.url);
					if (!url) {
						return "";
					}

					return ""
						+ "<a href=\"" + escapeHtml(url) + "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">"
						+ "<span>Open Woodpecker Search</span>"
						+ (modelCode ? "<span class=\"text-brand-700/80\">" + escapeHtml(modelCode) + "</span>" : "")
						+ "</a>";
				}).join("");

				const docsBlock = ""
					+ "<section class=\"rounded-xl border border-emerald-200 bg-emerald-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Manuals & Documentation</h5>"
					+ "<p class=\"mt-1 text-xs text-slate-600\">Open manuals directly during troubleshooting.</p>"
					+ (directManualLinksBlock
						? "<div class=\"mt-3 flex flex-wrap gap-2\">" + directManualLinksBlock + "</div>"
						: "<p class=\"mt-3 text-xs text-slate-600\">No direct manual links configured for this model yet.</p>")
					+ (woodpeckerLinksBlock
						? "<div class=\"mt-2 flex flex-wrap gap-2\">" + woodpeckerLinksBlock + "</div>"
						: "")
					+ (docsContext.woodpeckerPortalUrl
						? "<a href=\"" + escapeHtml(docsContext.woodpeckerPortalUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"mt-2 inline-flex text-xs font-semibold text-brand-700 hover:underline\">Open Woodpecker portal</a>"
						: "")
					+ "</section>";

				return docsBlock;
			}

			function renderPoliciesPane(model) {
				const matchedPolicy = getPolicyForModel(model);
				const policyCriteriaList = getPolicyCriteriaEntries(matchedPolicy);

				const criteriaRows = policyCriteriaList.map(([key, value]) => (
					"<tr class=\"border-b border-slate-100 last:border-0\">"
					+ "<th scope=\"row\" class=\"w-[52%] px-3 py-2 text-left text-xs font-semibold text-slate-700\">" + safeText(key, "Rule") + "</th>"
					+ "<td class=\"px-3 py-2 text-xs text-slate-700\">" + safeText(value, "-") + "</td>"
					+ "</tr>"
				)).join("");

				return ""
					+ "<section class=\"rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Pixel policy for " + getModelName(model) + "</h5>"
					+ "<div class=\"mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white\">"
					+ "<table class=\"min-w-full divide-y divide-slate-200\">"
					+ "<tbody class=\"divide-y divide-slate-100\">"
					+ (criteriaRows || "<tr><td class=\"px-3 py-3 text-sm text-slate-600\" colspan=\"2\">No pixel policy criteria available for this model.</td></tr>")
					+ "</tbody>"
					+ "</table>"
					+ "</div>"
					+ "</section>"
					+ "";
			}

			function renderGalleryPane(model) {
				const media = getModelMedia(model);
				const mediaItems = media
					? [
						{
							label: getModelName(model) + " front view",
							note: "Official product gallery image.",
							imageUrl: getSafeHttpUrl(media.frontImageUrl)
						},
						{
							label: getModelName(model) + " remote control",
							note: getSafeHttpUrl(media.remoteImageUrl)
								? "Official accessory/remote image."
								: "No dedicated remote image found in source.",
							imageUrl: getSafeHttpUrl(media.remoteImageUrl)
						},
						{
							label: getModelName(model) + " connectors",
							note: getSafeHttpUrl(media.portsImageUrl)
								? "Official rear ports image."
								: "No dedicated rear ports image found in source.",
							imageUrl: getSafeHttpUrl(media.portsImageUrl)
						}
					]
					: [];

				const placeholders = safeList(model.galleryPlaceholders);
				const fallbackItems = [
					{ label: getModelName(model) + " front view", note: "Placeholder for product photo." },
					{ label: getModelName(model) + " remote control", note: "Placeholder for remote image." },
					{ label: getModelName(model) + " connectors", note: "Placeholder for rear ports image." }
				];
				const sourceItems = mediaItems.length ? mediaItems : (placeholders.length ? placeholders : fallbackItems);
				const items = sourceItems.map((item) => ""
					+ (() => {
						const imageUrl = getSafeHttpUrl(item && item.imageUrl);
						const displayUrl = getRenderableImageUrl(imageUrl, 1200);
						const zoomUrl = getRenderableImageUrl(imageUrl, 2400);
						return ""
					+ "<div class=\"rounded-xl border border-slate-300 bg-slate-50 p-3\">"
					+ (imageUrl
						? "<div class=\"overflow-hidden rounded-lg border border-slate-200 bg-white p-1\"><img src=\"" + escapeHtml(displayUrl) + "\" alt=\"" + escapeHtml(safeText(item.label, "Model image")) + "\" class=\"js-zoomable-image h-40 w-full cursor-zoom-in object-contain\" loading=\"lazy\" tabindex=\"0\" role=\"button\" data-zoom-src=\"" + escapeHtml(zoomUrl) + "\"></div>"
						: "<div class=\"rounded-lg border-2 border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500\">Image not available</div>")
					+ "<p class=\"mt-2 text-sm font-semibold text-slate-800\">" + safeText(item.label, "Image placeholder") + "</p>"
					+ "<p class=\"mt-1 text-xs text-slate-500\">" + safeText(item.note, "") + "</p>"
					+ "</div>";
					})()).join("");

				return ""
					+ "<div class=\"grid gap-3 sm:grid-cols-2 xl:grid-cols-3\">"
					+ items
					+ "</div>";
			}

			function renderDetailPane(model, paneName) {
				if (paneName === "ports") {
					return renderPortsPane(model);
				}
				if (paneName === "troubleshooting") {
					return renderTroubleshootingPane(model);
				}
				if (paneName === "policies") {
					return renderPoliciesPane(model);
				}
				if (paneName === "gallery") {
					return renderGalleryPane(model);
				}
				return renderSpecsPane(model);
			}

			function setDetailTab(tabName) {
				state.activeDetailTab = tabName;
				detailTabButtons.forEach((button) => {
					const isActive = button.dataset.detailTab === tabName;
					button.classList.toggle("is-active", isActive);
					button.classList.toggle("text-slate-600", !isActive);
					button.classList.toggle("text-brand-700", isActive);
				});

				detailPanes.forEach((pane) => {
					pane.classList.toggle("pane-hidden", pane.dataset.pane !== tabName);
				});

				const model = getModelById(state.selectedModelId);
				if (!model) {
					return;
				}

				const targetPane = detailPanes.find((pane) => pane.dataset.pane === tabName);
				if (targetPane) {
					targetPane.innerHTML = renderDetailPane(model, tabName);
					primeZoomImagesInContainer(targetPane);
				}

				persistSessionState();
			}

			function renderModelDetail(model) {
				const platform = getModelPlatform(model);
				detailTitle.textContent = getModelDisplayTitle(model);
				detailSubTitle.textContent = "Model linked to " + countryConfigs[state.countryCode].label + " country context and " + getModelOS(model) + " OS guides.";

				const yearLabel = getModelYear(model);
				const isYearInteractive = Boolean(getExplicitKnowledgeArticleByTerm(yearLabel, { model }));
				const isOsInteractive = Boolean(getExplicitKnowledgeArticleByTerm(getModelOS(model), { model }));
				const isPlatformInteractive = platform ? Boolean(getExplicitKnowledgeArticleByTerm(platform, { model })) : false;

				const badges = [
					renderKnowledgePill(yearLabel, "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700", isYearInteractive),
					renderKnowledgePill(getModelOS(model), "rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-brand-700", isOsInteractive),
					renderKnowledgePill(platform || "Platform: -", "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700", isPlatformInteractive)
				];

				detailBadges.innerHTML = badges.join("");

				detailPanes.forEach((pane) => {
					pane.innerHTML = "";
				});

				setDetailTab(state.activeDetailTab || "specs");
				primeModelMediaZoomImages(model);
			}

			function renderArticle(sectionData, typeLabel) {
				articleTypeLabel.textContent = typeLabel;
				articleTitle.textContent = sectionData.title;
				articleSummary.textContent = sectionData.summary || "";
				articleContent.innerHTML = "";
				if (articleRecommendationDock) {
					articleRecommendationDock.innerHTML = "";
				}

				const fragment = document.createDocumentFragment();
				const articleImageUrl = typeLabel === "Knowledge Base Article"
					? safeText(sectionData && sectionData.imageUrl, "")
					: "";
				const articleSections = safeList(sectionData && sectionData.sections);

				const renderArticleSectionCard = (section) => {
					const container = document.createElement("section");
					container.className = "rounded-xl border border-slate-200 bg-slate-50 p-4";

					const heading = document.createElement("h4");
					heading.className = "text-base font-semibold text-slate-900";
					heading.textContent = section.heading;
					container.appendChild(heading);

					safeList(section.paragraphs).forEach((paragraphText) => {
						const paragraph = document.createElement("p");
						paragraph.className = "mt-2 text-sm text-slate-700";
						paragraph.textContent = paragraphText;
						container.appendChild(paragraph);
					});

					if (safeList(section.bullets).length > 0) {
						const list = document.createElement("ul");
						list.className = "mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700";
						safeList(section.bullets).forEach((itemText) => {
							const item = document.createElement("li");
							item.textContent = itemText;
							list.appendChild(item);
						});
						container.appendChild(list);
					}

					return container;
				};

				const renderArticleImageCard = () => {
					const imageCard = document.createElement("section");
					imageCard.className = "overflow-hidden rounded-xl border border-slate-200 bg-slate-50";

					const imageWrap = document.createElement("div");
					imageWrap.className = "w-full";

					const image = document.createElement("img");
					image.src = articleImageUrl;
					image.alt = safeText(sectionData && sectionData.title, "Knowledge article") + " image";
					image.className = "block h-auto w-full";
					image.loading = "lazy";
					image.decoding = "async";
					image.addEventListener("error", () => {
						imageWrap.innerHTML = ""
							+ "<div class=\"rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center\">"
							+ "<p class=\"text-sm font-semibold text-slate-800\">" + escapeHtml(safeText(sectionData && sectionData.title, "Knowledge article image")) + "</p>"
							+ "<p class=\"mt-1 text-xs text-slate-500\">Placeholder for article image.</p>"
							+ "</div>";
					});

					imageWrap.appendChild(image);
					imageCard.appendChild(imageWrap);
					return imageCard;
				};

				if (articleImageUrl && articleSections.length > 0) {
					const topRow = document.createElement("section");
					topRow.className = "grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-start";

					topRow.appendChild(renderArticleSectionCard(articleSections[0]));
					topRow.appendChild(renderArticleImageCard());
					fragment.appendChild(topRow);

					articleSections.slice(1).forEach((section) => {
						fragment.appendChild(renderArticleSectionCard(section));
					});
				} else {
					articleSections.forEach((section) => {
						fragment.appendChild(renderArticleSectionCard(section));
					});

					if (articleImageUrl) {
						fragment.appendChild(renderArticleImageCard());
					}
				}

				if (typeLabel === "Knowledge Base Article" && articleRecommendationDock) {
					const relatedArticles = getRelatedKnowledgeArticles(sectionData, 3);
					const compatibleModels = getCompatibleModelsForArticle(sectionData, 14);

					if (relatedArticles.length > 0 || compatibleModels.length > 0) {
						const recommendationSection = document.createElement("section");
						recommendationSection.className = "rounded-xl border border-cyan-200 bg-cyan-50/60 p-4";

						if (compatibleModels.length > 0) {
							const modelsHeading = document.createElement("h4");
							modelsHeading.className = "text-base font-semibold text-slate-900";
							modelsHeading.textContent = "Compatible TVs";
							recommendationSection.appendChild(modelsHeading);

							const modelsHint = document.createElement("p");
							modelsHint.className = "mt-1 text-xs text-slate-600";
							modelsHint.textContent = "Models matching this article topic (for example Matter, HDR, Ambilight).";
							recommendationSection.appendChild(modelsHint);

							const modelsList = document.createElement("div");
							modelsList.className = "mt-2 flex flex-wrap gap-2";
							compatibleModels.forEach((model, index) => {
								const button = document.createElement("button");
								button.type = "button";
								button.className = "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
								button.setAttribute("data-related-model-id", getModelKey(model, index));
								button.textContent = getModelName(model) + " (" + getModelYear(model) + ")";
								modelsList.appendChild(button);
							});
							recommendationSection.appendChild(modelsList);
						}

						if (relatedArticles.length > 0) {
							const relatedHeading = document.createElement("h4");
							relatedHeading.className = "mt-4 text-base font-semibold text-slate-900";
							relatedHeading.textContent = "Related Articles";
							recommendationSection.appendChild(relatedHeading);

							const relatedList = document.createElement("div");
							relatedList.className = "mt-2 flex flex-wrap gap-2";
							relatedArticles.forEach((article) => {
								const button = document.createElement("button");
								button.type = "button";
								button.className = "rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
								button.setAttribute("data-related-article-id", safeText(article && article.id, ""));
								button.textContent = safeText(article && article.title, "Open related article");
								relatedList.appendChild(button);
							});
							recommendationSection.appendChild(relatedList);
						}

						articleRecommendationDock.appendChild(recommendationSection);
					}
				}

				articleContent.appendChild(fragment);
			}

			function setViewMode(mode) {
				state.viewMode = mode;
				document.body.classList.toggle("article-mode", mode === "article");

				modelResultsSection.classList.toggle("hidden", mode !== "browse");
				modelDetailSection.classList.toggle("hidden", mode !== "detail");
				articleViewSection.classList.toggle("hidden", mode !== "article");

				persistSessionState();
			}

			function selectModel(modelId) {
				const model = getModelById(modelId);
				if (!model) {
					return;
				}

				state.selectedModelId = modelId;
				state.activeDetailTab = "specs";
				state.articleViewContext = null;
				hideQuickInfoModal();
				renderModelDetail(model);
				setViewMode("detail");
				updatePath();
			}

			function openKnowledgeArticle(articleId, options) {
				const article = getKnowledgeArticleById(articleId);
				if (!article) {
					return;
				}

				const hasExplicitModel = options && Object.prototype.hasOwnProperty.call(options, "fromModelId");
				const modelId = hasExplicitModel
					? options.fromModelId
					: (state.articleBackModelId || state.selectedModelId || null);
				setArticleBackTarget(modelId);
				state.articleViewContext = {
					kind: "knowledge",
					id: safeText(article && article.id, "")
				};

				renderArticle(article, "Knowledge Base Article");
				setViewMode("article");
			}

			function openPolicyArticle(policyPayload) {
				setArticleBackTarget(null);
				state.articleViewContext = {
					kind: "policy",
					payload: policyPayload
				};
				renderArticle(policyPayload, "Contacts and Policy Note");
				setViewMode("article");
			}

			function openQuickInfoForTerm(term, options) {
				const cleanTerm = safeText(term, "");
				if (!cleanTerm) {
					return;
				}

				const modelId = options && options.modelId ? options.modelId : state.selectedModelId;
				const model = modelId ? getModelById(modelId) : null;
				const match = getExplicitKnowledgeArticleByTerm(cleanTerm, { model });
				if (!match) {
					showQuickInfoToast("No detailed information available for this feature yet.");
					return;
				}

				showQuickInfoModal(match);
			}

			function refreshModelResults() {
				state.filteredModels = getFilterScopedModels();
				state.filteredArticles = getSearchScopedArticles();

				const activeResultsCount = state.resultsView === "articles"
					? state.filteredArticles.length
					: state.filteredModels.length;
				const activeEntityLabel = state.resultsView === "articles" ? "article" : "model";
				resultCountBadge.textContent = activeResultsCount + " " + activeEntityLabel + (activeResultsCount === 1 ? "" : "s");

				if (state.resultsView === "articles") {
					renderArticleGrid(state.filteredArticles);
				} else {
					renderModelGrid(state.filteredModels);
				}
				updatePath();
				persistSessionState();
			}

			function groupedSearchResults(results) {
				const groups = {
					"TV Models": [],
					"Knowledge Base": [],
					"Contacts & Policies": []
				};

				results.forEach((result) => {
					if (groups[result.category]) {
						groups[result.category].push(result);
					}
				});

				return groups;
			}

			function renderOmniDropdown(query) {
				const results = searchGlobalIndex(query, state.globalSearchIndex).slice(0, 2);

				if (!query.trim() || results.length === 0) {
					omniSearchDropdown.classList.add("search-dropdown-hidden");
					omniSearchDropdown.innerHTML = "";
					return;
				}

				const groups = groupedSearchResults(results);
				const groupMeta = [
					{ key: "TV Models", icon: "[TV]" },
					{ key: "Knowledge Base", icon: "[KB]" },
					{ key: "Contacts & Policies", icon: "[POL]" }
				];

				omniSearchDropdown.innerHTML = "";

				groupMeta.forEach((group) => {
					const items = groups[group.key];
					if (!items || items.length === 0) {
						return;
					}

					const section = document.createElement("section");
					section.className = "mb-2 last:mb-0";

					const heading = document.createElement("p");
					heading.className = "px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500";
					heading.textContent = group.icon + " " + group.key;
					section.appendChild(heading);

					items.slice(0, 5).forEach((item) => {
						const button = document.createElement("button");
						button.type = "button";
						button.className = "block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-50";

						button.innerHTML = ""
							+ "<p class=\"text-sm font-semibold text-slate-900\">" + item.title + "</p>"
							+ "<p class=\"text-xs text-slate-500\">" + item.subtitle + "</p>";

						button.addEventListener("click", () => {
							omniSearchDropdown.classList.add("search-dropdown-hidden");
							omniSearchDropdown.innerHTML = "";

							if (item.entityType === "model") {
								selectModel(item.payload.modelId);
								return;
							}

							if (item.entityType === "article") {
								openKnowledgeArticle(item.payload.articleId);
								return;
							}

							if (item.entityType === "policy") {
								openPolicyArticle(item.payload);
							}
						});

						section.appendChild(button);
					});

					omniSearchDropdown.appendChild(section);
				});

				omniSearchDropdown.classList.remove("search-dropdown-hidden");
			}

			function setActiveModule(tabKey) {
				state.activeModule = tabKey;
				moduleTabButtons.forEach((button) => {
					const isActive = button.dataset.tab === tabKey;
					button.classList.toggle("is-active", isActive);
					button.classList.toggle("text-slate-600", !isActive);
				});
				moduleNotice.textContent = moduleDescriptions[tabKey] || moduleDescriptions.TV;
				persistSessionState();
			}

			function applyCountryConfig(countryCode) {
				if (!countryConfigs[countryCode]) {
					return;
				}

				state.countryCode = countryCode;
				countryBadge.textContent = countryConfigs[countryCode].label;
				localStorage.setItem(storageKeyCountry, countryCode);

				if (state.selectedModelId && state.viewMode === "detail") {
					const model = getModelById(state.selectedModelId);
					if (model) {
						renderModelDetail(model);
					}
				}

				persistSessionState();
			}

			function setPrintPreview(enabled) {
				state.printPreview = enabled;
				document.body.classList.toggle("print-preview", enabled);
				printModeBtn.textContent = enabled ? "Exit print mode" : "Print mode";
			}

			function showDashboard(options) {
				const instant = Boolean(options && options.instant);
				document.documentElement.classList.remove("resume-ready");

				if (instant) {
					splashScreen.classList.remove("is-hiding");
					splashScreen.classList.add("hidden");
					appShell.classList.remove("is-hidden");
					globalSearch.focus();
					return;
				}

				splashScreen.classList.add("is-hiding");
				window.setTimeout(() => {
					splashScreen.classList.add("hidden");
					appShell.classList.remove("is-hidden");
					globalSearch.focus();
				}, 320);
			}

			function returnToSplash() {
				state.isRestoringSession = true;
				document.documentElement.classList.remove("resume-ready");
				appShell.classList.add("is-hidden");
				splashScreen.classList.remove("hidden");
				splashScreen.classList.remove("is-hiding");
				localStorage.removeItem(storageKeyCountry);
				clearPersistedSessionState();
				setPrintPreview(false);
				setViewMode("browse");
				state.selectedModelId = null;
				state.articleViewContext = null;
				setArticleBackTarget(null);
				state.searchQuery = "";
				state.resultsView = "models";
				state.filters = {
					year: "all",
					os: "all",
					panel: "all"
				};
				setResultsView("models");
				globalSearch.value = "";
				updateFilterOptions();
				refreshModelResults();
				state.isRestoringSession = false;
				clearPersistedSessionState();

				window.setTimeout(() => {
					countrySelect.focus();
				}, 120);
			}

			function toggleChangelog(forceOpen) {
				const willOpen = typeof forceOpen === "boolean"
					? forceOpen
					: changelogPanel.classList.contains("changelog-panel-hidden");

				changelogPanel.classList.toggle("changelog-panel-hidden", !willOpen);
			}

			function renderChangelogAccordion() {
				if (!changelogAccordion) {
					return;
				}

				changelogAccordion.innerHTML = "";

				changelogVisibleEntries.forEach((entry, index) => {
					const item = document.createElement("section");
					item.className = "changelog-accordion-item rounded-xl border border-slate-200 bg-white";

					const header = document.createElement("button");
					header.type = "button";
					header.className = "flex w-full items-center justify-between gap-3 px-3 py-2 text-left";
					header.setAttribute("aria-expanded", index === 0 ? "true" : "false");

					header.innerHTML = ""
						+ "<div>"
						+ "<p class=\"text-xs font-semibold uppercase tracking-[0.14em] text-slate-500\">" + entry.date + " | " + entry.version + "</p>"
						+ "<p class=\"mt-0.5 text-sm font-semibold text-slate-800\">" + entry.title + "</p>"
						+ "</div>"
						+ "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.8\" stroke=\"currentColor\" class=\"changelog-chevron h-4 w-4 text-slate-500\">"
						+ "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m19.5 8.25-7.5 7.5-7.5-7.5\" />"
						+ "</svg>";

					const body = document.createElement("div");
					body.className = "changelog-accordion-body border-t border-slate-100 px-3 py-2";

					const list = document.createElement("ul");
					list.className = "list-disc space-y-1 pl-5 text-xs text-slate-700";

					entry.details.forEach((detail) => {
						const li = document.createElement("li");
						li.textContent = detail;
						list.appendChild(li);
					});

					body.appendChild(list);
					item.appendChild(header);
					item.appendChild(body);

					header.addEventListener("click", () => {
						const isAlreadyOpen = item.classList.contains("is-open");

						changelogAccordion.querySelectorAll(".changelog-accordion-item").forEach((entryItem) => {
							entryItem.classList.remove("is-open");
							const entryHeader = entryItem.querySelector("button");
							if (entryHeader) {
								entryHeader.setAttribute("aria-expanded", "false");
							}
						});

						if (!isAlreadyOpen) {
							item.classList.add("is-open");
							header.setAttribute("aria-expanded", "true");

							if (entry.id && !seenChangelogIds.has(entry.id)) {
								seenChangelogIds.add(entry.id);
								persistSeenChangelogIds();
								updateChangelogUnreadDot();
							}
						}
					});

					changelogAccordion.appendChild(item);
				});
			}

			async function initializeData(restoredSession) {
				const data = await loadRelationalData();
				data.ModelsData = normalizeModelsData(data.ModelsData);
				data.PoliciesData = data.PoliciesData || {};
				data.TroubleshootingData = data.TroubleshootingData || {};
				data.KnowledgeBaseData = normalizeKnowledgeData(data.KnowledgeBaseData);
				data.ModelPlatformChassisData = safeList(data.ModelPlatformChassisData);
				data.DocumentationLinksData = normalizeDocumentationLinksData(data.DocumentationLinksData);

				state.data = data;
				state.modelPlatformChassisLookup = buildModelPlatformChassisLookup(data.ModelPlatformChassisData);
				state.modelSearchIndex = buildSearchIndexFromEntries(buildModelSearchEntries(data.ModelsData));
				state.globalSearchIndex = buildSearchIndexFromEntries(buildGlobalEntries(data));

				if (isPlainObject(restoredSession)) {
					state.isRestoringSession = true;
					applyPersistedSessionState(restoredSession);
					setActiveModule(state.activeModule);
				}

				updateFilterOptions();
				setResultsView(state.resultsView);

				if (isPlainObject(restoredSession)) {
					restoreViewFromPersistedSession();
					state.isRestoringSession = false;
					persistSessionState();
				}
			}

			continueBtn.addEventListener("click", () => {
				applyCountryConfig(countrySelect.value);
				showDashboard();
			});

			changeCountryBtn.addEventListener("click", () => {
				returnToSplash();
			});

			printModeBtn.addEventListener("click", () => {
				setPrintPreview(!state.printPreview);
			});

			printNowBtn.addEventListener("click", () => {
				setPrintPreview(true);
				window.print();
			});

			articlePrintBtn.addEventListener("click", () => {
				setPrintPreview(true);
				window.print();
			});

			window.addEventListener("afterprint", () => {
				setPrintPreview(false);
			});

			backToResultsBtn.addEventListener("click", () => {
				setViewMode("browse");
			});

			articleBackBtn.addEventListener("click", () => {
				if (state.articleBackModelId && getModelById(state.articleBackModelId)) {
					selectModel(state.articleBackModelId);
					return;
				}

				setViewMode("browse");
			});

			function handleArticleRecommendationClick(event) {
				const target = event.target;
				if (!(target instanceof Element)) {
					return;
				}

				const relatedArticleButton = target.closest("[data-related-article-id]");
				if (relatedArticleButton) {
					const articleId = safeText(relatedArticleButton.getAttribute("data-related-article-id"), "");
					if (!articleId) {
						return;
					}

					openKnowledgeArticle(articleId, { fromModelId: state.articleBackModelId || state.selectedModelId || null });
					return;
				}

				const relatedModelButton = target.closest("[data-related-model-id]");
				if (relatedModelButton) {
					const modelId = safeText(relatedModelButton.getAttribute("data-related-model-id"), "");
					if (!modelId) {
						return;
					}

					selectModel(modelId);
				}
			}

			if (articleContent) {
				articleContent.addEventListener("click", handleArticleRecommendationClick);
			}

			if (articleRecommendationDock) {
				articleRecommendationDock.addEventListener("click", handleArticleRecommendationClick);
			}

			if (modelDetailSection) {
				modelDetailSection.addEventListener("click", (event) => {
					const target = event.target;
					if (!(target instanceof Element)) {
						return;
					}

					const zoomableImage = target.closest(".js-zoomable-image");
					if (zoomableImage) {
						const zoomSrc = safeText(zoomableImage.getAttribute("data-zoom-src"), zoomableImage.getAttribute("src") || "");
						const zoomAlt = safeText(zoomableImage.getAttribute("alt"), "Zoom preview");
						showImageZoomModal(zoomSrc, zoomAlt);
						return;
					}

					const sizeTrigger = target.closest(".js-model-size-trigger");
					if (sizeTrigger) {
						const model = getModelById(state.selectedModelId);
						if (!model) {
							return;
						}

						const selectedSize = safeText(sizeTrigger.getAttribute("data-model-size"), "");
						if (!setModelSelectedSize(getModelKey(model), selectedSize)) {
							return;
						}

						setDetailTab(state.activeDetailTab || "specs");
						return;
					}

					const trigger = target.closest(".js-spec-detail-trigger");
					if (trigger) {
						const model = getModelById(state.selectedModelId);
						if (!model) {
							return;
						}

						const detailType = safeText(trigger.getAttribute("data-spec-detail"), "audio");
						showSpecDetailsModal(model, detailType);
						return;
					}

					const pill = target.closest(".js-kb-pill");
					if (!pill) {
						return;
					}

					const term = safeText(pill.getAttribute("data-kb-term"), pill.textContent || "");
					openQuickInfoForTerm(term, { modelId: state.selectedModelId });
				});

				modelDetailSection.addEventListener("mouseover", (event) => {
					primeZoomImageFromTarget(event.target);
				});

				modelDetailSection.addEventListener("focusin", (event) => {
					primeZoomImageFromTarget(event.target);
				});

				modelDetailSection.addEventListener("keydown", (event) => {
					const target = event.target;
					if (!(target instanceof Element)) {
						return;
					}

					const isKeyboardTrigger = event.key === "Enter" || event.key === " ";
					if (!isKeyboardTrigger) {
						return;
					}

					if (target.classList.contains("js-spec-detail-trigger")) {
						event.preventDefault();
						const model = getModelById(state.selectedModelId);
						if (!model) {
							return;
						}

						const detailType = safeText(target.getAttribute("data-spec-detail"), "audio");
						showSpecDetailsModal(model, detailType);
						return;
					}

					if (!target.classList.contains("js-kb-pill")) {
						if (target.classList.contains("js-zoomable-image")) {
							event.preventDefault();
							const zoomSrc = safeText(target.getAttribute("data-zoom-src"), target.getAttribute("src") || "");
							const zoomAlt = safeText(target.getAttribute("alt"), "Zoom preview");
							showImageZoomModal(zoomSrc, zoomAlt);
						}
						return;
					}

					event.preventDefault();
					const term = safeText(target.getAttribute("data-kb-term"), target.textContent || "");
					openQuickInfoForTerm(term, { modelId: state.selectedModelId });
				});
			}

			if (quickInfoCloseBtn) {
				quickInfoCloseBtn.addEventListener("click", hideQuickInfoModal);
			}

			if (quickInfoDismissBtn) {
				quickInfoDismissBtn.addEventListener("click", hideQuickInfoModal);
			}

			if (quickInfoModal && quickInfoCard) {
				quickInfoModal.addEventListener("click", (event) => {
					if (event.target === quickInfoModal) {
						hideQuickInfoModal();
					}
				});
			}

			if (quickInfoReadBtn) {
				quickInfoReadBtn.addEventListener("click", () => {
					if (!state.quickInfoArticleId) {
						hideQuickInfoModal();
						return;
					}

					const targetArticleId = state.quickInfoArticleId;
					const currentModelId = state.selectedModelId;
					hideQuickInfoModal();
					openKnowledgeArticle(targetArticleId, { fromModelId: currentModelId });
				});
			}

			if (specDetailsCloseBtn) {
				specDetailsCloseBtn.addEventListener("click", hideSpecDetailsModal);
			}

			if (specDetailsDismissBtn) {
				specDetailsDismissBtn.addEventListener("click", hideSpecDetailsModal);
			}

			if (specDetailsModal && specDetailsCard) {
				specDetailsModal.addEventListener("click", (event) => {
					if (event.target === specDetailsModal) {
						hideSpecDetailsModal();
					}
				});
			}

			if (imageZoomCloseBtn) {
				imageZoomCloseBtn.addEventListener("click", hideImageZoomModal);
			}

			if (imageZoomModal && imageZoomCard) {
				imageZoomModal.addEventListener("click", (event) => {
					if (event.target === imageZoomModal) {
						hideImageZoomModal();
					}
				});
			}

			if (specDetailsBody) {
				specDetailsBody.addEventListener("click", (event) => {
					const target = event.target;
					if (!(target instanceof Element)) {
						return;
					}

					const sizeTrigger = target.closest(".js-spec-size-trigger");
					if (!sizeTrigger || !state.specDetailsContext) {
						return;
					}

					const selectedSize = safeText(sizeTrigger.getAttribute("data-spec-size"), "");
					if (!setModelSelectedSize(state.specDetailsContext.modelId, selectedSize)) {
						return;
					}

					renderSpecDetailsModalFromContext();

					if (state.selectedModelId === state.specDetailsContext.modelId && state.viewMode === "detail") {
						setDetailTab(state.activeDetailTab || "specs");
					}
				});
			}

			moduleTabButtons.forEach((button) => {
				button.addEventListener("click", () => {
					setActiveModule(button.dataset.tab || "TV");
				});
			});

			detailTabButtons.forEach((button) => {
				button.addEventListener("click", () => {
					setDetailTab(button.dataset.detailTab || "specs");
				});
			});

			yearFilter.addEventListener("change", () => {
				state.filters.year = yearFilter.value;
				state.filters.os = "all";
				state.filters.panel = "all";
				updateFilterOptions();
				refreshModelResults();
			});

			osFilter.addEventListener("change", () => {
				state.filters.os = osFilter.value;
				state.filters.panel = "all";
				updateFilterOptions();
				refreshModelResults();
			});

			panelFilter.addEventListener("change", () => {
				state.filters.panel = panelFilter.value;
				refreshModelResults();
			});

			globalSearch.addEventListener("input", () => {
				state.searchQuery = globalSearch.value;
				refreshModelResults();
				renderOmniDropdown(state.searchQuery);
			});

			globalSearch.addEventListener("keydown", (event) => {
				if (event.key !== "Enter") {
					return;
				}

				if (state.resultsView === "articles") {
					if (state.filteredArticles.length > 0) {
						openKnowledgeArticle(safeText(state.filteredArticles[0] && state.filteredArticles[0].id, ""), { fromModelId: state.selectedModelId || null });
						omniSearchDropdown.classList.add("search-dropdown-hidden");
					}
					return;
				}

				if (state.filteredModels.length > 0) {
					selectModel(getModelKey(state.filteredModels[0]));
					omniSearchDropdown.classList.add("search-dropdown-hidden");
				}
			});

			if (resultsModeModelsBtn) {
				resultsModeModelsBtn.addEventListener("click", () => {
					setResultsView("models");
				});
			}

			if (resultsModeArticlesBtn) {
				resultsModeArticlesBtn.addEventListener("click", () => {
					setResultsView("articles");
				});
			}

			window.addEventListener("keydown", (event) => {
				const activeTag = document.activeElement ? document.activeElement.tagName : "";
				const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);

				if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
					event.preventDefault();
					globalSearch.focus();
					globalSearch.select();
				}

				if (!isTyping && event.key === "/") {
					event.preventDefault();
					globalSearch.focus();
				}

				if (event.key === "Escape") {
					hideQuickInfoModal();
					hideSpecDetailsModal();
					hideImageZoomModal();
					toggleChangelog(false);
					omniSearchDropdown.classList.add("search-dropdown-hidden");
				}
			});

			changelogBtn.addEventListener("click", (event) => {
				event.stopPropagation();
				toggleChangelog();
			});

			closeChangelogBtn.addEventListener("click", () => {
				toggleChangelog(false);
			});

			document.addEventListener("click", (event) => {
				const target = event.target;
				if (!(target instanceof Node)) {
					return;
				}

				if (!changelogPanel.contains(target) && !changelogBtn.contains(target)) {
					toggleChangelog(false);
				}

				if (!omniSearchDropdown.contains(target) && !globalSearch.contains(target)) {
					omniSearchDropdown.classList.add("search-dropdown-hidden");
				}
			});

			window.addEventListener("scroll", () => {
				const shouldShow = window.scrollY > 420;
				scrollTopBtn.classList.toggle("scroll-btn-hidden", !shouldShow);
			});

			scrollTopBtn.addEventListener("click", () => {
				window.scrollTo({ top: 0, behavior: "smooth" });
			});

			const persistedSession = loadPersistedSessionState();
			const persistedCountry = isPlainObject(persistedSession) ? safeText(persistedSession.countryCode, "") : "";
			if (persistedCountry && countryConfigs[persistedCountry]) {
				countrySelect.value = persistedCountry;
			}

			const effectiveResumeCountry = (persistedCountry && countryConfigs[persistedCountry])
				? persistedCountry
				: ((savedCountry && countryConfigs[savedCountry]) ? savedCountry : "");
			const shouldAutoResume = Boolean(effectiveResumeCountry);

			if (shouldAutoResume) {
				showDashboard({ instant: true });
			}

			setActiveModule("TV");
			applyCountryConfig(countrySelect.value);
			loadSeenChangelogIds();
			renderChangelogAccordion();
			updateChangelogUnreadDot();
			setPrintPreview(false);
			toggleChangelog(false);
			setResultsView("models");
			setViewMode("browse");
			initializeData(persistedSession);
		})();

