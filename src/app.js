import ModelPlatformChassisData from '../data/model-platform-chassis.js';

export async function initCallCenterApp(api, options) {
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
				TV: "moduleNoticeTv",
				MNT: "moduleNoticeMnt",
				AVA: "moduleNoticeAva"
			};

			                const RelationalMockData = {
        ModelsData: [],
        PoliciesData: {},
        TroubleshootingData: {},
        KnowledgeBaseData: [],
        ModelMediaData: {},
        ModelPlatformChassisData: ModelPlatformChassisData,
        DocumentationLinksData: {},
        ChangelogEntriesData: []
    };


							function getRuntimeApiBaseUrl() {
								const runtimeConfig = (window && window.SupportHubConfig && typeof window.SupportHubConfig === "object")
									? window.SupportHubConfig
									: {};

								const rawUrl = String(runtimeConfig.apiBaseUrl || "").trim();
								if (!rawUrl) {
									return "";
								}

								return rawUrl.replace(/\/+$/, "");
							}

							const runtimeApiBaseUrl = getRuntimeApiBaseUrl();
			const isAdminRoute = Boolean(window && window.IS_ADMIN_ROUTE === true);
			const adminTokenStorageKey = "support-hub-admin-token";
			const supportHubCacheName = "support-hub-cache-v1";

			const storageKeyCountry = "support-hub-country";
			const storageKeySession = "support-hub-session-v1";

			const splashScreen = document.getElementById("splashScreen");
			const countrySelect = document.getElementById("countrySelect");
			const continueBtn = document.getElementById("continueBtn");
			const appShell = document.getElementById("appShell");
			const globalLoader = document.getElementById("global-loader");
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
			const detailTypeLabel = document.getElementById("detailTypeLabel");
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
				modelDetailsById: {},
				modelDetailRequestToken: 0,
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
				modelPlatformChassisLookup: null,
				isAdminRoute,
				isAdmin: false,
				adminToken: "",
				adminDirty: false,
				currentModel: null
			};

			const localeByCountry = {
				UK: "en",
				PL: "pl",
				DE: "de"
			};

			const countryLabels = {
				en: {
					UK: "United Kingdom (UK)",
					PL: "Poland (PL)",
					DE: "Germany (DE)"
				},
				pl: {
					UK: "Wielka Brytania (UK)",
					PL: "Polska (PL)",
					DE: "Niemcy (DE)"
				},
				de: {
					UK: "Vereinigtes Königreich (UK)",
					PL: "Polen (PL)",
					DE: "Deutschland (DE)"
				}
			};

			const plTranslations = {
				"Tilt": "Nachylenie",
				"Height Adjust": "Regulacja wysokości",
				"Pivot": "Pivot (Obrót ekranu)",
				"Swivel": "Obrót w poziomie",
				"Speakers": "Głośniki",
				"Speaker power": "Moc głośników",
				"Speaker Power": "Moc głośników",
				"Webcam": "Kamera internetowa",
				"Bezel colour (Front)": "Kolor ramki (Przód)",
				"Cabinet colour (backside)": "Kolor obudowy (Tył)",
				"Powersensor/Lightsensor": "Czujnik zasilania / światła",
				"Resolution": "Rozdzielczość",
				"Warranty": "Gwarancja",
				"Panel": "Typ matrycy",
				"Brand": "Marka",
				"Platform": "Platforma",
				"Chassis": "Chassis",
				"Panel Type": "Typ matrycy",
				"Model Name": "Nazwa modelu",
				"Aspect Ratio": "Proporcje obrazu",
				"Curved": "Zakrzywienie",
				"Backlight": "Podświetlenie",
				"Max Refresh Rate": "Maks. częstotliwość odświeżania",
				"Response Time Gt G": "Czas reakcji (GtG)",
				"Response Time GtG": "Czas reakcji (GtG)",
				"Response Time MPRT": "Czas reakcji (MPRT)",
				"Brightness (max)": "Jasność (maks.)",
				"Contrast (static)": "Kontrast (statyczny)",
				"Touch": "Ekran dotykowy",
				"Sync Technology": "Technologia synchronizacji",
				"Headphone out": "Wyjście słuchawkowe",
				"Audio In": "Wejście audio",
				"HDMI Ports": "Porty HDMI",
				"Display Port Ports": "Porty DisplayPort",
				"DisplayPort Ports": "Porty DisplayPort",
				"Max VRR Refresh Rate": "Maks. częstotliwość odświeżania VRR",
				"Stand": "Podstawa",
				"Sizes": "Rozmiary",
				"VESA Standard": "Standard VESA",
				"Channels": "Kanały",
				"Audio Power": "Moc audio",
				"Dimensions": "Wymiary",
				"TV With Stand": "TV z podstawą",
				"TV Without Stand": "TV bez podstawy",
				"Weight": "Waga",
				"Refresh Rate": "Odświeżanie",
				"USB C": "USB C",
				"USB Hub": "Hub USB",
				"VGA cable": "Kabel VGA",
				"DVI cable": "Kabel DVI",
				"HDMI cable": "Kabel HDMI",
				"Displayport Cable": "Kabel DisplayPort",
				"Mini-DP cable": "Kabel Mini-DP",
				"Audio Cable": "Kabel audio",
				"USB-A to B Cable": "Kabel USB-A do B",
				"USB-C Cable": "Kabel USB-C",
				"Remote Control": "Pilot",
				"Cables": "Kable"
			};

			const plValueTranslations = {
				"Yes": "Tak",
				"No": "Nie",
				"Black": "Czarny",
				"White": "Biały",
				"Silver": "Srebrny",
				"HDMI Cable": "Kabel HDMI",
				"Displayport Cable": "Kabel DisplayPort",
				"Headphone out": "Wyjście słuchawkowe"
			};

			const deTranslations = {
				"Tilt": "Neigung",
				"Height Adjust": "Höhenverstellung",
				"Pivot": "Pivot",
				"Swivel": "Schwenken",
				"Speakers": "Lautsprecher",
				"Speaker power": "Lautsprecherleistung",
				"Speaker Power": "Lautsprecherleistung",
				"Webcam": "Webcam",
				"Resolution": "Auflösung",
				"Warranty": "Garantie",
				"Panel": "Paneltyp",
				"Brand": "Marke",
				"Platform": "Plattform",
				"Chassis": "Chassis",
				"Panel Type": "Paneltyp",
				"Model Name": "Modellname",
				"Aspect Ratio": "Seitenverhältnis",
				"Curved": "Gebogen",
				"Backlight": "Hintergrundbeleuchtung",
				"Max Refresh Rate": "Max. Bildwiederholfrequenz",
				"Response Time Gt G": "Reaktionszeit (GtG)",
				"Response Time GtG": "Reaktionszeit (GtG)",
				"Response Time MPRT": "Reaktionszeit (MPRT)",
				"Brightness (max)": "Helligkeit (max.)",
				"Contrast (static)": "Kontrast (statisch)",
				"Touch": "Touchscreen",
				"Sync Technology": "Synchronisierungstechnologie",
				"Headphone out": "Kopfhörerausgang",
				"Audio In": "Audioeingang",
				"HDMI Ports": "HDMI-Anschlüsse",
				"Display Port Ports": "DisplayPort-Anschlüsse",
				"DisplayPort Ports": "DisplayPort-Anschlüsse",
				"Max VRR Refresh Rate": "Max. VRR-Bildwiederholfrequenz",
				"Stand": "Standfuß",
				"Sizes": "Größen",
				"VESA Standard": "VESA-Standard",
				"Channels": "Kanäle",
				"Audio Power": "Audioleistung",
				"Dimensions": "Abmessungen",
				"TV With Stand": "TV mit Standfuß",
				"TV Without Stand": "TV ohne Standfuß",
				"Weight": "Gewicht",
				"Refresh Rate": "Bildwiederholfrequenz",
				"USB C": "USB-C",
				"USB Hub": "USB-Hub",
				"VGA cable": "VGA-Kabel",
				"DVI cable": "DVI-Kabel",
				"HDMI cable": "HDMI-Kabel",
				"Displayport Cable": "DisplayPort-Kabel",
				"Mini-DP cable": "Mini-DP-Kabel",
				"Audio Cable": "Audiokabel",
				"USB-A to B Cable": "USB-A-auf-B-Kabel",
				"USB-C Cable": "USB-C-Kabel",
				"Remote Control": "Fernbedienung",
				"Cables": "Kabel"
			};

			const deValueTranslations = {
				"Yes": "Ja",
				"No": "Nein",
				"Black": "Schwarz",
				"White": "Weiß",
				"Silver": "Silber",
				"HDMI Cable": "HDMI-Kabel",
				"Displayport Cable": "DisplayPort-Kabel",
				"Headphone out": "Kopfhörerausgang"
			};

			const labelTranslationsByLocale = {
				pl: plTranslations,
				de: deTranslations
			};

			const valueTranslationsByLocale = {
				pl: plValueTranslations,
				de: deValueTranslations
			};

			const plSectionTranslations = {
				"General": "Ogólne",
				"Display/Panel": "Wyświetlacz / Panel",
				"Physical": "Fizyczne",
				"Sound": "Dźwięk",
				"Connectivity": "Łączność",
				"Dimensions": "Wymiary",
				"What's in the box": "Co jest w pudełku"
			};

			const deSectionTranslations = {
				"General": "Allgemein",
				"Display/Panel": "Display / Panel",
				"Physical": "Physisch",
				"Sound": "Ton",
				"Connectivity": "Konnektivität",
				"Dimensions": "Abmessungen",
				"What's in the box": "Lieferumfang"
			};

			const sectionTranslationsByLocale = {
				pl: plSectionTranslations,
				de: deSectionTranslations
			};

			const techDictionary = {
				pl: {
					"Wall Mount Compatible": "Kompatybilność z uchwytem ściennym",
					"Wall mount compatible": "Kompatybilność z uchwytem ściennym",
					"Weight Incl. Packaging": "Waga z opakowaniem",
					"Weight incl. packaging": "Waga z opakowaniem",
					"Weight Incl Packaging": "Waga z opakowaniem",
					"Wireless Connection": "Połączenie bezprzewodowe",
					"Wireless connection": "Połączenie bezprzewodowe",
					"TV With Stand": "TV z podstawą",
					"TV Without Stand": "TV bez podstawy",
					"Width": "Szerokość",
					"Height": "Wysokość",
					"Depth": "Głębokość",
					"Stand Width": "Szerokość podstawy",
					"Stand Depth": "Głębokość podstawy",
					"Product Weight": "Waga produktu",
					"Package Dimensions": "Wymiary opakowania",
					"Package Weight": "Waga opakowania",
					"Power Consumption": "Pobór mocy",
					"Energy Class": "Klasa energetyczna",
					"USB Playback": "Odtwarzanie USB",
					"WiFi Standard": "Standard Wi-Fi",
					"Bluetooth Version": "Wersja Bluetooth",
					"Ethernet LAN RJ45": "Ethernet LAN RJ45",
					"Headphone Out": "Wyjście słuchawkowe",
					"Audio Return Channel": "Zwrotny kanał audio",
					"Supported Display Resolution": "Obsługiwana rozdzielczość obrazu",
					"Refresh Rate": "Odświeżanie",
					"Color": "Kolor",
					"Colour": "Kolor",
					"Remote Control": "Pilot"
				},
				de: {
					"Wall Mount Compatible": "Wandhalterung kompatibel",
					"Wall mount compatible": "Wandhalterung kompatibel",
					"Weight Incl. Packaging": "Gewicht inkl. Verpackung",
					"Weight incl. packaging": "Gewicht inkl. Verpackung",
					"Weight Incl Packaging": "Gewicht inkl. Verpackung",
					"Wireless Connection": "Drahtlose Verbindung",
					"Wireless connection": "Drahtlose Verbindung",
					"TV With Stand": "TV mit Standfuß",
					"TV Without Stand": "TV ohne Standfuß",
					"Width": "Breite",
					"Height": "Höhe",
					"Depth": "Tiefe",
					"Stand Width": "Standfußbreite",
					"Stand Depth": "Standfußtiefe",
					"Product Weight": "Produktgewicht",
					"Package Dimensions": "Verpackungsmaße",
					"Package Weight": "Verpackungsgewicht",
					"Power Consumption": "Stromverbrauch",
					"Energy Class": "Energieklasse",
					"USB Playback": "USB-Wiedergabe",
					"WiFi Standard": "WLAN-Standard",
					"Bluetooth Version": "Bluetooth-Version",
					"Ethernet LAN RJ45": "Ethernet LAN RJ45",
					"Headphone Out": "Kopfhörerausgang",
					"Audio Return Channel": "Audio-Rückkanal",
					"Supported Display Resolution": "Unterstützte Displayauflösung",
					"Refresh Rate": "Bildwiederholfrequenz",
					"Color": "Farbe",
					"Colour": "Farbe",
					"Remote Control": "Fernbedienung"
				}
			};

			const plSpecModalTranslations = {
				core: {
					title: "Core Hardware - Pełny widok",
					summary: "Rozszerzone dane wyświetlacza i panelu ze źródła technicznego."
				},
				audio: {
					title: "Specyfikacja audio - Pełny widok",
					summary: "Rozszerzone dane audio z arkusza technicznego Philips."
				},
				physical: {
					title: "Szczegóły fizyczne - Pełny widok",
					summary: "Rozszerzone dane fizyczne i obudowy ze źródła technicznego."
				},
				connectivity: {
					title: "Łączność - Pełny widok",
					summary: "Szczegóły komunikacji przewodowej i bezprzewodowej do zaawansowanego troubleshooting."
				},
				dimensions: {
					title: "Wymiary - Pełny widok",
					summary: "Wymiary zapakowanego i rozpakowanego produktu dla logistyki i rozmów supportowych."
				}
			};

			const uiText = {
				en: {
					documentTitle: "Support Hub - Global Call Center KB",
					supportHub: "Support Hub",
					knowledgeBaseTitle: "Global Technical Knowledge Base",
					knowledgeBaseIntro: "Select the operating region to load country context before entering the dashboard.",
					agentRegion: "Agent region",
					continueDashboard: "Continue to dashboard",
					loadingKnowledgeBase: "Loading knowledge base...",
					splashDefaultHint: "Country profile sets SWAP procedures, contact channels, and policy routing.",
					splashResumeHint: "Last used profile found. You can keep it or switch before continuing.",
					loadError: "Could not load backend data. Check API URL and service health, then try again.",
					consoleSubtitle: "Knowledge Console",
					printMode: "Print mode",
					exitPrintMode: "Exit print mode",
					openChangelog: "Open changelog",
					changeCountry: "Change country",
					globalSearch: "Search",
					globalSearchPlaceholder: "Search models, chassis, Matter, contact numbers, policy rules, known issues...",
					moduleNoticeTv: "TV module active. Showing television models only.",
					moduleNoticeMnt: "MNT module active. Showing monitor models only.",
					moduleNoticeAva: "AVA is currently a placeholder module. TV data remains active.",
					cascadingFilters: "Cascading Filters",
					year: "1) Year",
					os: "2) OS",
					panel: "3) Panel",
					anyYear: "Any Year",
					anyOs: "Any OS",
					anyPanel: "Any Panel",
					path: "Path",
					modelResults: "Model Results",
					articleResults: "Article Results",
					models: "Models",
					articles: "Articles",
					model: "model",
					article: "article",
					noModels: "No models matched current filters/query.",
					noArticles: "No articles matched current filters/query.",
					tvModelDetail: "TV Model Detail",
					mntModelDetail: "MNT Model Detail",
                    modelLinkedTo: "Model linked to {country} country context and {os} OS guides.",
					backToModelList: "Back to model list",
					backToModel: "Back to {model}",
					printDetail: "Print this detail",
					printArticle: "Print article",
					specs: "Specs",
					ports: "Ports",
					troubleshooting: "Troubleshooting",
					policies: "Policies",
					galleryImages: "Gallery / Images",
					changelog: "Changelog",
					close: "Close",
					quickFeatureInfo: "Quick Feature Info",
					readFullArticle: "Read Full Article",
					expandedTechnicalView: "Expanded Technical View",
					loadingImage: "Loading image",
					top: "Top",
					noSummary: "No summary available.",
					noDetailedPoints: "No detailed points available yet.",
					noTechnicalDetails: "No technical details found.",
					noExtendedFields: "No extended technical fields available for this section.",
					noRearLayout: "No rear layout available",
					showFullCore: "Show full Core Hardware details",
					showFullPhysical: "Show full Physical details",
					showFullConnectivity: "Show full connectivity details",
					showFullAudio: "Show full audio details",
					showFullDimensions: "Show full dimensions details",
					selectedSize: "Selected size: {size}",
					noKnowledgeFeatures: "No knowledge-linked features for this model.",
					coreHardware: "Core Hardware",
					physicalDetails: "Physical Details",
					audioSpecifications: "Audio Specifications",
					connectivity: "Connectivity",
					whatsInTheBox: "What's in the box",
					knowledgeFeatures: "Knowledge Features"
				},
				pl: {
					documentTitle: "Support Hub - Globalna baza Call Center",
					supportHub: "Support Hub",
					knowledgeBaseTitle: "Globalna Techniczna Baza Wiedzy",
					knowledgeBaseIntro: "Wybierz region pracy, aby załadować kontekst kraju przed wejściem do panelu.",
					agentRegion: "Region agenta",
					continueDashboard: "Przejdź do panelu",
					loadingKnowledgeBase: "Ładowanie bazy wiedzy...",
					splashDefaultHint: "Profil kraju ustawia procedury SWAP, kanały kontaktu i routing polityk.",
					splashResumeHint: "Znaleziono ostatnio używany profil. Możesz go zachować albo zmienić przed kontynuacją.",
					loadError: "Nie udało się załadować danych backendu. Sprawdź URL API i stan usługi, a potem spróbuj ponownie.",
					consoleSubtitle: "Knowledge Console",
					printMode: "Tryb druku",
					exitPrintMode: "Wyjdź z trybu druku",
					openChangelog: "Otwórz changelog",
					changeCountry: "Zmień kraj",
					globalSearch: "Wyszukiwarka",
					globalSearchPlaceholder: "Szukaj modeli, chassis, Matter, numerów kontaktowych, reguł polityk, znanych problemów...",
					moduleNoticeTv: "Aktywny moduł TV. Wyświetlane są tylko modele telewizorów.",
					moduleNoticeMnt: "Aktywny moduł MNT. Wyświetlane są tylko modele monitorów.",
					moduleNoticeAva: "AVA jest obecnie modułem zastępczym. Dane TV pozostają aktywne.",
					cascadingFilters: "Filtry kaskadowe",
					year: "1) Rok",
					os: "2) OS",
					panel: "3) Panel",
					anyYear: "Dowolny rok",
					anyOs: "Dowolny OS",
					anyPanel: "Dowolny panel",
					path: "Ścieżka",
					modelResults: "Wyniki modeli",
					articleResults: "Wyniki artykułów",
					models: "Modele",
					articles: "Artykuły",
					model: "model",
					article: "artykuł",
					noModels: "Brak modeli pasujących do obecnych filtrów/zapytania.",
					noArticles: "Brak artykułów pasujących do obecnych filtrów/zapytania.",
					tvModelDetail: "Szczegóły modelu TV",
					mntModelDetail: "Szczegóły modelu MNT",
					modelLinkedTo: "Model powiązany z kontekstem kraju: {country} oraz przewodnikami OS: {os}.",
					backToModelList: "Wróć do listy modeli",
					backToModel: "Wróć do {model}",
					printDetail: "Drukuj te szczegóły",
					printArticle: "Drukuj artykuł",
					specs: "Specyfikacja",
					ports: "Porty",
					troubleshooting: "Troubleshooting",
					policies: "Polityki",
					galleryImages: "Galeria / Obrazy",
					changelog: "Changelog",
					close: "Zamknij",
					quickFeatureInfo: "Szybka informacja o funkcji",
					readFullArticle: "Przeczytaj pełny artykuł",
					expandedTechnicalView: "Rozszerzony widok techniczny",
					loadingImage: "Ładowanie obrazu",
					top: "Do góry",
					noSummary: "Brak podsumowania.",
					noDetailedPoints: "Brak szczegółowych punktów.",
					noTechnicalDetails: "Nie znaleziono szczegółów technicznych.",
					noExtendedFields: "Brak rozszerzonych pól technicznych dla tej sekcji.",
					noRearLayout: "Brak widoku tylnego panelu",
					showFullCore: "Pokaż pełne szczegóły Core Hardware",
					showFullPhysical: "Pokaż pełne szczegóły fizyczne",
					showFullConnectivity: "Pokaż pełne szczegóły łączności",
					showFullAudio: "Pokaż pełne szczegóły audio",
					showFullDimensions: "Pokaż pełne szczegóły wymiarów",
					selectedSize: "Wybrany rozmiar: {size}",
					noKnowledgeFeatures: "Brak funkcji powiązanych z bazą wiedzy dla tego modelu.",
					coreHardware: "Core Hardware",
					physicalDetails: "Szczegóły fizyczne",
					audioSpecifications: "Specyfikacja audio",
					connectivity: "Łączność",
					whatsInTheBox: "Co jest w pudełku",
					knowledgeFeatures: "Dodatkowe Funkcje"
				},
				de: {
					documentTitle: "Support Hub - Globale Call-Center-Wissensbasis",
					supportHub: "Support Hub",
					knowledgeBaseTitle: "Globale technische Wissensbasis",
					knowledgeBaseIntro: "Wählen Sie die Arbeitsregion, um den Länderkontext vor dem Dashboard zu laden.",
					agentRegion: "Agentenregion",
					continueDashboard: "Weiter zum Dashboard",
					loadingKnowledgeBase: "Wissensbasis wird geladen...",
					splashDefaultHint: "Das Länderprofil setzt SWAP-Prozesse, Kontaktkanäle und Policy-Routing.",
					splashResumeHint: "Zuletzt verwendetes Profil gefunden. Sie können es behalten oder vor dem Fortfahren wechseln.",
					loadError: "Backend-Daten konnten nicht geladen werden. Prüfen Sie API-URL und Dienststatus und versuchen Sie es erneut.",
					consoleSubtitle: "Knowledge Console",
					printMode: "Druckmodus",
					exitPrintMode: "Druckmodus beenden",
					openChangelog: "Changelog öffnen",
					changeCountry: "Land ändern",
					globalSearch: "Suche",
					globalSearchPlaceholder: "Modelle, Chassis, Matter, Kontaktnummern, Policy-Regeln, bekannte Probleme suchen...",
					moduleNoticeTv: "TV-Modul aktiv. Es werden nur TV-Modelle angezeigt.",
					moduleNoticeMnt: "MNT-Modul aktiv. Es werden nur Monitor-Modelle angezeigt.",
					moduleNoticeAva: "AVA ist derzeit ein Platzhaltermodul. TV-Daten bleiben aktiv.",
					cascadingFilters: "Kaskadierende Filter",
					year: "1) Jahr",
					os: "2) OS",
					panel: "3) Panel",
					anyYear: "Jedes Jahr",
					anyOs: "Jedes OS",
					anyPanel: "Jedes Panel",
					path: "Pfad",
					modelResults: "Modellergebnisse",
					articleResults: "Artikelergebnisse",
					models: "Modelle",
					articles: "Artikel",
					model: "Modell",
					article: "Artikel",
					noModels: "Keine Modelle entsprechen den aktuellen Filtern/der Suche.",
					noArticles: "Keine Artikel entsprechen den aktuellen Filtern/der Suche.",
					tvModelDetail: "TV-Modelldetails",
					mntModelDetail: "MNT-Modelldetails",
					modelLinkedTo: "Modell verknüpft mit Länderkontext {country} und {os}-OS-Leitfäden.",
					backToModelList: "Zurück zur Modellliste",
					backToModel: "Zurück zu {model}",
					printDetail: "Diese Details drucken",
					printArticle: "Artikel drucken",
					specs: "Spezifikationen",
					ports: "Ports",
					troubleshooting: "Fehlerbehebung",
					policies: "Policies",
					galleryImages: "Galerie / Bilder",
					changelog: "Changelog",
					close: "Schließen",
					quickFeatureInfo: "Schnelle Feature-Info",
					readFullArticle: "Vollständigen Artikel lesen",
					expandedTechnicalView: "Erweiterte technische Ansicht",
					loadingImage: "Bild wird geladen",
					top: "Nach oben",
					noSummary: "Keine Zusammenfassung verfügbar.",
					noDetailedPoints: "Noch keine Detailpunkte verfügbar.",
					noTechnicalDetails: "Keine technischen Details gefunden.",
					noExtendedFields: "Keine erweiterten technischen Felder für diesen Abschnitt verfügbar.",
					noRearLayout: "Kein Rückseitenlayout verfügbar",
					showFullCore: "Vollständige Core-Hardware-Details anzeigen",
					showFullPhysical: "Vollständige physische Details anzeigen",
					showFullConnectivity: "Vollständige Konnektivitätsdetails anzeigen",
					showFullAudio: "Vollständige Audiodetails anzeigen",
					showFullDimensions: "Vollständige Abmessungsdetails anzeigen",
					selectedSize: "Ausgewählte Größe: {size}",
					noKnowledgeFeatures: "Keine wissensverknüpften Features für dieses Modell.",
					coreHardware: "Core Hardware",
					physicalDetails: "Physische Details",
					audioSpecifications: "Audiospezifikationen",
					connectivity: "Konnektivität",
					whatsInTheBox: "Lieferumfang",
					knowledgeFeatures: "Wissensfeatures"
				}
			};

			function getLocaleForCountry(countryCode) {
				return localeByCountry[countryCode] || "en";
			}

			function t(key, replacements) {
				const locale = getLocaleForCountry(state.countryCode);
				const value = (uiText[locale] && uiText[locale][key]) || (uiText.en && uiText.en[key]) || key;
				return Object.entries(replacements || {}).reduce((text, entry) => {
					return text.replace(new RegExp("\\{" + entry[0] + "\\}", "g"), entry[1]);
				}, value);
			}

			function getCountryLabel(countryCode) {
				const locale = getLocaleForCountry(state.countryCode);
				return (countryLabels[locale] && countryLabels[locale][countryCode]) || countryConfigs[countryCode].label;
			}

			function translateLabel(label) {
				const text = safeText(label, "");
				const translations = labelTranslationsByLocale[getLocaleForCountry(state.countryCode)] || {};
				return translations[text] || text;
			}

			function translateTechKey(key) {
				const text = safeText(key, "");
				const locale = getLocaleForCountry(state.countryCode);
				const translations = techDictionary[locale] || {};
				return translations[text] || translateLabel(text);
			}

			function translateSectionLabel(label) {
				const text = safeText(label, "");
				const translations = sectionTranslationsByLocale[getLocaleForCountry(state.countryCode)] || {};
				return translations[text] || translateLabel(text);
			}

			function normalizeLocalizedText(value, fallback) {
				if (isPlainObject(value)) {
					return {
						UK: safeText(value.UK || value.en || value.EN || value.English || value.default || fallback, ""),
						PL: safeText(value.PL || value.pl || value.Polish || "", ""),
						DE: safeText(value.DE || value.de || value.German || "", "")
					};
				}

				const text = safeText(value, fallback || "");
				return {
					UK: text,
					PL: "",
					DE: ""
				};
			}

			function getLocalizedText(value, fallback) {
				if (!isPlainObject(value)) {
					return safeText(value, fallback || "");
				}

				const country = normalizeSupportRegion(state.countryCode || "UK");
				return safeText(value[country] || value.UK || value.en || value.EN || value.default || fallback, "");
			}

			function getArticleTitle(article) {
				return getLocalizedText(article && article.title, "Knowledge Article");
			}

			function getArticleSummary(article) {
				return getLocalizedText(article && (article.description || article.summary), t("noSummary"));
			}

			function translateValue(value) {
				const text = safeText(value, "");
				const locale = getLocaleForCountry(state.countryCode);
				const translations = valueTranslationsByLocale[locale] || {};
				if (locale !== "pl" && locale !== "de") {
					return text;
				}

				const translated = translations[text];
				if (translated) {
					return translated;
				}

				if (locale === "de") {
					return text
						.replace(/(\d+)\s*Years?/gi, "$1 Jahre")
						.replace(/Native/g, "Nativ");
				}

				return text.replace(/(\d+)\s*Years?/gi, (match, years) => {
					if (years === "1") {
						return "1 rok";
					}
					if (["2", "3", "4"].includes(years)) {
						return years + " lata";
					}
					return years + " lat";
				}).replace(/Native/g, "Natywnie");
			}

			function translateHardcodedText(text, polishText, germanText) {
				if (state.countryCode === "PL") {
					return polishText;
				}
				if (state.countryCode === "DE") {
					return germanText || text;
				}
				return text;
			}

			function setText(selector, value) {
				const element = document.querySelector(selector);
				if (element) {
					element.textContent = value;
				}
			}

			function setTextById(id, value) {
				const element = document.getElementById(id);
				if (element) {
					element.textContent = value;
				}
			}

			function setAttributeById(id, attribute, value) {
				const element = document.getElementById(id);
				if (element) {
					element.setAttribute(attribute, value);
				}
			}

			function updateCountryOptionLabels() {
				if (!countrySelect) {
					return;
				}
				Array.from(countrySelect.options).forEach((option) => {
					option.textContent = getCountryLabel(option.value);
				});
			}

			function applyStaticTranslations() {
				document.documentElement.lang = getLocaleForCountry(state.countryCode);
				document.title = t("documentTitle");
				updateCountryOptionLabels();

				setText("#splashScreen > div > p", t("supportHub"));
				setText("#splashScreen h1", t("knowledgeBaseTitle"));
				setText("#splashScreen h1 + p", t("knowledgeBaseIntro"));
				setText("label[for='countrySelect']", t("agentRegion"));
				setTextById("continueBtn", t("continueDashboard"));
				setTextById("splashHint", t("splashDefaultHint"));

				setText("#appShell header .brand-font.text-lg", t("supportHub"));
				setText("#appShell header .brand-font.text-lg + p", t("consoleSubtitle"));
				setTextById("printModeBtn", state.printPreview ? t("exitPrintMode") : t("printMode"));
				setTextById("changeCountryBtn", t("changeCountry"));
				setAttributeById("changelogBtn", "aria-label", t("openChangelog"));
				setText("label[for='globalSearch']", t("globalSearch"));
				setAttributeById("globalSearch", "placeholder", t("globalSearchPlaceholder"));
				setTextById("moduleNotice", t(moduleDescriptions[state.activeModule] || moduleDescriptions.TV));

				setText("#leftSidebar h2", t("cascadingFilters"));
				setText("label[for='yearFilter']", t("year"));
				setText("label[for='osFilter']", state.activeModule === "MNT" ? "2) Brand" : t("os"));
				setText("label[for='panelFilter']", t("panel"));
				setTextById("resultsModeModelsBtn", t("models"));
				setTextById("resultsModeArticlesBtn", t("articles"));
				setTextById("resultsSectionTitle", state.resultsView === "articles" ? t("articleResults") : t("modelResults"));
				setTextById("emptyState", state.resultsView === "articles" ? t("noArticles") : t("noModels"));
				setTextById("backToResultsBtn", t("backToModelList"));
				setTextById("printNowBtn", t("printDetail"));
				setTextById("articleBackBtn", t("backToModelList"));
				setTextById("articlePrintBtn", t("printArticle"));

				const detailTabLabels = {
					specs: "specs",
					ports: "ports",
					troubleshooting: "troubleshooting",
					policies: "policies",
					gallery: "galleryImages"
				};
				detailTabButtons.forEach((button) => {
					const key = detailTabLabels[button.dataset.detailTab];
					if (key) {
						button.textContent = t(key);
					}
				});

				setText("#changelogPanel .brand-font", t("changelog"));
				setTextById("closeChangelogBtn", t("close"));
				setText("#quickInfoModal p.text-xs", t("quickFeatureInfo"));
				setTextById("quickInfoDismissBtn", t("close"));
				setTextById("quickInfoReadBtn", t("readFullArticle"));
				setText("#specDetailsModal p.text-xs", t("expandedTechnicalView"));
				setTextById("specDetailsDismissBtn", t("close"));
				setText("#imageZoomLoading p", t("loadingImage"));
				setTextById("scrollTopBtn", t("top"));

				if (countryBadge) {
					countryBadge.textContent = getCountryLabel(state.countryCode);
				}
			}

			function setContinueButtonState(mode) {
				if (!continueBtn) {
					return;
				}

				const isLoading = mode === "loading";
				const isError = mode === "error";
				continueBtn.disabled = isLoading;
				continueBtn.classList.toggle("opacity-70", isLoading);
				continueBtn.classList.toggle("cursor-not-allowed", isLoading);
				continueBtn.textContent = isLoading
					? t("loadingKnowledgeBase")
					: (isError ? t("loadError") : t("continueDashboard"));
			}

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

			function normalizeChangelogEntries(rawEntries) {
				return safeList(rawEntries)
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
			}

			const externalChangelogEntries = Array.isArray(window.ChangelogEntriesData)
				? window.ChangelogEntriesData
				: ((typeof ChangelogEntriesData !== "undefined" && Array.isArray(ChangelogEntriesData)) ? ChangelogEntriesData : []);

			let changelogEntries = normalizeChangelogEntries(
				externalChangelogEntries.length > 0 ? externalChangelogEntries : defaultChangelogEntries
			);

			const changelogVisibleLimit = 4;
			let changelogVisibleEntries = changelogEntries.slice(0, changelogVisibleLimit);

			const changelogSeenStorageKey = "support-hub-changelog-seen-v1";
			const seenChangelogIds = new Set();

			const savedCountry = localStorage.getItem(storageKeyCountry);
			if (savedCountry && countryConfigs[savedCountry]) {
				state.countryCode = savedCountry;
				countrySelect.value = savedCountry;
				applyStaticTranslations();
				splashHint.textContent = t("splashResumeHint");
			} else {
				applyStaticTranslations();
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

			function setChangelogEntries(nextEntries) {
				const normalized = normalizeChangelogEntries(nextEntries);
				changelogEntries = normalized.length > 0 ? normalized : normalizeChangelogEntries(defaultChangelogEntries);
				changelogVisibleEntries = changelogEntries.slice(0, changelogVisibleLimit);
				renderChangelogAccordion();
				updateChangelogUnreadDot();
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
						void hydrateModelDetail(state.selectedModelId);
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

			function renderKnowledgePill(label, extraClasses, isInteractive, tooltipText) {
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
					+ (safeText(tooltipText, "") ? " title=\"" + escapeHtml(safeText(tooltipText, "")) + "\"" : "")
					+ kbDataAttr
					+ ">"
					+ escapeHtml(text)
					+ "</span>";
			}

			function getAdminApiUrl(path) {
				const cleanPath = String(path || "");
				return (runtimeApiBaseUrl || "") + (cleanPath.charAt(0) === "/" ? cleanPath : "/" + cleanPath);
			}

			function getStoredAdminToken() {
				try {
					return sessionStorage.getItem(adminTokenStorageKey) || localStorage.getItem(adminTokenStorageKey) || "";
				} catch (error) {
					return "";
				}
			}

			function persistAdminToken(token) {
				state.adminToken = safeText(token, "");
				try {
					if (state.adminToken) {
						sessionStorage.setItem(adminTokenStorageKey, state.adminToken);
					} else {
						sessionStorage.removeItem(adminTokenStorageKey);
						localStorage.removeItem(adminTokenStorageKey);
					}
				} catch (error) {
					// Storage may be unavailable in private mode.
				}
			}

			function ensureAdminChrome() {
				if (!state.isAdminRoute || document.getElementById("adminLoginModal")) {
					return;
				}

				document.body.insertAdjacentHTML("beforeend", ""
					+ "<div id=\"adminLoginModal\" class=\"fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm\">"
					+ "<div class=\"w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-2xl\">"
					+ "<p class=\"brand-font text-xs uppercase tracking-[0.24em] text-brand-700\">Support Hub</p>"
					+ "<h2 class=\"mt-3 text-3xl font-bold text-slate-900\">Admin Login</h2>"
					+ "<p class=\"mt-2 text-sm text-slate-600\">Sign in to enable inline editing.</p>"
					+ "<form id=\"adminLoginForm\" class=\"mt-6 space-y-4\">"
					+ "<label class=\"block\"><span class=\"text-sm font-semibold text-slate-700\">Username</span><input id=\"adminUsernameInput\" type=\"text\" autocomplete=\"username\" required class=\"mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-cyan-100\"></label>"
					+ "<label class=\"block\"><span class=\"text-sm font-semibold text-slate-700\">Password</span><input id=\"adminPasswordInput\" type=\"password\" autocomplete=\"current-password\" required class=\"mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-cyan-100\"></label>"
					+ "<button id=\"adminLoginButton\" type=\"submit\" class=\"inline-flex w-full items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-brand-600\">Login</button>"
					+ "<p id=\"adminLoginError\" class=\"hidden rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700\"></p>"
					+ "</form>"
					+ "</div>"
					+ "</div>"
					+ "<div id=\"adminActionBar\" class=\"hidden fixed left-1/2 top-3 z-[9998] -translate-x-1/2 rounded-full border border-emerald-200 bg-white/95 px-4 py-2 shadow-xl backdrop-blur\">"
					+ "<div class=\"flex items-center gap-3\"><span id=\"adminDirtyLabel\" class=\"text-xs font-semibold text-slate-600\">Admin mode</span><button id=\"adminSaveChangesBtn\" type=\"button\" class=\"rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500\">Save Changes</button></div>"
					+ "</div>");

				const form = document.getElementById("adminLoginForm");
				if (form) {
					form.addEventListener("submit", (event) => {
						event.preventDefault();
						void loginAdminUser();
					});
				}

				document.getElementById("adminSaveChangesBtn")?.addEventListener("click", () => {
					void saveAdminChanges();
				});
			}

			function setAdminLocked(locked) {
				const modal = document.getElementById("adminLoginModal");
				const bar = document.getElementById("adminActionBar");
				if (modal) {
					modal.classList.toggle("hidden", !locked);
				}
				if (bar) {
					bar.classList.toggle("hidden", locked || !state.isAdmin);
				}
			}

			async function loginAdminUser() {
				const usernameInput = document.getElementById("adminUsernameInput");
				const passwordInput = document.getElementById("adminPasswordInput");
				const button = document.getElementById("adminLoginButton");
				const errorBox = document.getElementById("adminLoginError");
				const username = safeText(usernameInput && usernameInput.value, "");
				const password = safeText(passwordInput && passwordInput.value, "");

				if (button) {
					button.disabled = true;
					button.textContent = "Logging in...";
				}
				if (errorBox) {
					errorBox.classList.add("hidden");
					errorBox.textContent = "";
				}

				try {
					const response = await fetch(getAdminApiUrl("/api/auth/login"), {
						method: "POST",
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ username, password })
					});
					const payload = await response.json().catch(() => ({}));
					if (!response.ok || !payload || !payload.token) {
						throw new Error(payload && payload.error ? payload.error : "Invalid admin credentials");
					}
					persistAdminToken(payload.token);
					state.isAdmin = true;
					setAdminLocked(false);
					setAdminDirty(false);
					if (state.data) {
						applyCountryConfig(countrySelect.value || state.countryCode || "UK");
						showDashboard({ instant: true });
						replaceBrowseHistoryState();
					}
				} catch (error) {
					if (errorBox) {
						errorBox.textContent = error && error.message ? error.message : "Login failed";
						errorBox.classList.remove("hidden");
					}
				} finally {
					if (button) {
						button.disabled = false;
						button.textContent = "Login";
					}
				}
			}

			function setAdminDirty(dirty) {
				state.adminDirty = Boolean(dirty);
				const label = document.getElementById("adminDirtyLabel");
				if (label) {
					label.textContent = state.adminDirty ? "Unsaved changes" : "Admin mode";
					label.classList.toggle("text-amber-700", state.adminDirty);
					label.classList.toggle("text-slate-600", !state.adminDirty);
				}
			}

			function parseAdminPath(pathValue) {
				try {
					const decoded = decodeURIComponent(safeText(pathValue, "[]"));
					const parsed = JSON.parse(decoded);
					return Array.isArray(parsed) ? parsed : [];
				} catch (error) {
					return [];
				}
			}

			function encodeAdminPath(path) {
				return encodeURIComponent(JSON.stringify(Array.isArray(path) ? path : []));
			}

			function getMutableAdminTarget(path) {
				const firstKey = path && path[0];
				if (firstKey === "__media") {
					const model = state.currentModel || getModelById(state.selectedModelId);
					const modelName = getModelName(model);
					if (!state.data.ModelMediaData) {
						state.data.ModelMediaData = {};
					}
					if (!isPlainObject(state.data.ModelMediaData[modelName])) {
						state.data.ModelMediaData[modelName] = {};
					}
					return state.data.ModelMediaData[modelName];
				}
				return state.currentModel || getModelById(state.selectedModelId);
			}

			function setNestedAdminValue(path, value) {
				if (!Array.isArray(path) || path.length === 0) {
					return false;
				}
				const target = getMutableAdminTarget(path);
				const usablePath = path[0] === "__media" ? path.slice(1) : path;
				if (!target || usablePath.length === 0) {
					return false;
				}

				function resolveExistingObjectKey(object, desiredKey) {
					if (!isPlainObject(object)) {
						return desiredKey;
					}
					const normalizedDesired = normalizeLookupKey(desiredKey);
					const exactKey = Object.keys(object).find((candidate) => candidate === desiredKey);
					if (exactKey) {
						return exactKey;
					}
					const looseKey = Object.keys(object).find((candidate) => normalizeLookupKey(candidate) === normalizedDesired);
					return looseKey || desiredKey;
				}

				function mirrorCoreAdminValue(model, pathParts, nextValue) {
					if (!model || path[0] === "__media") {
						return;
					}
					const finalPathKey = safeText(pathParts[pathParts.length - 1], "");
					const normalizedFinalKey = normalizeLookupKey(finalPathKey);
					if (!isPlainObject(model.specs)) {
						model.specs = {};
					}

					if (normalizedFinalKey === normalizeLookupKey("platform")) {
						model.platform = nextValue;
						model.specs.platform = nextValue;
						if (!isPlainObject(model.platformChassis)) {
							model.platformChassis = {};
						}
						model.platformChassis.platform = nextValue;
						if (model.__bundle && isPlainObject(model.__bundle.platformChassis)) {
							model.__bundle.platformChassis.platform = nextValue;
						}
						const lookupKey = safeText(getModelName(model), "").trim().split("/")[0];
						if (lookupKey && state.modelPlatformChassisLookup instanceof Map) {
							const current = state.modelPlatformChassisLookup.get(lookupKey) || {};
							state.modelPlatformChassisLookup.set(lookupKey, { ...current, platform: nextValue });
						}
					}

					if (normalizedFinalKey === normalizeLookupKey("chassis")) {
						model.chassis = nextValue;
						model.specs.chassis = nextValue;
						if (!isPlainObject(model.platformChassis)) {
							model.platformChassis = {};
						}
						model.platformChassis.chassis = nextValue;
						if (model.__bundle && isPlainObject(model.__bundle.platformChassis)) {
							model.__bundle.platformChassis.chassis = nextValue;
						}
						const lookupKey = safeText(getModelName(model), "").trim().split("/")[0];
						if (lookupKey && state.modelPlatformChassisLookup instanceof Map) {
							const current = state.modelPlatformChassisLookup.get(lookupKey) || {};
							state.modelPlatformChassisLookup.set(lookupKey, { ...current, chassis: nextValue });
						}
					}

					if (normalizedFinalKey === normalizeLookupKey("osProfileId") || normalizedFinalKey === normalizeLookupKey("os")) {
						model.osProfileId = nextValue;
						model.os = nextValue;
					}

					if (normalizedFinalKey === normalizeLookupKey("panelType") || normalizedFinalKey === normalizeLookupKey("Panel")) {
						model.panelType = nextValue;
						model.specs.panelType = nextValue;
					}
				}

				let cursor = target;
				usablePath.slice(0, -1).forEach((key) => {
					const existingKey = resolveExistingObjectKey(cursor, key);
					if (!isPlainObject(cursor[existingKey])) {
						cursor[existingKey] = {};
					}
					cursor = cursor[existingKey];
				});
				const finalKey = resolveExistingObjectKey(cursor, usablePath[usablePath.length - 1]);
				cursor[finalKey] = value;
				mirrorCoreAdminValue(target, usablePath, value);
				setAdminDirty(true);
				return true;
			}

			function adminEditButton(path, label) {
				if (!state.isAdmin || !Array.isArray(path) || path.length === 0) {
					return "";
				}
				return "<button type=\"button\" class=\"js-admin-edit ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-[11px] font-bold text-brand-700 transition hover:bg-cyan-100\" data-admin-path=\"" + encodeAdminPath(path) + "\" title=\"Edit " + escapeHtml(safeText(label, "value")) + "\">✎</button>";
			}

			function adminAddButton(path, label) {
				if (!state.isAdmin || !Array.isArray(path) || path.length === 0) {
					return "";
				}
				return "<button type=\"button\" class=\"js-admin-add ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100\" data-admin-path=\"" + encodeAdminPath(path) + "\">+ " + escapeHtml(safeText(label, "Add Item")) + "</button>";
			}

			function normalizeSupportRegion(value) {
				const text = safeText(value, "").toUpperCase();
				return ["GLOBAL", "PL", "UK", "DE"].includes(text) ? (text === "GLOBAL" ? "Global" : text) : "Global";
			}

			function inferSupportRegionFromLabel(label) {
				const text = safeText(label, "").toLowerCase();
				if (/\bpolish\b|\(pl\)|\[pl\]/i.test(text)) {
					return "PL";
				}
				if (/\bgerman\b|\(de\)|\[de\]/i.test(text)) {
					return "DE";
				}
				if (/\benglish\b|\buk\b|\(en\)|\(uk\)|\[en\]|\[uk\]/i.test(text)) {
					return "UK";
				}
				return "Global";
			}

			function getSupportCategory(label, category) {
				const explicit = safeText(category, "");
				if (/manual|guide|document|instrukcja|benutzerhandbuch/i.test(explicit)) {
					return "manuals";
				}
				if (/driver|firmware|software|i-?menu|g-?menu|setup/i.test(explicit)) {
					return "drivers";
				}
				if (/driver|firmware|software|i-?menu|g-?menu|setup/i.test(label)) {
					return "drivers";
				}
				if (/manual|document|guide|instrukcja|benutzerhandbuch/i.test(label)) {
					return "manuals";
				}
				return "others";
			}

			function cleanSupportLabel(label) {
				return safeText(label, "")
					.replace(/\d{1,2}\s+[a-zA-Z]+\s+\d{4}/g, "")
					.replace(/^\[(PL|UK|DE|Global)\]\s*/i, "")
					.replace(/\s+/g, " ")
					.trim();
			}

			function getRegionFallback(countryCode) {
				const map = {
					PL: "UK",
					UK: "PL",
					DE: "PL"
				};
				return map[countryCode] || "UK";
			}

			function normalizeSupportLinkEntry(entry, fallback) {
				if (isPlainObject(entry)) {
					const label = cleanSupportLabel(entry.title || entry.label || entry.name || fallback && fallback.label);
					const url = getSafeHttpUrl(entry.url || entry.href || entry.link || fallback && fallback.url);
					if (!label || !url) {
						return null;
					}
					const region = normalizeSupportRegion(entry.region || fallback && fallback.region || inferSupportRegionFromLabel(label));
					return {
						title: label,
						label,
						url,
						region,
						category: getSupportCategory(label, entry.category || fallback && fallback.category)
					};
				}

				const label = cleanSupportLabel(fallback && fallback.label);
				const url = getSafeHttpUrl(entry || fallback && fallback.url);
				if (!label || !url) {
					return null;
				}
				const region = normalizeSupportRegion(fallback && fallback.region || inferSupportRegionFromLabel(label));
				return {
					title: label,
					label,
					url,
					region,
					category: getSupportCategory(label, fallback && fallback.category)
				};
			}

			function getModelSupportLinks(model, extras) {
				const links = [];
				safeList(model && model.supportLinks).forEach((entry) => {
					const normalized = normalizeSupportLinkEntry(entry, {});
					if (normalized) {
						links.push(normalized);
					}
				});

				const supportObject = isPlainObject(extras && extras.support) ? extras.support : {};
				Object.entries(supportObject).forEach(([label, value]) => {
					if (/^user manual/i.test(label) && label.length > 120) {
						return;
					}
					const normalized = normalizeSupportLinkEntry(value, {
						label,
						region: inferSupportRegionFromLabel(label)
					});
					if (normalized) {
						links.push(normalized);
					}
				});

				safeList(extras && extras.manualLinks).forEach((entry) => {
					const normalized = normalizeSupportLinkEntry(entry, {
						category: "Manual",
						region: entry && entry.region ? entry.region : "Global"
					});
					if (normalized) {
						links.push(normalized);
					}
				});

				const seen = new Set();
				return links.filter((entry) => {
					const key = [entry.category, entry.region, entry.title, entry.url].map((item) => safeText(item, "").toLowerCase()).join("|");
					if (seen.has(key)) {
						return false;
					}
					seen.add(key);
					return true;
				});
			}

			function filterSupportLinksForRegion(links) {
				if (state.isAdmin) {
					return safeList(links);
				}

				const currentRegion = normalizeSupportRegion(state.countryCode || "UK");
				const fallbackRegion = getRegionFallback(currentRegion);
				const byCategory = safeList(links).reduce((groups, entry) => {
					const category = entry.category || "others";
					if (!groups[category]) {
						groups[category] = [];
					}
					groups[category].push(entry);
					return groups;
				}, {});

				return Object.values(byCategory).flatMap((entries) => {
					const globals = entries.filter((entry) => normalizeSupportRegion(entry.region) === "Global");
					const native = entries.filter((entry) => normalizeSupportRegion(entry.region) === currentRegion);
					const fallback = native.length > 0
						? []
						: entries.filter((entry) => normalizeSupportRegion(entry.region) === fallbackRegion);
					return [...globals, ...native, ...fallback];
				});
			}

			function showAdminSupportLinkDialog(onSubmit) {
				const existing = document.getElementById("adminSupportLinkDialog");
				if (existing) {
					existing.remove();
				}

				document.body.insertAdjacentHTML("beforeend", ""
					+ "<div id=\"adminSupportLinkDialog\" class=\"fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm\">"
					+ "<form id=\"adminSupportLinkForm\" class=\"w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl\">"
					+ "<h3 class=\"text-lg font-bold text-slate-900\">Add Support Link</h3>"
					+ "<label class=\"mt-4 block\"><span class=\"text-sm font-semibold text-slate-700\">Title</span><input id=\"adminSupportTitle\" class=\"mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm\" required></label>"
					+ "<label class=\"mt-3 block\"><span class=\"text-sm font-semibold text-slate-700\">URL</span><input id=\"adminSupportUrl\" type=\"url\" class=\"mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm\" required value=\"https://\"></label>"
					+ "<label class=\"mt-3 block\"><span class=\"text-sm font-semibold text-slate-700\">Category</span><select id=\"adminSupportCategory\" class=\"mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm\"><option value=\"Manual\">Manual</option><option value=\"Driver\">Driver</option><option value=\"Declaration\">Declaration</option><option value=\"Software\">Software</option><option value=\"Other\">Other</option></select></label>"
					+ "<label class=\"mt-3 block\"><span class=\"text-sm font-semibold text-slate-700\">Language / Region</span><select id=\"adminSupportRegion\" class=\"mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm\"><option value=\"Global\">Global</option><option value=\"PL\">PL</option><option value=\"UK\">UK</option><option value=\"DE\">DE</option></select></label>"
					+ "<div class=\"mt-5 flex justify-end gap-2\"><button type=\"button\" id=\"adminSupportCancel\" class=\"rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600\">Cancel</button><button type=\"submit\" class=\"rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white\">Add Link</button></div>"
					+ "</form>"
					+ "</div>");

				const dialog = document.getElementById("adminSupportLinkDialog");
				const form = document.getElementById("adminSupportLinkForm");
				const cancel = document.getElementById("adminSupportCancel");
				const close = () => dialog && dialog.remove();
				cancel?.addEventListener("click", close);
				dialog?.addEventListener("click", (event) => {
					if (event.target === dialog) {
						close();
					}
				});
				form?.addEventListener("submit", (event) => {
					event.preventDefault();
					const link = {
						title: safeText(document.getElementById("adminSupportTitle")?.value, ""),
						url: safeText(document.getElementById("adminSupportUrl")?.value, ""),
						category: safeText(document.getElementById("adminSupportCategory")?.value, "Manual"),
						region: normalizeSupportRegion(document.getElementById("adminSupportRegion")?.value)
					};
					if (link.title && getSafeHttpUrl(link.url) && typeof onSubmit === "function") {
						onSubmit(link);
						close();
					}
				});
				document.getElementById("adminSupportTitle")?.focus();
			}

			function adminEditableValue(path, value, label) {
				const displayValue = translateValue(safeText(value, "-"));
				return "<span class=\"js-admin-value\" data-admin-value=\"" + escapeHtml(safeText(value, "-")) + "\">" + escapeHtml(displayValue) + "</span>" + adminEditButton(path, label);
			}

			function getAdminEditableOptions(label, path) {
				const pathLabel = Array.isArray(path) && path.length > 0 ? safeText(path[path.length - 1], "") : "";
				const normalizedLabel = normalizeLookupKey(label || pathLabel);
				const booleanFields = ["HDR", "Touch", "Curved", "Built-in Speakers", "Pivot"];
				if (booleanFields.some((field) => normalizeLookupKey(field) === normalizedLabel)) {
					return ["Yes", "No", "-"];
				}
				if (normalizeLookupKey("OS") === normalizedLabel || normalizeLookupKey("osProfileId") === normalizedLabel) {
					return ["Google TV", "Titan OS", "Android TV"];
				}
				if (["Panel Type", "Panel", "panelType"].some((field) => normalizeLookupKey(field) === normalizedLabel)) {
					const model = state.currentModel || getModelById(state.selectedModelId);
					return isMntModel(model)
						? ["-", "IPS", "VA", "TN", "OLED", "Mini-LED"]
						: ["-", "DLED", "DLED QD", "LED", "MiniLED", "OLED", "QD MiniLED", "QLED", "RGB MiniLED"];
				}
				if (normalizeLookupKey("Brand") === normalizedLabel || normalizeLookupKey("brand") === normalizedLabel) {
					return ["Philips", "AOC"];
				}
				return null;
			}

			function startAdminInlineEdit(trigger, onCommit) {
				if (!(trigger instanceof Element) || trigger.dataset.editing === "true") {
					return;
				}
				const path = parseAdminPath(trigger.getAttribute("data-admin-path"));
				const titleLabel = safeText(trigger.getAttribute("title"), "").replace(/^Edit\s+/i, "");
				const label = safeText(trigger.getAttribute("data-admin-label"), titleLabel || path[path.length - 1] || "value");
				const valueElement = trigger.parentElement && trigger.parentElement.querySelector(".js-admin-value");
				const currentValue = safeText(valueElement && valueElement.getAttribute("data-admin-value"), safeText(valueElement && valueElement.textContent, ""));
				const options = getAdminEditableOptions(label, path);
				const editor = document.createElement("span");
				editor.className = "js-admin-inline-editor ml-2 inline-flex items-center gap-1 align-middle";

				const input = options ? document.createElement("select") : document.createElement("input");
				input.className = "rounded-md border border-cyan-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-cyan-200";
				if (options) {
					options.forEach((optionValue) => {
						const option = document.createElement("option");
						option.value = optionValue;
						option.textContent = optionValue;
						input.appendChild(option);
					});
				} else {
					input.type = "text";
				}
				input.value = options && !options.includes(currentValue) ? options[0] : currentValue;

				const saveButton = document.createElement("button");
				saveButton.type = "button";
				saveButton.className = "rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-500";
				saveButton.textContent = "Save";

				const cancelButton = document.createElement("button");
				cancelButton.type = "button";
				cancelButton.className = "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50";
				cancelButton.textContent = "Cancel";

				function cleanup() {
					trigger.dataset.editing = "false";
					trigger.classList.remove("hidden");
					editor.remove();
				}

				function commit() {
					const control = editor.querySelector("input, select");
					const nextValue = control && "value" in control ? safeText(control.value, "") : safeText(input.value, "");
					if (setNestedAdminValue(path, nextValue)) {
						updateAdminModelInCollections(state.currentModel);
						if (typeof onCommit === "function") {
							onCommit();
						} else {
							refreshCurrentAdminDetail();
						}
					}
					cleanup();
				}

				saveButton.addEventListener("click", commit);
				cancelButton.addEventListener("click", cleanup);
				input.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						commit();
					}
					if (event.key === "Escape") {
						event.preventDefault();
						cleanup();
					}
				});

				editor.appendChild(input);
				editor.appendChild(saveButton);
				editor.appendChild(cancelButton);
				trigger.dataset.editing = "true";
				trigger.classList.add("hidden");
				trigger.insertAdjacentElement("afterend", editor);
				input.focus();
				if (input instanceof HTMLInputElement) {
					input.select();
				}
			}

			function refreshCurrentAdminDetail() {
				const model = state.currentModel || getModelById(state.selectedModelId);
				if (model && state.viewMode === "detail") {
					renderModelDetail(model);
				}
			}

			function updateAdminModelInCollections(model) {
				if (!model || !state.data || !Array.isArray(state.data.ModelsData)) {
					return;
				}
				const key = getModelKey(model);
				const index = state.data.ModelsData.findIndex((item) => getModelKey(item) === key || getModelName(item) === getModelName(model));
				if (index >= 0) {
					state.data.ModelsData[index] = model;
				}
				if (state.modelDetailsById && state.selectedModelId) {
					state.modelDetailsById[state.selectedModelId] = model;
				}
			}

			async function saveAdminChanges() {
				const model = state.currentModel || getModelById(state.selectedModelId);
				if (!state.isAdmin || !model) {
					return;
				}
				const token = state.adminToken || getStoredAdminToken();
				const modelId = getModelName(model);
				const media = getModelMedia(model);
				const button = document.getElementById("adminSaveChangesBtn");
				if (button) {
					button.disabled = true;
					button.textContent = "Saving...";
				}
				try {
					const response = await fetch(getAdminApiUrl("/api/admin/models/" + encodeURIComponent(modelId)), {
						method: "PUT",
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
							"Authorization": "Bearer " + token
						},
						body: JSON.stringify({
							...model,
							model,
							media,
							module: getModelModule(model)
						})
					});
					const payload = await response.json().catch(() => ({}));
					if (!response.ok) {
						throw new Error(payload && payload.message ? payload.message : "Save failed");
					}
					updateAdminModelInCollections(model);
					await clearSupportHubJsonCache();
					if (api && api.cache && typeof api.cache.clear === "function") {
						api.cache.clear();
					}
					if (api && Object.prototype.hasOwnProperty.call(api, "_bootstrapPromise")) {
						api._bootstrapPromise = null;
					}
					setAdminDirty(false);
				} catch (error) {
					window.alert("Save failed: " + (error && error.message ? error.message : "Unknown error"));
				} finally {
					if (button) {
						button.disabled = false;
						button.textContent = "Save Changes";
					}
				}
			}

			function normalizeLookupKey(value) {
				return normalizeText(value).replace(/[^a-z0-9]+/g, "");
			}

			function getLooseObjectValue(object, key) {
				if (!isPlainObject(object)) {
					return undefined;
				}

				const desiredKey = normalizeLookupKey(key);
				if (!desiredKey) {
					return undefined;
				}

				const exactKey = Object.keys(object).find((candidate) => candidate === key);
				if (exactKey) {
					return object[exactKey];
				}

				const looseKey = Object.keys(object).find((candidate) => normalizeLookupKey(candidate) === desiredKey);
				return looseKey ? object[looseKey] : undefined;
			}

			function getLooseNestedValue(root, pathParts) {
				let current = root;
				for (const part of safeList(pathParts)) {
					if (!isPlainObject(current)) {
						return undefined;
					}

					current = getLooseObjectValue(current, part);
					if (typeof current === "undefined") {
						return undefined;
					}
				}

				return current;
			}

			function getFirstResolvedSpecValue(model, pathCandidates) {
				const specs = getModelSpecs(model);
				for (const candidatePath of safeList(pathCandidates)) {
					const normalizedPath = Array.isArray(candidatePath)
						? candidatePath
						: String(candidatePath || "").split(".").filter(Boolean);

					if (normalizedPath.length === 0) {
						continue;
					}

					const rootKey = normalizeLookupKey(normalizedPath[0]);
					const root = rootKey === "specs" ? model : specs;
					const pathToResolve = rootKey === "specs" ? normalizedPath.slice(1) : normalizedPath;
					const resolved = getLooseNestedValue(root, pathToResolve);
					const text = stringifyTechnicalValue(resolved);
					if (text) {
						return text;
					}
				}

				return "";
			}

			function getModelKnowledgeArticles(model) {
				if (!model) {
					return [];
				}

				if (Array.isArray(model.knowledgeArticles)) {
					return model.knowledgeArticles;
				}

				if (isPlainObject(model.__bundle) && Array.isArray(model.__bundle.knowledgeArticles)) {
					return model.__bundle.knowledgeArticles;
				}

				return [];
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
				const bundleArticles = getModelKnowledgeArticles(contextModel);
				let bestMatch = null;
				let bestScore = -1;

				safeList(bundleArticles).forEach((article) => {
					const profile = getArticleFilterProfile(article);
					if (contextModel && !isModelMatchingArticleScope(contextModel, profile)) {
						return;
					}

					const titleExact = normalizeText(getArticleTitle(article)) === normalizedTerm;
					const tagExact = safeList(article && article.tags).some((tag) => normalizeText(tag) === normalizedTerm);
					if (!titleExact && !tagExact) {
						return;
					}

					let score = titleExact ? 340 : 260;
					if (contextModel && (safeList(profile.os).length > 0 || safeList(profile.panel).length > 0 || safeList(profile.years).length > 0)) {
						score += 20;
					}

					if (score > bestScore) {
						bestScore = score;
						bestMatch = article;
					}
				});

				safeList(state.data.KnowledgeBaseData).forEach((article) => {
					const profile = getArticleFilterProfile(article);
					if (contextModel && !isModelMatchingArticleScope(contextModel, profile)) {
						return;
					}

					const titleExact = normalizeText(getArticleTitle(article)) === normalizedTerm;
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
					articleBackBtn.textContent = t("backToModelList");
					persistSessionState();
					return;
				}

				const model = getModelById(state.articleBackModelId);
				articleBackBtn.textContent = model
					? t("backToModel", { model: getModelName(model) })
					: t("backToModelList");
				persistSessionState();
			}

			function getArticleContentPoints(article) {
				const directPoints = safeList(article && article.contentPoints)
					.map((point) => getLocalizedText(point, ""))
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
							const sentence = getLocalizedText(paragraph, "");
							if (!sentence) {
								return "";
							}
							const cutIndex = sentence.indexOf(".");
							return cutIndex > 0 ? sentence.slice(0, cutIndex + 1) : sentence;
						});
					})
					.map((point) => getLocalizedText(point, ""))
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
				const title = getArticleTitle(article);
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

				const titleText = normalizeText(getArticleTitle(article));
				addCandidate(titleText, 5);
				titleText.split(/\s+/).forEach((token) => {
					if (token.length >= 4 && !stopWords.has(token)) {
						addCandidate(token, 4);
					}
				});

				const summaryTokens = normalizeText(getArticleSummary(article))
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
				const rawTerms = [...safeList(profile && profile.topics), getArticleTitle(article), ...safeList(article && article.tags)]
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
				quickInfoTitle.textContent = getArticleTitle(article);
				quickInfoSummary.textContent = getArticleSummary(article);
				quickInfoPoints.innerHTML = "";

				const points = getArticleContentPoints(article);
				if (points.length === 0) {
					const item = document.createElement("li");
					item.textContent = t("noDetailedPoints");
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
				const imageMedia = isPlainObject(media.media) ? media.media : media;

				const zoomCandidates = [
					getRenderableImageVariants(imageMedia.frontImageUrl, { displayWidth: 1600, zoomWidth: 3200 }).zoomSrc,
					getRenderableImageVariants(imageMedia.remoteImageUrl, { displayWidth: 1600, zoomWidth: 3200 }).zoomSrc,
					getRenderableImageVariants(imageMedia.portsImageUrl, { displayWidth: 1800, zoomWidth: 3200 }).zoomSrc
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
					core: {
						title: "Core Hardware - Full View",
						summary: "Extended display and panel fields from the technical source.",
						categoryPatterns: [/^General$/i, /^Display\/Panel$/i],
						keyPatterns: [/General/i, /Display\/Panel/i, /Panel/i, /Resolution/i, /Refresh/i, /Warranty/i, /Aspect/i, /Backlight/i, /Brightness/i, /Contrast/i, /Touch/i]
					},
					audio: {
						title: "Audio Specifications - Full View",
						summary: "Extended audio fields from Philips technical sheet.",
						categoryPatterns: [/^Sound$/i, /^Dźwięk$/i],
						keyPatterns: [/Audio/i, /Dźwięk/i, /Głośnik/i, /Subwoofer/i, /Dolby/i, /DTS/i, /Moc wyjściowa/i, /Output power/i]
					},
					physical: {
						title: "Physical Details - Full View",
						summary: "Extended physical and cabinet fields from the technical source.",
						categoryPatterns: [/^Physical$/i],
						keyPatterns: [/Physical/i, /VESA/i, /Tilt/i, /Height/i, /Pivot/i, /Swivel/i, /Webcam/i, /Bezel/i, /Cabinet/i, /Powersensor/i]
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

				const selectedConfig = modalConfig[detailType] || modalConfig.audio;
				const polishConfig = state.countryCode === "PL" ? plSpecModalTranslations[detailType] : null;

				return polishConfig
					? { ...selectedConfig, title: polishConfig.title, summary: polishConfig.summary }
					: selectedConfig;
			}

			function collectUniqueTechnicalRows(model, modalConfig) {
				const rowsByCategory = collectTechnicalRowsByCategory(model, modalConfig.categoryPatterns);
				const rowsByKeys = collectTechnicalRowsByFlatKeys(model, modalConfig.keyPatterns);
				const uniqueRows = [];
				const seenKeys = new Set();

				rowsByCategory.concat(rowsByKeys).forEach((row) => {
					const uniqueKey = [
						safeText(row && row.category, "").toLowerCase(),
						safeText(row && row.label, "").toLowerCase(),
						safeText(row && row.value, "")
					].join("||");
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

				const model = getLiveAdminModelById(context.modelId);
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
				if (isMntModel(scopedModel || model)) {
					const hiddenMntRowPatterns = [
						/bezel\s*type(?:\s*\(front\))?/i,
						/what'?s\s+in\s+the\s+box/i,
						/hdmi\s+cable/i
					];

					uniqueRows = uniqueRows.filter((row) => {
						const rowText = [
							safeText(row && row.category, ""),
							safeText(row && row.label, "")
						].join(" ");
						return !hiddenMntRowPatterns.some((pattern) => pattern.test(rowText));
					});
				}
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
				let emptyMessage = t("noExtendedFields");
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

			function getModelModule(model) {
				const explicitModule = safeText(model && (model.module || model.productType), "").toUpperCase();
				return explicitModule || "TV";
			}

			function isMntModel(model) {
				return getModelModule(model) === "MNT";
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

				safeList(records).forEach((record) => {
					const modelName = safeText(record && record.modelName, "").trim();
					const platform = safeText(record && record.platform, "");
					const chassis = safeText(record && record.chassis, "");

					if (!modelName || (!platform && !chassis)) {
						return;
					}

					const lookupKey = modelName.split("/")[0];
					if (!lookupKey || lookup.has(lookupKey)) {
						return;
					}

					lookup.set(lookupKey, { platform, chassis });
				});

				return lookup;
			}

			function getModelLookupMeta(model) {
				if (!model || !(state.modelPlatformChassisLookup instanceof Map)) {
					return null;
				}

				const lookupKey = safeText(getModelName(model), "").trim().split("/")[0];
				return lookupKey ? state.modelPlatformChassisLookup.get(lookupKey) || null : null;
			}

			function getSafeHttpUrl(value) {
				const url = safeText(value, "").replace(/\s+/g, "");
				return /^https?:\/\//i.test(url) ? url : "";
			}

			function getImageProxyBaseUrl() {
				return runtimeApiBaseUrl || "";
			}

			function buildImageProxyUrl(sourceUrl, width) {
				const baseUrl = getImageProxyBaseUrl();
				const endpoint = "/api/image-proxy";
				const proxyBase = baseUrl ? baseUrl + endpoint : endpoint;
				const normalizedWidth = Math.max(320, Number(width) || 1200);
				return proxyBase + "?url=" + encodeURIComponent(String(sourceUrl || "")) + "&wid=" + normalizedWidth;
			}

			function getRenderableImageUrl(value, width) {
				const url = getSafeHttpUrl(value);
				if (!url) {
					return "";
				}

				if (!/images\.philips\.com\/is\/image\//i.test(url)) {
					return url;
				}

				return buildImageProxyUrl(url, width);
			}

			function getRenderableImageVariants(value, options) {
				const url = getSafeHttpUrl(value);
				if (!url) {
					return {
						src: "",
						zoomSrc: "",
						srcSet: "",
						sizes: ""
					};
				}

				if (!/images\.philips\.com\/is\/image\//i.test(url)) {
					return {
						src: url,
						zoomSrc: url,
						srcSet: "",
						sizes: ""
					};
				}

				const widthList = Array.isArray(options && options.widths) && options.widths.length > 0
					? options.widths
					: [640, 960, 1200, 1600, 2400, 3200];
				const uniqueWidths = [...new Set(widthList.map((item) => Math.max(320, Number(item) || 0)).filter(Boolean))].sort((a, b) => a - b);
				const displayWidth = Math.max(320, Number(options && options.displayWidth) || 1200);
				const zoomWidth = Math.max(displayWidth, Number(options && options.zoomWidth) || 2400);

				return {
					src: buildImageProxyUrl(url, displayWidth),
					zoomSrc: buildImageProxyUrl(url, zoomWidth),
					srcSet: uniqueWidths.map((item) => buildImageProxyUrl(url, item) + " " + item + "w").join(", "),
					sizes: safeText(options && options.sizes, "")
				};
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

			function getMntBrand(model) {
				const specs = getModelSpecs(model);
				return safeText(model && model.brand, "") || safeText(specs.brand, "");
			}

			function getFilterOsOrBrand(model) {
				return isMntModel(model) ? getMntBrand(model) : getModelOS(model);
			}

			function getMntRefreshRate(model) {
				const specs = getModelSpecs(model);
				return safeText(model && model.vrrMaxRefreshRate, "")
					|| safeText(model && model.maxRefreshRate, "")
					|| safeText(specs.vrrMaxRefreshRate, "")
					|| safeText(specs.maxRefreshRate, "");
			}

			function getMntWarranty(model) {
				const specs = getModelSpecs(model);
				return safeText(model && model.warranty, "") || safeText(specs.warranty, "");
			}

			function getModelPanel(model) {
				return safeText(model && model.panelType, "-");
			}

			function getModelSpecs(model) {
				return model && typeof model.specs === "object" && model.specs !== null ? model.specs : {};
			}

			function formatWifiStandard(value) {
				const text = safeText(value, "");
				if (!text) {
					return "";
				}

				return text.split(",")[0].trim();
			}

			function formatBluetoothVersion(value) {
				const text = safeText(value, "");
				if (!text) {
					return "";
				}

				const match = text.match(/Bluetooth\s*(?:v(?:ersion)?\s*)?(\d+(?:\.\d+)?)/i);
				if (match) {
					return "Bluetooth " + match[1];
				}

				return text;
			}

			function formatAudioPower(value) {
				const text = safeText(value, "");
				if (!text) {
					return "";
				}

				const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:W|Watts?|Watt)/i);
				if (match) {
					return match[1].replace(",", ".") + " W";
				}

				const digits = text.match(/\d+(?:[.,]\d+)?/);
				return digits ? digits[0].replace(",", ".") + " W" : text;
			}

			function findTechnicalCategory(model, categoryPatterns) {
				const technicalByCategory = getModelTechnicalByCategory(model);
				const patterns = safeList(categoryPatterns);

				for (const [categoryName, entries] of Object.entries(technicalByCategory)) {
					if (!isPlainObject(entries)) {
						continue;
					}

					if (patterns.some((pattern) => pattern.test(categoryName))) {
						return entries;
					}
				}

				return null;
			}

			function getTechnicalCategoryValue(model, categoryPatterns, keyPatterns) {
				const category = findTechnicalCategory(model, categoryPatterns);
				if (!category) {
					return "";
				}

				const patterns = safeList(keyPatterns);
				for (const [key, value] of Object.entries(category)) {
					if (!patterns.some((pattern) => pattern.test(key))) {
						continue;
					}

					const text = stringifyTechnicalValue(value);
					if (text) {
						return text;
					}
				}

				return "";
			}

			function getModelChassis(model) {
				const rootValue = safeText(model && model.chassis, "");
				if (rootValue) {
					return rootValue;
				}

				const directValue = safeText(getModelSpecs(model).chassis, "");
				if (directValue) {
					return directValue;
				}

				const platformChassisValue = safeText(model && model.platformChassis && model.platformChassis.chassis, "");
				if (platformChassisValue) {
					return platformChassisValue;
				}

				const bundleValue = safeText(model && model.__bundle && model.__bundle.platformChassis && model.__bundle.platformChassis.chassis, "");
				if (bundleValue) {
					return bundleValue;
				}

				const lookupValue = getModelLookupMeta(model);
				return safeText(lookupValue && lookupValue.chassis, "");
			}

			function getModelPlatform(model) {
				const rootValue = safeText(model && model.platform, "");
				if (rootValue) {
					return rootValue;
				}

				const directValue = safeText(getModelSpecs(model).platform, "");
				if (directValue) {
					return directValue;
				}

				const platformChassisValue = safeText(model && model.platformChassis && model.platformChassis.platform, "");
				if (platformChassisValue) {
					return platformChassisValue;
				}

				const bundleValue = safeText(model && model.__bundle && model.__bundle.platformChassis && model.__bundle.platformChassis.platform, "");
				if (bundleValue) {
					return bundleValue;
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

				return getTechnicalCategoryValue(model, [/^Dimensions$/i, /^Wymiary$/i], [/Wall-mount compatible/i, /Zgodny uchwyt ścienny/i, /VESA/i]);
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
				const specs = getModelSpecs(model);
				return {
					audioChannels: getFirstResolvedSpecValue(model, [
						["specs", "audioChannels"],
						["specs", "technicalByCategory", "Sound", "Audio"],
						["specs", "technicalByCategory", "Sound", "Channels"],
						["specs", "technicalByCategory", "sound", "Audio"],
						["specs", "technicalByCategory", "sound", "Channels"]
					]) || getTechnicalCategoryValue(model, [/^Sound$/i, /^Dźwięk$/i], [/^Audio$/i, /Channel/i, /Channels/i]) || safeText(specs.audioChannels || model.audioChannels, ""),
					audioPower: formatAudioPower(getFirstResolvedSpecValue(model, [
						["specs", "audioPower"],
						["specs", "technicalByCategory", "Sound", "Output power (RMS)"],
						["specs", "technicalByCategory", "Sound", "Output power"],
						["specs", "technicalByCategory", "sound", "Output power (RMS)"],
						["specs", "technicalByCategory", "sound", "Output power"]
					]) || getTechnicalCategoryValue(model, [/^Sound$/i, /^Dźwięk$/i], [/Output power \(RMS\)/i, /Output power/i, /Moc wyjściowa/i]) || safeText(specs.audioPower || model.audioPower, "")),
					wifiStandard: formatWifiStandard(getFirstResolvedSpecValue(model, [
						["specs", "wifiStandard"],
						["specs", "technicalByCategory", "Connectivity", "wifiStandard"],
						["specs", "technicalByCategory", "Connectivity", "Wi-Fi standard"],
						["specs", "technicalByCategory", "connectivity", "wifiStandard"],
						["specs", "technicalByCategory", "connectivity", "Wi-Fi standard"]
					]) || getTechnicalCategoryValue(model, [/^Connectivity$/i, /^Łączność$/i], [/Wi[-\s]?Fi/i, /Wireless connection/i, /WiFi/i]) || safeText(specs.wifiStandard || model.wifiStandard, "")),
					bluetoothVersion: formatBluetoothVersion(getFirstResolvedSpecValue(model, [
						["specs", "bluetoothVersion"],
						["specs", "technicalByCategory", "Connectivity", "bluetoothVersion"],
						["specs", "technicalByCategory", "connectivity", "bluetoothVersion"]
					]) || getTechnicalCategoryValue(model, [/^Connectivity$/i, /^Łączność$/i], [/Bluetooth/i, /Wireless connection/i]) || safeText(specs.bluetoothVersion || model.bluetoothVersion, "")),
					vrrMaxRefreshRate: getFirstResolvedSpecValue(model, [
						["specs", "vrrMaxRefreshRate"],
						["specs", "technicalByCategory", "Supported HDMI video features", "VRR"],
						["specs", "technicalByCategory", "Gaming", "VRR"],
						["specs", "technicalByCategory", "Connectivity", "VRR"]
					]) || getTechnicalCategoryValue(model, [/^Supported HDMI video features$/i, /^Gaming$/i, /^Connectivity$/i], [/VRR/i, /refresh rate/i, /Max refresh/i]) || safeText(specs.vrrMaxRefreshRate || model.vrrMaxRefreshRate, "")
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
				function formatTechnicalFieldLabel(value) {
					const text = safeText(value, "");
					if (!text) {
						return "Value";
					}

					const titleCased = text
						.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
						.replace(/[_-]+/g, " ")
						.replace(/\s+/g, " ")
						.trim()
						.replace(/^./, (char) => char.toUpperCase());

					return titleCased
						.replace(/\bWifi\b/g, "WiFi")
						.replace(/\bHdmi\b/g, "HDMI")
						.replace(/\bUsb\b/g, "USB")
						.replace(/\bVrr\b/g, "VRR")
						.replace(/\bEarc\b/g, "eARC")
						.replace(/\bHdcp\b/g, "HDCP")
						.replace(/\bDts\b/g, "DTS");
				}

				function formatTechnicalSectionLabel(value) {
					return formatTechnicalFieldLabel(value);
				}

				function normalizeTechnicalValue(value, label) {
					const text = safeText(value, "-");
					return formatMntDisplayValue(label, text).replace(/\bmm\s+mm\b/gi, "mm").replace(/\s{2,}/g, " ").trim();
				}

				function formatTechnicalListValue(category, label, value) {
					const normalized = normalizeTechnicalValue(value, label);
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
						"Dolby Media Intelligence", "Personal Vocal Boost", "Bass Enhancement",
						"Room Calibration", "Hearing Profile", "Night Mode", "Night mode",
						"Clear Dialogue", "Dialogue", "Equalizer", "All Sound Style",
						"Entertainment", "Spatial Music", "Original", "Music", "AVL Mode",
						"AI mode", "DTS Play-Fi", "DTS:X", "Dolby Atmos", "Dolby Digital",
						"Dolby Vision 2 Max", "Dolby Vision", "HDR10+ Compatible",
						"HDR10+ Adaptive", "HDR10+", "HDR10", "HLG", "One touch play",
						"Remote control pass-through", "System audio control", "System standby",
						"External setting via TV UI", "HDMI-CEC for Philips TV/SB",
						"4K Audio Return Channel", "Audio Return Channel", "eARC", "VRR", "ALLM"
					];

					function escapeRegex(value) {
						return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
					}

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
				const isPolish = state.countryCode === "PL";
				const sectionHeader = isPolish ? "SEKCJA" : "Section";
				const fieldHeader = isPolish ? "POLE" : "Field";
				const valueHeader = isPolish ? "WARTOŚĆ" : "Value";

				safeList(rows).forEach((row) => {
					if (!isUsefulSpecValue(row && row.value)) {
						return;
					}

					const category = safeText(row && row.category, "General");
					const categoryKey = category.toLowerCase();
					const rawLabel = safeText(row && row.label, "Value");
					const label = translateTechKey(formatTechnicalFieldLabel(rawLabel));
					if (!groupedRowsByCategory.has(categoryKey)) {
						groupedRowsByCategory.set(categoryKey, {
							category: translateSectionLabel(formatTechnicalSectionLabel(category)),
							rows: [],
							seenRows: new Set()
						});
						orderedCategories.push(categoryKey);
					}

					const group = groupedRowsByCategory.get(categoryKey);
					const rowKey = [label.toLowerCase(), safeText(row && row.value, "")].join("||");
					if (group.seenRows.has(rowKey)) {
						return;
					}

					group.seenRows.add(rowKey);
					group.rows.push({
						label,
						value: translateValue(formatTechnicalListValue(category, rawLabel, row && row.value)),
						adminPath: ["specs", "technicalByCategory", category, rawLabel]
					});
				});

				const bodyRows = orderedCategories
					.map((categoryKey) => {
						const group = groupedRowsByCategory.get(categoryKey) || { category: "General", rows: [] };
						const rowsInCategory = group.rows || [];
						return rowsInCategory
							.map((row, index) => ""
								+ "<tr>"
								+ (index === 0
									? "<td class=\"px-3 py-2 text-slate-600 align-top\" rowspan=\"" + String(rowsInCategory.length) + "\">" + escapeHtml(group.category) + "</td>"
									: "")
								+ "<td class=\"px-3 py-2 font-semibold text-slate-800\">" + escapeHtml(row.label) + "</td>"
								+ "<td class=\"px-3 py-2 text-slate-700\">" + adminEditableValue(row.adminPath, row.value, row.label) + "</td>"
								+ "</tr>")
							.join("");
					})
					.join("");

				const fallbackRow = "<tr><td class=\"px-3 py-3 text-slate-500\" colspan=\"3\">" + escapeHtml(safeText(emptyMessage, "No technical details found.")) + "</td></tr>";

				return ""
					+ "<div class=\"overflow-x-auto rounded-xl border border-slate-200\">"
					+ "<table class=\"min-w-full divide-y divide-slate-200 text-sm\">"
					+ "<thead class=\"bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500\">"
					+ "<tr><th class=\"px-3 py-2\">" + sectionHeader + "</th><th class=\"px-3 py-2\">" + fieldHeader + "</th><th class=\"px-3 py-2\">" + valueHeader + "</th></tr>"
					+ "</thead>"
					+ "<tbody class=\"divide-y divide-slate-100 bg-white\">"
					+ (bodyRows || fallbackRow)
					+ "</tbody>"
					+ "</table>"
					+ "</div>"
					+ (state.isAdmin ? "<div class=\"mt-3 flex justify-end\">" + adminAddButton(["specs", "technicalByCategory"], "Add New Field") + "</div>" : "");
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
					const moduleName = safeText(model && (model.module || model.productType), "TV").toUpperCase();
					return {
						...model,
						module: moduleName,
						productType: moduleName,
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
				const title = normalizeLocalizedText(article && article.title, "Knowledge Article");
				const summary = normalizeLocalizedText(article && (article.summary || article.description), "");
				const imageUrl = safeText(article && article.imageUrl, "").replace(/\\/g, "/");
				const filters = normalizeKnowledgeFilters(article && article.filters);
				const tags = safeList(article && article.tags)
					.map((tag) => safeText(tag, ""))
					.filter(Boolean);

				const sections = safeList(article && article.sections).map((section) => ({
					heading: normalizeLocalizedText(section && section.heading, "Details"),
					paragraphs: safeList(section && section.paragraphs).map((text) => normalizeLocalizedText(text, "")).filter((text) => getLocalizedText(text, "")),
					bullets: safeList(section && section.bullets).map((text) => normalizeLocalizedText(text, "")).filter((text) => getLocalizedText(text, ""))
				}));

				const contentPoints = safeList(article && article.contentPoints)
					.map((point) => normalizeLocalizedText(point, ""))
					.filter((point) => getLocalizedText(point, ""));

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
					description: summary,
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
						description: normalized.description || existing.description || normalized.summary || existing.summary,
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

			function buildApiCandidates(pathSuffix) {
				const candidates = [];

				if (runtimeApiBaseUrl) {
					candidates.push(runtimeApiBaseUrl + pathSuffix);
				} else if (window.location.protocol !== "file:") {
					candidates.push(pathSuffix);
				}

				const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
				if (window.location.protocol === "file:" || isLocalHost) {
					candidates.push("http://localhost:4000" + pathSuffix);
				}

				return Array.from(new Set(candidates));
			}

			function normalizeBootstrapPayload(rawPayload) {
				if (!isPlainObject(rawPayload)) {
					return null;
				}

				if (Array.isArray(rawPayload.ModelsData)) {
					return {
						ModelsData: safeList(rawPayload.ModelsData),
						PoliciesData: rawPayload.PoliciesData || {},
						TroubleshootingData: rawPayload.TroubleshootingData || {},
						KnowledgeBaseData: safeList(rawPayload.KnowledgeBaseData),
						ModelMediaData: rawPayload.ModelMediaData || {},
						ModelPlatformChassisData: safeList(rawPayload.ModelPlatformChassisData),
						DocumentationLinksData: rawPayload.DocumentationLinksData || {},
						ChangelogEntriesData: safeList(rawPayload.ChangelogEntriesData)
					};
				}

				if (Array.isArray(rawPayload.models)) {
					return {
						ModelsData: safeList(rawPayload.models),
						PoliciesData: rawPayload.policies || {},
						TroubleshootingData: rawPayload.troubleshooting || {},
						KnowledgeBaseData: safeList(rawPayload.knowledge),
						ModelMediaData: rawPayload.modelMedia || {},
						ModelPlatformChassisData: safeList(rawPayload.modelPlatformChassis),
						DocumentationLinksData: rawPayload.documentationLinks || {},
						ChangelogEntriesData: safeList(rawPayload.changelogEntries)
					};
				}

				return null;
			}

			function getJsonCacheOptions() {
				const runtimeConfig = (window && window.SupportHubConfig && typeof window.SupportHubConfig === "object")
					? window.SupportHubConfig
					: {};
				const params = new URLSearchParams(window.location.search || "");
				return {
					disabled: Boolean(runtimeConfig.disableJsonCache) || state.isAdminRoute,
					refresh: params.has("refreshCache"),
					clear: params.has("clearSupportHubCache")
				};
			}

			async function clearSupportHubJsonCache() {
				if (!window.caches) {
					return;
				}

				try {
					await window.caches.delete(supportHubCacheName);
				} catch (error) {
					console.warn("[Cache] Failed to clear Support Hub cache:", error);
				}
			}

			async function clearSupportHubJsonCacheIfRequested() {
				const cacheOptions = getJsonCacheOptions();
				if (!cacheOptions.clear || !window.caches) {
					return;
				}

				try {
					await window.caches.delete(supportHubCacheName);
				} catch (error) {
					// Cache clearing is best-effort only.
				}
			}

			async function readCachedJson(url) {
				console.log("[Cache] Checking cache:", url);
				const cacheOptions = getJsonCacheOptions();
				if (!window.caches || cacheOptions.disabled || cacheOptions.refresh || cacheOptions.clear) {
					console.log("[Cache] Cache bypassed/unavailable:", url);
					return null;
				}

				try {
					const cache = await window.caches.open(supportHubCacheName);
					const cachedResponse = await cache.match(url, { ignoreVary: true });
					console.log(cachedResponse ? "[Cache] Cache hit:" : "[Cache] Cache miss:", url);
					return cachedResponse ? cachedResponse.json() : null;
				} catch (error) {
					console.warn("[Cache] Cache read failed, falling back to fetch:", url, error);
					return null;
				}
			}

			async function writeJsonResponseToCache(url, response) {
				const cacheOptions = getJsonCacheOptions();
				if (!window.caches || cacheOptions.disabled || cacheOptions.clear) {
					return;
				}

				try {
					const cache = await window.caches.open(supportHubCacheName);
					await cache.put(url, response.clone());
					console.log("[Cache] Stored response:", url);
				} catch (error) {
					console.warn("[Cache] Cache write failed:", url, error);
					// Cache API is an optimization only; ignore quota/security failures.
				}
			}

			async function fetchJsonWithTimeout(url, timeoutMs) {
				await clearSupportHubJsonCacheIfRequested();
				const effectiveUrl = state.isAdminRoute
					? url + (url.includes("?") ? "&" : "?") + "t=" + Date.now()
					: url;
				const cachedJson = await readCachedJson(effectiveUrl);
				if (cachedJson) {
					return cachedJson;
				}
				console.log("[Fetch] Fetching JSON:", effectiveUrl);

				const controller = new AbortController();
				const timer = window.setTimeout(() => controller.abort(), timeoutMs);

				try {
					const response = await fetch(effectiveUrl, {
						headers: {
							"Accept": "application/json"
						},
						signal: controller.signal,
						cache: state.isAdminRoute ? "no-store" : "default"
					});

					if (!response.ok) {
						return null;
					}

					await writeJsonResponseToCache(effectiveUrl, response);
					return response.json();
				} catch (error) {
					return null;
				} finally {
					window.clearTimeout(timer);
				}
			}

			async function fetchStaticModelMediaData() {
				const candidates = [
					"/public/mnt-media-links.json",
					"./public/mnt-media-links.json",
					"./mnt-media-links.json",
					"mnt-media-links.json",
					"/mnt-media-links.json"
				];

				if (runtimeApiBaseUrl) {
					candidates.unshift(runtimeApiBaseUrl + "/public/mnt-media-links.json");
					candidates.unshift(runtimeApiBaseUrl + "/mnt-media-links.json");
				}

				for (const url of Array.from(new Set(candidates))) {
					const payload = await fetchJsonWithTimeout(url, 4500);
					if (isPlainObject(payload)) {
						return payload;
					}
				}

				return {};
			}

			async function fetchRelationalDataFromApi() {
				const modelsCandidates = buildApiCandidates("/api/models");
				for (const baseModelsUrl of modelsCandidates) {
					const baseUrl = baseModelsUrl.replace(/\/api\/models$/, "");
					const modelsPayload = await fetchJsonWithTimeout(baseUrl + "/api/models", 4500);
					const knowledgePayload = await fetchJsonWithTimeout(baseUrl + "/api/knowledge", 4500);
					const policiesPayload = await fetchJsonWithTimeout(baseUrl + "/api/policies", 4500);
					const changelogPayload = await fetchJsonWithTimeout(baseUrl + "/api/changelog", 4500);
					const docsPayload = await fetchJsonWithTimeout(baseUrl + "/api/documentation-links", 4500);

					if (
						modelsPayload && modelsPayload.ok &&
						knowledgePayload && knowledgePayload.ok &&
						policiesPayload && policiesPayload.ok
					) {
						return {
							ModelsData: safeList(modelsPayload.ModelsData),
							ModelPlatformChassisData: safeList(modelsPayload.ModelPlatformChassisData),
							ModelMediaData: modelsPayload.ModelMediaData || {},
							KnowledgeBaseData: safeList(knowledgePayload.KnowledgeBaseData),
							TroubleshootingData: knowledgePayload.TroubleshootingData || {},
							PoliciesData: policiesPayload.PoliciesData || {},
							DocumentationLinksData:
								(docsPayload && docsPayload.ok && isPlainObject(docsPayload.DocumentationLinksData))
									? docsPayload.DocumentationLinksData
									: {},
							ChangelogEntriesData:
								(changelogPayload && changelogPayload.ok)
									? safeList(changelogPayload.ChangelogEntriesData)
									: []
						};
					}
				}

				const bootstrapCandidates = buildApiCandidates("/api/bootstrap");
				for (const url of bootstrapCandidates) {
					const payload = await fetchJsonWithTimeout(url, 4500);
					const normalized = normalizeBootstrapPayload(payload);
					if (normalized) {
						return normalized;
					}
				}
				return null;
			}

			async function loadRelationalData() {
				await wait(90);

				const apiData = await fetchRelationalDataFromApi();
				if (apiData) {
					return JSON.parse(JSON.stringify(apiData));
				}

				if (Array.isArray(RelationalMockData.ModelsData) && RelationalMockData.ModelsData.length > 0) {
					return JSON.parse(JSON.stringify(RelationalMockData));
				}

				throw new Error("API data unavailable and no local fallback data loaded.");
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
					title: getArticleTitle(article),
					subtitle: getArticleSummary(article),
					searchFields: [
						...(article.tags || []),
						...safeList(article && article.filters && article.filters.topics),
						...safeList(article && article.filters && article.filters.os),
						...safeList(article && article.filters && article.filters.panel),
						...safeList(article.contentPoints),
						...safeList(article.sections).flatMap((section) => [
							getLocalizedText(section && section.heading, ""),
							...safeList(section && section.paragraphs).map((text) => getLocalizedText(text, "")),
							...safeList(section && section.bullets).map((text) => getLocalizedText(text, ""))
						])
					],
					identifiers: [getArticleTitle(article), ...(article.tags || [])],
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
				if (state.modelDetailsById && state.modelDetailsById[id]) {
					return state.modelDetailsById[id];
				}

				return state.data.ModelsData.find((model) => getModelKey(model) === id) || null;
			}

			function getLiveAdminModelById(id) {
				if (
					state.isAdmin
					&& state.currentModel
					&& (
						getModelKey(state.currentModel) === id
						|| state.selectedModelId === id
						|| getModelName(state.currentModel) === id
					)
				) {
					return state.currentModel;
				}

				return getModelById(id);
			}

			async function hydrateModelDetail(modelId) {
				const normalizedModelId = safeText(modelId, "");
				if (!normalizedModelId) {
					return null;
				}

				const baseModel = getModelById(normalizedModelId);
				if (!baseModel) {
					return null;
				}

				if (state.modelDetailsById && state.modelDetailsById[normalizedModelId]) {
					return state.modelDetailsById[normalizedModelId];
				}

				const requestToken = state.modelDetailRequestToken + 1;
				state.modelDetailRequestToken = requestToken;

				try {
					const response = await api.getModelDetail(getModelName(baseModel));
					const bundle = response && response.bundle && typeof response.bundle === "object" ? response.bundle : null;
					const detailedModel = bundle && bundle.model ? bundle.model : null;
					if (!detailedModel) {
						return baseModel;
					}

					const mergedModel = {
						...baseModel,
						...detailedModel,
						__bundle: bundle,
						knowledgeArticles: Array.isArray(bundle && bundle.knowledgeArticles) ? bundle.knowledgeArticles : [],
						__key: normalizedModelId
					};

					if (state.isAdmin && state.adminDirty && state.selectedModelId === normalizedModelId && state.currentModel) {
						return state.currentModel;
					}

					state.modelDetailsById[normalizedModelId] = mergedModel;

					if (state.selectedModelId === normalizedModelId && state.modelDetailRequestToken === requestToken && state.viewMode === "detail") {
						renderModelDetail(mergedModel);
					}

					return mergedModel;
				} catch (error) {
					console.warn("Failed to hydrate model detail", error);
					return baseModel;
				}
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

				const allModels = state.data.ModelsData.filter((model) => getModelModule(model) === state.activeModule);
				const yearOptions = uniqueSorted(allModels.map((model) => getModelYear(model)).filter((year) => year !== "-"), true);
				fillSelect(yearFilter, yearOptions, state.filters.year, t("anyYear"));
				state.filters.year = yearFilter.value;

				const yearScoped = state.filters.year === "all"
					? allModels
					: allModels.filter((model) => String(getModelYear(model)) === state.filters.year);
				const osOptions = uniqueSorted(yearScoped.map((model) => getFilterOsOrBrand(model)).filter(Boolean), false);
				fillSelect(osFilter, osOptions, state.filters.os, state.activeModule === "MNT" ? "Any Brand" : t("anyOs"));
				state.filters.os = osFilter.value;

				const osScoped = state.filters.os === "all"
					? yearScoped
					: yearScoped.filter((model) => getFilterOsOrBrand(model) === state.filters.os);
				const panelOptions = uniqueSorted(osScoped.map((model) => getModelPanel(model)).filter(Boolean), false);
				fillSelect(panelFilter, panelOptions, state.filters.panel, t("anyPanel"));
				state.filters.panel = panelFilter.value;
			}

			function getFilterScopedModels() {
				if (!state.data) {
					return [];
				}

				let models = state.data.ModelsData.filter((model) => getModelModule(model) === state.activeModule);

				if (state.filters.year !== "all") {
					models = models.filter((model) => String(getModelYear(model)) === state.filters.year);
				}

				if (state.filters.os !== "all") {
					models = models.filter((model) => getFilterOsOrBrand(model) === state.filters.os);
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
				if (!state.data || state.activeModule !== "TV") {
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
				const model = getLiveAdminModelById(state.selectedModelId);
				const yearLabel = state.filters.year === "all" ? t("anyYear") : state.filters.year;
				const osLabel = state.filters.os === "all" ? (state.activeModule === "MNT" ? "Any Brand" : t("anyOs")) : state.filters.os;
				const panelLabel = state.filters.panel === "all" ? t("anyPanel") : state.filters.panel;
				const modelLabel = model ? " -> " + getModelName(model) : "";
				activePath.textContent = t("path") + ": " + yearLabel + " -> " + osLabel + " -> " + panelLabel + modelLabel;
			}

			function renderModelGrid(models) {
				modelGrid.innerHTML = "";
				emptyState.textContent = t("noModels");

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
					const isMnt = isMntModel(model) || state.activeModule === "MNT";
					const specs = getModelSpecs(model);
					const mntRefreshRate = getMntRefreshRate(model);
					const mntWarranty = getMntWarranty(model);
					const mntBrand = getMntBrand(model);
					const refreshRateLabel = translateHardcodedText("Refresh Rate:", "Odświeżanie:", "Bildwiederholfrequenz:");
					const warrantyLabel = translateHardcodedText("Warranty:", "Gwarancja:", "Garantie:");
					const platformLabel = translateHardcodedText("Platform:", "Platforma:", "Plattform:");

					if (modelKey === state.selectedModelId) {
						card.classList.add("is-active");
					}

					card.innerHTML = ""
						+ "<div class=\"flex items-center justify-between gap-2\">"
						+ "<p class=\"brand-font text-lg text-slate-900\">" + getModelName(model) + "</p>"
						+ "<span class=\"rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600\">" + getModelYear(model) + "</span>"
						+ "</div>"
						+ (isMnt
							? "<p class=\"mt-2 text-xs text-slate-500\">" + refreshRateLabel + " " + escapeHtml(translateValue(mntRefreshRate)) + "</p>"
								+ (mntWarranty ? "<p class=\"mt-2 text-xs text-slate-500\">" + warrantyLabel + " " + escapeHtml(translateValue(mntWarranty)) + "</p>" : "")
							: "<p class=\"mt-1 text-sm font-semibold text-slate-700\">" + safeText(getModelCommercialName(model), "-") + "</p>"
								+ "<p class=\"mt-2 text-xs text-slate-500\">" + platformLabel + " " + safeText(getModelPlatform(model), "-") + "</p>"
								+ "<p class=\"mt-2 text-xs text-slate-500\">Chassis: " + safeText(getModelChassis(model), "-") + "</p>")
						+ "<div class=\"mt-3 flex flex-wrap gap-2\">"
						+ "<span class=\"rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-brand-700\">" + escapeHtml(isMnt ? mntBrand : getModelOS(model)) + "</span>"
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
					emptyState.textContent = t("noArticles");
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
						+ "<p class=\"brand-font text-lg text-slate-900\">" + escapeHtml(getArticleTitle(article)) + "</p>"
						+ "<span class=\"rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-brand-700\">KB</span>"
						+ "</div>"
						+ "<p class=\"mt-2 text-sm text-slate-600\">" + escapeHtml(getArticleSummary(article)) + "</p>"
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
					resultsSectionTitle.textContent = nextView === "articles" ? t("articleResults") : t("modelResults");
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

			function getMntSpecValue(model, categoryName, keyName, fallbackValue) {
				const specs = getModelSpecs(model);
				const categories = getModelTechnicalByCategory(model);
				const category = Object.entries(categories).find(([name]) => name.toLowerCase() === String(categoryName || "").toLowerCase());
				const entries = category && isPlainObject(category[1]) ? category[1] : {};
				const directValue = entries[keyName];
				const value = formatMntDisplayValue(keyName, directValue || fallbackValue || "");
				return isUsefulSpecValue(value) ? value : "";
			}

			function formatMntAngleRange(value) {
				const text = safeText(value, "");
				const normalizedNumber = Number(text.replace(",", "."));

				if (Number.isFinite(normalizedNumber) && normalizedNumber < 0 && normalizedNumber > -1) {
					const upperValue = 5 / Math.abs(normalizedNumber);
					const formattedUpper = Number.isInteger(upperValue)
						? String(upperValue)
						: String(Math.round(upperValue * 10) / 10);
					return "-5/" + formattedUpper + "\u00b0";
				}

				if (/^-?\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(text)) {
					return text.replace(",", ".") + "\u00b0";
				}

				return text;
			}

			function formatMntSwivelValue(value) {
				const text = safeText(value, "");
				if (text === "-1") {
					return "-180/180\u00b0";
				}
				return formatMntAngleRange(text);
			}

			function formatMntDisplayValue(label, value) {
				const text = safeText(value, "");
				const labelText = safeText(label, "");

				if (/^tilt$/i.test(labelText)) {
					return formatMntAngleRange(text);
				}

				if (/^swivel$/i.test(labelText)) {
					return formatMntSwivelValue(text);
				}

				if (/^pivot$/i.test(labelText) && /^-?\d+(?:[,.]\d+)?$/.test(text)) {
					return text.replace(",", ".") + "\u00b0";
				}

				if (/^tilt$/i.test(labelText) && /^-0[,.]166666667$/.test(text)) {
					return "-5/30°";
				}

				if (/^swivel$/i.test(labelText) && text === "-1") {
					return "-180/180°";
				}

				if (/^pivot$/i.test(labelText) && /^-?\d+(?:[,.]\d+)?$/.test(text)) {
					return text.replace(",", ".") + "°";
				}

				if (/^-0[,.]166666667$/.test(text)) {
					return "-5/30°";
				}

				return text;
			}

			function isUsefulSpecValue(value, options) {
				const text = safeText(value, "");
				const lowerText = text.toLowerCase();
				if (!text || text === "-" || lowerText.includes("tbc") || lowerText.includes("tbd")) {
					return false;
				}

				if (options && options.forBox && (/^0(?:\s*=\s*no)?$/i.test(text) || /^no$/i.test(text))) {
					return false;
				}

				return true;
			}

			function renderSpecRow(label, value, adminPath) {
				const displayValue = formatMntDisplayValue(label, value);
				if (!isUsefulSpecValue(displayValue)) {
					return "";
				}
				return "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel(label)) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(adminPath, displayValue, label) + "</dd></div>";
			}

			function renderBoxRow(label, value, adminPath) {
				if (!isUsefulSpecValue(value, { forBox: true })) {
					return "";
				}
				return "<div class=\"rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700\">" + escapeHtml(translateLabel(label)) + adminEditButton(adminPath, label) + "</div>";
			}

			function renderMntSpecsPane(model) {
				const specs = getModelSpecs(model);
				const featureEntries = Array.from(new Set(safeList(specs.features && specs.features.knowledge).filter(Boolean)))
					.filter((item) => !isBasicFeatureValue(item))
					.map((term) => {
						const article = getExplicitKnowledgeArticleByTerm(term, { model });
						return {
							term,
							article,
							tooltip: article ? getArticleSummary(article) || getArticleTitle(article) || term : ""
						};
					});

				const featureBadges = featureEntries
					.map((item) => renderKnowledgePill(
						item.term,
						"rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700",
						Boolean(item.article),
						item.tooltip
					))
					.join(" ");

				const boxRows = [
					renderBoxRow("VGA cable", getMntSpecValue(model, "What's in the box", "VGA cable"), ["specs", "technicalByCategory", "What's in the box", "VGA cable"]),
					renderBoxRow("DVI cable", getMntSpecValue(model, "What's in the box", "DVI cable"), ["specs", "technicalByCategory", "What's in the box", "DVI cable"]),
					renderBoxRow("HDMI cable", getMntSpecValue(model, "What's in the box", "HDMI cable"), ["specs", "technicalByCategory", "What's in the box", "HDMI cable"]),
					renderBoxRow("Displayport Cable", getMntSpecValue(model, "What's in the box", "Displayport Cable"), ["specs", "technicalByCategory", "What's in the box", "Displayport Cable"]),
					renderBoxRow("Mini-DP cable", getMntSpecValue(model, "What's in the box", "Mini-DP cable"), ["specs", "technicalByCategory", "What's in the box", "Mini-DP cable"]),
					renderBoxRow("Audio Cable", getMntSpecValue(model, "What's in the box", "Audio Cable"), ["specs", "technicalByCategory", "What's in the box", "Audio Cable"]),
					renderBoxRow("USB-A to B Cable", getMntSpecValue(model, "What's in the box", "USB-A to B Cable"), ["specs", "technicalByCategory", "What's in the box", "USB-A to B Cable"]),
					renderBoxRow("USB-C Cable", getMntSpecValue(model, "What's in the box", "USB-C Cable"), ["specs", "technicalByCategory", "What's in the box", "USB-C Cable"]),
					renderBoxRow("Remote Control", getMntSpecValue(model, "What's in the box", "Remote Control"), ["specs", "technicalByCategory", "What's in the box", "Remote Control"])
				].join("");

				return ""
					+ "<div class=\"grid gap-4 xl:grid-cols-2\">"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("coreHardware") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ renderSpecRow("Brand", safeText(model && model.brand, specs.brand || "-"), ["brand"])
					+ renderSpecRow("Panel", getModelPanel(model), ["specs", "technicalByCategory", "Display/Panel", "Panel"])
					+ renderSpecRow("Resolution", getMntSpecValue(model, "Display/Panel", "Resolution", specs.resolution), ["specs", "technicalByCategory", "Display/Panel", "Resolution"])
					+ renderSpecRow("Warranty", getMntSpecValue(model, "Display/Panel", "Warranty", specs.warranty), ["specs", "technicalByCategory", "Display/Panel", "Warranty"])
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"core\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">" + t("showFullCore") + "</button>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("physicalDetails") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ renderSpecRow("Tilt", getMntSpecValue(model, "Physical", "Tilt", specs.tilt), ["specs", "technicalByCategory", "Physical", "Tilt"])
					+ renderSpecRow("Height Adjust", getMntSpecValue(model, "Physical", "Height Adjust", specs.heightAdjust), ["specs", "technicalByCategory", "Physical", "Height Adjust"])
					+ renderSpecRow("Pivot", getMntSpecValue(model, "Physical", "Pivot", specs.pivot), ["specs", "technicalByCategory", "Physical", "Pivot"])
					+ renderSpecRow("Swivel", getMntSpecValue(model, "Physical", "Swivel", specs.swivel), ["specs", "technicalByCategory", "Physical", "Swivel"])
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"physical\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">" + t("showFullPhysical") + "</button>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("audioSpecifications") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ renderSpecRow("Speakers", getMntSpecValue(model, "Sound", "Speakers", model && model.audioChannels), ["specs", "technicalByCategory", "Sound", "Speakers"])
					+ renderSpecRow("Speaker power", getMntSpecValue(model, "Sound", "Speaker power", model && model.audioPower), ["specs", "technicalByCategory", "Sound", "Speaker power"])
					+ "</dl>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("connectivity") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ renderSpecRow("HDMI Ports", getMntSpecValue(model, "Connectivity", "HDMI Ports", specs.hdmiPorts), ["specs", "technicalByCategory", "Connectivity", "HDMI Ports"])
					+ renderSpecRow("Display Port Ports", getMntSpecValue(model, "Connectivity", "DisplayPort Ports", specs.dpPorts), ["specs", "technicalByCategory", "Connectivity", "DisplayPort Ports"])
					+ renderSpecRow("USB C", getMntSpecValue(model, "Connectivity", "USB-C", specs.usbC), ["specs", "technicalByCategory", "Connectivity", "USB-C"])
					+ renderSpecRow("USB Hub", getMntSpecValue(model, "Connectivity", "USB Hub", specs.usbHub), ["specs", "technicalByCategory", "Connectivity", "USB Hub"])
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"connectivity\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">" + t("showFullConnectivity") + "</button>"
					+ "</div>"
					+ (boxRows
						? "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-2\">"
							+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("whatsInTheBox") + adminAddButton(["specs", "technicalByCategory", "What's in the box"], "Add Item") + "</h5>"
							+ "<dl class=\"mt-3 grid gap-2 text-sm sm:grid-cols-2\">" + boxRows + "</dl>"
							+ "</div>"
						: "")
					+ "</div>"
					+ "<div class=\"mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("knowledgeFeatures") + adminAddButton(["specs", "features", "knowledge"], "Add Item") + "</h5>"
					+ "<div class=\"mt-2 flex flex-wrap gap-2\">" + (featureBadges || "<span class=\"text-xs text-slate-500\">" + t("noKnowledgeFeatures") + "</span>") + "</div>"
					+ "</div>";
			}

			function renderSpecsPane(model) {
				if (isMntModel(model)) {
					return renderMntSpecsPane(model);
				}

				const allSizes = getModelSizes(model);
				const selectedSize = getModelSelectedSize(model);
				const sizeScopedModel = getModelForSize(model, selectedSize);
				const dimensionsModel = getModelForSize(model, selectedSize, { fallbackToBase: false });
				const displayedSize = formatSizeWithInch(selectedSize);
				const specs = getModelSpecs(sizeScopedModel);
				const standardSpecs = getModelStandardSpecs(sizeScopedModel);
				const featureEntries = Array.from(new Set(flattenFeatureValues(specs.features).filter(Boolean)))
					.filter((item) => !isBasicFeatureValue(item))
					.map((term) => {
						const article = getExplicitKnowledgeArticleByTerm(term, { model });
						return {
							term,
							article,
							tooltip: article ? getArticleSummary(article) || getArticleTitle(article) || term : ""
						};
					});
				const withStandDimensions = getFirstResolvedSpecValue(dimensionsModel, [
					["specs", "technicalByCategory", "Dimensions", "TV with stand"],
					["specs", "technicalByCategory", "Dimensions", "TV with stand (W x H x D)"],
					["specs", "technicalByCategory", "dimensions", "TV with stand"]
				]) || getTechnicalCategoryValue(dimensionsModel, [/^Dimensions$/i, /^Wymiary$/i], [/TV with stand/i, /Telewizor z podstawą/i]);
				const withoutStandDimensions = getFirstResolvedSpecValue(dimensionsModel, [
					["specs", "technicalByCategory", "Dimensions", "TV without stand"],
					["specs", "technicalByCategory", "Dimensions", "TV without stand (W x H x D)"],
					["specs", "technicalByCategory", "dimensions", "TV without stand"]
				]) || getTechnicalCategoryValue(dimensionsModel, [/^Dimensions$/i, /^Wymiary$/i], [/TV without stand/i, /Telewizor bez podstawy/i]);
				const dimensionsWeight = getFirstResolvedSpecValue(dimensionsModel, [
					["specs", "technicalByCategory", "Dimensions", "Weight of TV without stand"],
					["specs", "technicalByCategory", "Dimensions", "Weight of TV with stand"],
					["specs", "technicalByCategory", "Dimensions", "Weight incl. packaging"],
					["specs", "technicalByCategory", "Dimensions", "Weight"],
					["specs", "technicalByCategory", "dimensions", "Weight"]
				]) || getTechnicalCategoryValue(dimensionsModel, [/^Dimensions$/i, /^Wymiary$/i], [/Weight of TV without stand/i, /Weight of TV with stand/i, /Weight incl\. packaging/i, /Weight/i, /Waga/i]);
				const vesaStandard = getModelVesa(sizeScopedModel);
				const standValue = safeText(specs.stand, "")
					|| getTechnicalCategoryValue(sizeScopedModel, [/^Dimensions$/i, /^Wymiary$/i], [/^stand$/i])
					|| safeText(getModelSpecs(sizeScopedModel).rawSource && getModelSpecs(sizeScopedModel).rawSource.stand, "");
				const sizeLabel = displayedSize !== "-" ? displayedSize : "-";
				const allSizesLabel = formatModelSizesWithInches(allSizes) || "-";

				const featureBadges = featureEntries
					.map((item) => {
						const hasExplicitKb = Boolean(item.article);
						return renderKnowledgePill(
							item.term,
							"rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700",
							hasExplicitKb,
							item.tooltip
						);
					})
					.join(" ");

				return ""
					+ "<div class=\"grid gap-4 xl:grid-cols-2\">"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("coreHardware") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Panel")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["panelType"], getModelPanel(sizeScopedModel), "Panel") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">OS</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["osProfileId"], getModelOS(sizeScopedModel), "OS") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Platform")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["platform"], safeText(getModelPlatform(sizeScopedModel), "-"), "Platform") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Chassis")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["chassis"], safeText(getModelChassis(sizeScopedModel), "-"), "Chassis") + "</dd></div>"
					+ "</dl>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("physicalDetails") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Stand")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["specs", "stand"], safeText(standValue, "-"), "Stand") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Sizes")) + "</dt><dd class=\"font-semibold text-slate-800\">" + escapeHtml(translateValue(allSizesLabel)) + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("VESA Standard")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["specs", "vesa"], safeText(vesaStandard, "-"), "VESA Standard") + "</dd></div>"
					+ "</dl>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("audioSpecifications") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Channels")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["audioChannels"], safeText(standardSpecs.audioChannels, "-"), "Channels") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Audio Power")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["audioPower"], safeText(standardSpecs.audioPower, "-"), "Audio Power") + "</dd></div>"
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"audio\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">" + t("showFullAudio") + "</button>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("connectivity") + "</h5>"
					+ "<dl class=\"mt-3 space-y-2 text-sm flex-1 pb-2\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">WiFi</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["wifiStandard"], safeText(standardSpecs.wifiStandard, "-"), "WiFi") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">Bluetooth</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["bluetoothVersion"], safeText(standardSpecs.bluetoothVersion, "-"), "Bluetooth") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Max VRR Refresh Rate")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["vrrMaxRefreshRate"], safeText(standardSpecs.vrrMaxRefreshRate, "-"), "Max VRR Refresh Rate") + "</dd></div>"
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"connectivity\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">" + t("showFullConnectivity") + "</button>"
					+ "</div>"
					+ "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-2 flex flex-col\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + escapeHtml(translateLabel("Dimensions")) + "</h5>"
					+ "<p class=\"mt-2 text-xs text-slate-500\">" + escapeHtml(t("selectedSize", { size: sizeLabel })) + "</p>"
					+ "<dl class=\"mt-3 grid gap-2 text-sm sm:grid-cols-2 flex-1 pb-2\">"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("TV With Stand")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["specs", "technicalByCategory", "Dimensions", "TV with stand"], safeText(withStandDimensions, "-"), "TV With Stand") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("TV Without Stand")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["specs", "technicalByCategory", "Dimensions", "TV without stand"], safeText(withoutStandDimensions, "-"), "TV Without Stand") + "</dd></div>"
					+ "<div class=\"flex justify-between gap-3\"><dt class=\"text-slate-500\">" + escapeHtml(translateLabel("Weight")) + "</dt><dd class=\"font-semibold text-slate-800\">" + adminEditableValue(["specs", "technicalByCategory", "Dimensions", "Weight"], safeText(dimensionsWeight, "-"), "Weight") + "</dd></div>"
					+ "</dl>"
					+ "<button type=\"button\" data-spec-detail=\"dimensions\" class=\"js-spec-detail-trigger mt-4 mt-auto w-full rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100\">" + t("showFullDimensions") + "</button>"
					+ "</div>"
					+ "</div>"
					+ "<div class=\"mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4\">"
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + t("knowledgeFeatures") + adminAddButton(["specs", "features", "knowledge"], "Add Item") + "</h5>"
					+ "<div class=\"mt-2 flex flex-wrap gap-2\">" + (featureBadges || "<span class=\"text-xs text-slate-500\">" + t("noKnowledgeFeatures") + "</span>") + "</div>"
					+ "</div>";
			}

			function renderPortsPane(model) {
				const media = getModelMedia(model);
				const portsImageUrl = getSafeHttpUrl(media && media.portsImageUrl);

				if (!portsImageUrl) {
					return "<div class=\"rounded-xl border border-slate-200 bg-slate-50 p-4\">"
						+ "<p class=\"text-sm text-slate-600\">" + t("noRearLayout") + "</p>"
						+ "</div>";
				}

				const portsImageSet = getRenderableImageVariants(portsImageUrl, {
					displayWidth: 1800,
					zoomWidth: 3200,
					widths: [800, 1200, 1600, 1800, 2400, 3200],
					sizes: "100vw"
				});
				return ""
					+ "<div class=\"overflow-hidden rounded-xl border border-slate-200 bg-white p-2\">"
					+ "<img src=\"" + escapeHtml(portsImageSet.src) + "\" srcset=\"" + escapeHtml(portsImageSet.srcSet) + "\" sizes=\"" + escapeHtml(portsImageSet.sizes || "100vw") + "\" alt=\"" + escapeHtml(getModelName(model) + " rear panel") + "\" class=\"js-zoomable-image h-auto max-h-[360px] w-full cursor-zoom-in rounded-lg object-contain\" loading=\"lazy\" tabindex=\"0\" role=\"button\" data-zoom-src=\"" + escapeHtml(portsImageSet.zoomSrc) + "\">"
					+ "</div>";
			}

			function renderTroubleshootingPane(model) {
				if (isMntModel(model)) {
					const modelName = getModelName(model);
					const mediaData = state.data && state.data.ModelMediaData ? state.data.ModelMediaData[modelName] : null;
					const support = isPlainObject(mediaData && mediaData.support) ? mediaData.support : {};
					const manualLanguageByCountry = {
						PL: { name: "polish", code: "pl", label: "Instrukcja obsługi" },
						DE: { name: "german", code: "de", label: "Benutzerhandbuch" },
						UK: { name: "english", code: "en", label: "User Manual" }
					};
					const targetManualLanguage = manualLanguageByCountry[state.countryCode] || manualLanguageByCountry.UK;
					const languageKeyPattern = /\([a-z]{2}\)/i;
					const languageNoisePattern = /(polish|english|german|danish|bulgarian|dutch|croatian|czech|finnish|greek|italian|hungarian|french|romanian|portuguese|slovenian|slovak|russian|spanish|turkish|swedish|\([a-z]{2}\))/gi;
					const supportGroupLabels = {
						manuals: translateHardcodedText("Manuals", "Instrukcje obsługi", "Benutzerhandbücher"),
						drivers: translateHardcodedText("Drivers & Firmware", "Sterowniki", "Treiber & Software"),
						others: translateHardcodedText("Declarations & Others", "Deklaracje", "Zertifikate & Sonstiges")
					};

					function isMassiveUserManualKey(label) {
						if (!/^user manual/i.test(label)) {
							return false;
						}
						const languageHits = label.match(languageNoisePattern) || [];
						return label.length > 120 || languageHits.length > 4;
					}

					function cleanGenericSupportLabel(label) {
						return safeText(label, "")
							.replace(/\d{1,2}\s+[a-zA-Z]+\s+\d{4}/g, "")
							.replace(/\s+/g, " ")
							.trim();
					}

					function getSupportGroup(label) {
						if (/(driver|firmware|software|i-?menu|g-?menu|setup)/i.test(label)) {
							return "drivers";
						}
						if (/(manual|document|guide|instrukcja|benutzerhandbuch)/i.test(label)) {
							return "manuals";
						}
						return "others";
					}

					const supportLinks = filterSupportLinksForRegion(
						getModelSupportLinks(model, { support })
							.filter((entry) => !isMassiveUserManualKey(entry.title || entry.label))
							.map((entry) => {
								const rawTitle = entry.title || entry.label;
								const title = !state.isAdmin && languageKeyPattern.test(safeText(rawTitle, "").toLowerCase())
									? targetManualLanguage.label
									: cleanGenericSupportLabel(rawTitle);
								return {
									...entry,
									label: title,
									title,
									group: getSupportGroup(title, entry.category)
								};
							})
					);

					const groupedSupportLinks = supportLinks.reduce((groups, entry) => {
						const groupName = entry.group || "others";
						groups[groupName].push(entry);
						return groups;
					}, { manuals: [], drivers: [], others: [] });

					function renderSupportLinkGroup(groupName, buttonClasses) {
						const entries = groupedSupportLinks[groupName] || [];
						if (entries.length === 0) {
							return "";
						}

						const buttons = entries.map((entry) => ""
							+ "<a href=\"" + escapeHtml(entry.url) + "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"" + buttonClasses + "\">"
							+ escapeHtml(entry.label)
							+ (state.isAdmin ? "<span class=\"ml-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500\">[" + escapeHtml(normalizeSupportRegion(entry.region)) + "]</span>" : "")
							+ "</a>"
						).join("");

						return ""
							+ "<div class=\"rounded-lg border border-white/70 bg-white/60 p-3\">"
							+ "<h6 class=\"text-xs font-bold uppercase tracking-[0.18em] text-slate-600\">" + escapeHtml(supportGroupLabels[groupName]) + adminAddButton(["__media", "support"], "Add Link") + "</h6>"
							+ "<div class=\"mt-2 flex flex-wrap gap-2\">" + buttons + "</div>"
							+ "</div>";
					}

					const mntLinks = [
						renderSupportLinkGroup("manuals", "inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"),
						renderSupportLinkGroup("drivers", "inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-cyan-100"),
						renderSupportLinkGroup("others", "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100")
					].filter(Boolean).join("");

					return ""
						+ "<section class=\"rounded-xl border border-emerald-200 bg-emerald-50 p-4\">"
						+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + translateHardcodedText("Monitor Support Links", "Linki wsparcia technicznego", "Monitor-Support-Links") + adminAddButton(["__media", "support"], "Add Link") + "</h5>"
						+ "<p class=\"mt-1 text-xs text-slate-600\">" + translateHardcodedText("Placeholder links for AOC/Philips monitor support resources.", "Zastępcze linki do zasobów wsparcia AOC/Philips.", "Support-Ressourcen für AOC/Philips-Monitore.") + "</p>"
						+ (mntLinks
							? "<div class=\"mt-3 grid gap-3\">" + mntLinks + "</div>"
							: "<p class=\"mt-3 text-xs text-slate-600\">" + translateHardcodedText("No support files available.", "Brak dostępnych plików wsparcia dla tego modelu.", "Keine Support-Dateien für dieses Modell verfügbar.") + "</p>")
						+ "</section>";
				}

				const docsContext = getModelDocumentationContext(model);

				const manualLabelPriority = {
					"user manual": 0,
					"quick start guide": 1,
					"leaflet": 2
				};

				const orderedManualLinks = filterSupportLinksForRegion(
					getModelSupportLinks(model, {
						manualLinks: docsContext.manualLinks,
						support: isPlainObject(getModelMedia(model) && getModelMedia(model).support) ? getModelMedia(model).support : {}
					})
				)
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
						+ (state.isAdmin ? "<span class=\"rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500\">[" + escapeHtml(normalizeSupportRegion(entry.region)) + "]</span>" : "")
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
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">Manuals & Documentation" + adminAddButton(["__media", "support"], "Add Link") + "</h5>"
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
					+ "<h5 class=\"text-sm font-semibold text-slate-900\">" + translateHardcodedText("Pixel policy for ", "Polityka pikseli dla ") + getModelName(model) + "</h5>"
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
				const isMnt = isMntModel(model);
				const mntMedia = isPlainObject(media && media.media) ? media.media : {};
				const imageLabel = (index) => translateHardcodedText("Image " + index, "Zdjęcie " + index);
				const mediaItems = isMnt
					? [
						{
							label: imageLabel(1),
							note: "",
							imageUrl: getSafeHttpUrl(mntMedia.frontImageUrl),
							adminPath: ["__media", "media", "frontImageUrl"]
						},
						{
							label: imageLabel(2),
							note: "",
							imageUrl: getSafeHttpUrl(mntMedia.sideImageUrl || mntMedia.sideViewImageUrl),
							adminPath: ["__media", "media", "sideImageUrl"]
						},
						{
							label: imageLabel(3),
							note: "",
							imageUrl: getSafeHttpUrl(mntMedia.portsImageUrl),
							adminPath: ["__media", "media", "portsImageUrl"]
						}
					]
					: (media
						? [
							{
								label: getModelName(model) + " front view",
								note: "Official product gallery image.",
								imageUrl: getSafeHttpUrl(media.frontImageUrl),
								adminPath: ["__media", "frontImageUrl"]
							},
							{
								label: getModelName(model) + " remote control",
								note: getSafeHttpUrl(media.remoteImageUrl)
									? "Official accessory/remote image."
									: "No dedicated remote image found in source.",
								imageUrl: getSafeHttpUrl(media.remoteImageUrl),
								adminPath: ["__media", "remoteImageUrl"]
							},
							{
								label: getModelName(model) + " connectors",
								note: getSafeHttpUrl(media.portsImageUrl)
									? "Official rear ports image."
									: "No dedicated rear ports image found in source.",
								imageUrl: getSafeHttpUrl(media.portsImageUrl),
								adminPath: ["__media", "portsImageUrl"]
							}
						]
						: []);

				const placeholders = isMnt ? [] : safeList(model.galleryPlaceholders);
				const fallbackItems = isMnt
					? [
						{ label: imageLabel(1), note: "", adminPath: ["__media", "media", "frontImageUrl"] },
						{ label: imageLabel(2), note: "", adminPath: ["__media", "media", "sideImageUrl"] },
						{ label: imageLabel(3), note: "", adminPath: ["__media", "media", "portsImageUrl"] }
					]
					: [
						{ label: getModelName(model) + " front view", note: "Placeholder for product photo.", adminPath: ["__media", "frontImageUrl"] },
						{ label: getModelName(model) + " remote control", note: "Placeholder for remote image.", adminPath: ["__media", "remoteImageUrl"] },
						{ label: getModelName(model) + " connectors", note: "Placeholder for rear ports image.", adminPath: ["__media", "portsImageUrl"] }
					];
				const sourceItems = mediaItems.some((item) => getSafeHttpUrl(item && item.imageUrl)) || isMnt
					? mediaItems
					: (placeholders.length ? placeholders : fallbackItems);
				const items = sourceItems.map((item) => ""
					+ (() => {
						const imageUrl = getSafeHttpUrl(item && item.imageUrl);
						const imageSet = getRenderableImageVariants(imageUrl, {
							displayWidth: 1600,
							zoomWidth: 3200,
							widths: [480, 800, 1200, 1600, 2400, 3200],
							sizes: "(min-width: 1280px) 460px, (min-width: 768px) 50vw, 100vw"
						});
						const displayUrl = imageSet.src;
						const zoomUrl = imageSet.zoomSrc;
						return ""
					+ "<div class=\"rounded-xl border border-slate-300 bg-slate-50 p-3\">"
					+ (imageUrl
						? "<div class=\"overflow-hidden rounded-lg border border-slate-200 bg-white p-1\"><img src=\"" + escapeHtml(displayUrl) + "\" srcset=\"" + escapeHtml(imageSet.srcSet) + "\" sizes=\"" + escapeHtml(imageSet.sizes || "100vw") + "\" alt=\"" + escapeHtml(safeText(item.label, "Model image")) + "\" class=\"js-zoomable-image h-40 w-full cursor-zoom-in object-contain\" loading=\"lazy\" tabindex=\"0\" role=\"button\" data-zoom-src=\"" + escapeHtml(zoomUrl) + "\"" + (state.isAdmin && item.adminPath ? " data-admin-image-path=\"" + encodeAdminPath(item.adminPath) + "\"" : "") + "></div>"
						: "<div class=\"rounded-lg border-2 border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500\">" + translateHardcodedText("Image not available", "Brak zdjęcia") + "</div>")
					+ "<p class=\"mt-2 text-sm font-semibold text-slate-800\">" + safeText(item.label, "Image placeholder") + (state.isAdmin && item.adminPath ? adminEditButton(item.adminPath, item.label) : "") + "</p>"
					+ (safeText(item.note, "") ? "<p class=\"mt-1 text-xs text-slate-500\">" + safeText(item.note, "") + "</p>" : "")
					+ "</div>";
					})()).join("");

				return ""
					+ (state.isAdmin ? "<div class=\"mb-3 flex justify-end\">" + adminAddButton(["__media"], "Add Image") + "</div>" : "")
					+ "<div class=\"grid gap-3 sm:grid-cols-2 xl:grid-cols-3\">"
					+ items
					+ "</div>";
			}

			function renderDetailPane(model, paneName) {
				if (paneName === "ports" && isMntModel(model)) {
					return renderSpecsPane(model);
				}
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
				const model = getModelById(state.selectedModelId);
				const nextTabName = model && isMntModel(model) && tabName === "ports" ? "specs" : tabName;
				state.activeDetailTab = nextTabName;
				detailTabButtons.forEach((button) => {
					const isActive = button.dataset.detailTab === nextTabName;
					button.classList.toggle("is-active", isActive);
					button.classList.toggle("text-slate-600", !isActive);
					button.classList.toggle("text-brand-700", isActive);
				});

				detailPanes.forEach((pane) => {
					pane.classList.toggle("pane-hidden", pane.dataset.pane !== nextTabName);
				});

				if (!model) {
					return;
				}

				const targetPane = detailPanes.find((pane) => pane.dataset.pane === nextTabName);
				if (targetPane) {
					targetPane.innerHTML = renderDetailPane(model, nextTabName);
					primeZoomImagesInContainer(targetPane);
				}

				persistSessionState();
			}

			function renderModelDetail(model) {
				if (
					state.isAdmin
					&& state.adminDirty
					&& state.currentModel
					&& (
						getModelKey(state.currentModel) === getModelKey(model)
						|| getModelName(state.currentModel) === getModelName(model)
					)
				) {
					model = state.currentModel;
				}
				state.currentModel = model;
				const platform = getModelPlatform(model);
				const brand = safeText(model && model.brand, "");
				const hardwareBadge = isMntModel(model)
					? (brand || translateHardcodedText("Brand: -", "Marka: -", "Marke: -"))
					: (platform || translateHardcodedText("Platform: -", "Platforma: -", "Plattform: -"));
				if (detailTypeLabel) {
					detailTypeLabel.textContent = isMntModel(model) ? t("mntModelDetail") : t("tvModelDetail");
				}
				detailTitle.textContent = getModelName(model);
				const commercialName = getModelCommercialName(model);
                detailSubTitle.textContent = (commercialName ? commercialName + " \u00b7 " : "") + t("modelLinkedTo", {
                    country: getCountryLabel(state.countryCode),
                    os: getModelOS(model)
                });

				const yearLabel = getModelYear(model);
				const isYearInteractive = Boolean(getExplicitKnowledgeArticleByTerm(yearLabel, { model }));
				const isOsInteractive = Boolean(getExplicitKnowledgeArticleByTerm(getModelOS(model), { model }));
				const isHardwareBadgeInteractive = isUsefulSpecValue(hardwareBadge) ? Boolean(getExplicitKnowledgeArticleByTerm(hardwareBadge, { model })) : false;

				const badges = [
					renderKnowledgePill(yearLabel, "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700", isYearInteractive),
					renderKnowledgePill(getModelOS(model), "rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-brand-700", isOsInteractive),
					renderKnowledgePill(hardwareBadge, "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700", isHardwareBadgeInteractive)
				];

				detailBadges.innerHTML = badges.join("");

				detailTabButtons.forEach((button) => {
					if (button.dataset.detailTab === "ports") {
						button.classList.toggle("hidden", isMntModel(model));
					}
				});

				detailPanes.forEach((pane) => {
					pane.innerHTML = "";
				});

				setDetailTab(isMntModel(model) && state.activeDetailTab === "ports" ? "specs" : (state.activeDetailTab || "specs"));
				primeModelMediaZoomImages(model);
			}

			function renderArticle(sectionData, typeLabel) {
				articleTypeLabel.textContent = typeLabel;
				articleTitle.textContent = getArticleTitle(sectionData);
				articleSummary.textContent = getArticleSummary(sectionData);
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
					heading.textContent = getLocalizedText(section && section.heading, "Details");
					container.appendChild(heading);

					safeList(section.paragraphs).forEach((paragraphText) => {
						const paragraph = document.createElement("p");
						paragraph.className = "mt-2 text-sm text-slate-700";
						paragraph.textContent = getLocalizedText(paragraphText, "");
						container.appendChild(paragraph);
					});

					if (safeList(section.bullets).length > 0) {
						const list = document.createElement("ul");
						list.className = "mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700";
						safeList(section.bullets).forEach((itemText) => {
							const item = document.createElement("li");
							item.textContent = getLocalizedText(itemText, "");
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
					image.alt = getArticleTitle(sectionData) + " image";
					image.className = "block h-auto w-full";
					image.loading = "lazy";
					image.decoding = "async";
					image.addEventListener("error", () => {
						imageWrap.innerHTML = ""
							+ "<div class=\"rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center\">"
							+ "<p class=\"text-sm font-semibold text-slate-800\">" + escapeHtml(getArticleTitle(sectionData) || "Knowledge article image") + "</p>"
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
								button.textContent = getArticleTitle(article) || "Open related article";
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

			function replaceBrowseHistoryState() {
				if (window.history && typeof window.history.replaceState === "function") {
					window.history.replaceState({ view: "browse" }, "", window.location.pathname);
				}
			}

			function replaceCurrentViewHistoryState() {
				if (state.viewMode === "detail" && state.selectedModelId) {
					if (window.history && typeof window.history.replaceState === "function") {
						window.history.replaceState({ view: "detail", modelId: state.selectedModelId }, "", "?model=" + encodeURIComponent(state.selectedModelId));
					}
					return;
				}

				if (state.viewMode === "article" && isPlainObject(state.articleViewContext)) {
					if (state.articleViewContext.kind === "knowledge") {
						const articleId = safeText(state.articleViewContext.id, "");
						if (articleId && window.history && typeof window.history.replaceState === "function") {
							window.history.replaceState({ view: "article", articleId: articleId }, "", "?article=" + encodeURIComponent(articleId));
							return;
						}
					}

					if (state.articleViewContext.kind === "policy" && window.history && typeof window.history.replaceState === "function") {
						window.history.replaceState({ view: "article", articleKind: "policy", policyPayload: state.articleViewContext.payload }, "", "?article=policy");
						return;
					}
				}

				replaceBrowseHistoryState();
			}

			function pushAppHistoryState(historyState, url) {
				if (window.history && typeof window.history.pushState === "function") {
					window.history.pushState(historyState, "", url);
				}
			}

			function goBackOrBrowse() {
				if (window.history && window.history.state) {
					window.history.back();
					return;
				}

				setViewMode("browse");
				replaceBrowseHistoryState();
			}

			function selectModel(modelId, options) {
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
				if (!(options && options.skipHistory)) {
					pushAppHistoryState({ view: "detail", modelId: modelId }, "?model=" + encodeURIComponent(modelId));
				}
				void hydrateModelDetail(modelId);
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
				if (!(options && options.skipHistory)) {
					pushAppHistoryState({ view: "article", articleId: articleId }, "?article=" + encodeURIComponent(articleId));
				}
			}

			function openPolicyArticle(policyPayload, options) {
				setArticleBackTarget(null);
				state.articleViewContext = {
					kind: "policy",
					payload: policyPayload
				};
				renderArticle(policyPayload, "Contacts and Policy Note");
				setViewMode("article");
				if (!(options && options.skipHistory)) {
					pushAppHistoryState({ view: "article", articleKind: "policy", policyPayload: policyPayload }, "?article=policy");
				}
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

				setArticleBackTarget(modelId || state.selectedModelId || null);
				state.articleViewContext = {
					kind: "knowledge",
					id: safeText(match && match.id, "")
				};
				renderArticle(
					match,
					match && String(match.articleType || match.article_type || "").indexOf("troubleshooting") === 0
						? "Troubleshooting Guide"
						: "Knowledge Base Article"
				);
				setViewMode("article");
			}

			function refreshModelResults() {
				state.filteredModels = getFilterScopedModels();
				state.filteredArticles = getSearchScopedArticles();

				const activeResultsCount = state.resultsView === "articles"
					? state.filteredArticles.length
					: state.filteredModels.length;
				const activeEntityLabel = state.resultsView === "articles" ? t("articles") : t("models");
				resultCountBadge.textContent = activeResultsCount + " " + activeEntityLabel.toLowerCase();

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
				if (state.activeModule !== "TV" && state.resultsView === "articles") {
					state.resultsView = "models";
				}
				moduleTabButtons.forEach((button) => {
					const isActive = button.dataset.tab === tabKey;
					button.classList.toggle("is-active", isActive);
					if (isActive) {
						button.classList.add("bg-slate-100", "shadow-sm", "text-slate-900");
						button.classList.remove("text-slate-600");
					} else {
						button.classList.remove("bg-slate-100", "shadow-sm", "text-slate-900");
						button.classList.add("text-slate-600");
					}
				});
				applyStaticTranslations();
				moduleNotice.textContent = t(moduleDescriptions[tabKey] || moduleDescriptions.TV);
				if (resultsModeModelsBtn && resultsModeArticlesBtn) {
					const isModels = state.resultsView === "models";
					resultsModeModelsBtn.classList.toggle("is-active", isModels);
					resultsModeArticlesBtn.classList.toggle("is-active", !isModels);
				}
				if (state.data) {
					state.selectedModelId = null;
					state.modelDetailsById = {};
					updateFilterOptions();
					refreshModelResults();
					setViewMode("browse");
				}
				persistSessionState();
			}

			function applyCountryConfig(countryCode) {
				if (!countryConfigs[countryCode]) {
					return;
				}

				state.countryCode = countryCode;
				applyStaticTranslations();
				localStorage.setItem(storageKeyCountry, countryCode);

				if (state.data) {
					updateFilterOptions();
					refreshModelResults();
					updatePath();
				}

				if (state.selectedModelId && state.viewMode === "detail") {
					const model = getModelById(state.selectedModelId);
					if (model) {
						renderModelDetail(model);
						void hydrateModelDetail(state.selectedModelId);
					}
				}

				persistSessionState();
			}

			function setPrintPreview(enabled) {
				state.printPreview = enabled;
				document.body.classList.toggle("print-preview", enabled);
				printModeBtn.textContent = enabled ? t("exitPrintMode") : t("printMode");
			}

			function hideGlobalLoader() {
				if (!globalLoader || globalLoader.classList.contains("hidden")) {
					return;
				}

				globalLoader.classList.add("opacity-0", "pointer-events-none");
				window.setTimeout(() => {
					globalLoader.classList.add("hidden");
				}, 320);
			}

			function showDashboard(options) {
				const instant = Boolean(options && options.instant);
				document.documentElement.classList.remove("resume-ready");

				if (instant) {
					splashScreen.classList.remove("is-hiding");
					splashScreen.classList.add("hidden");
					appShell.classList.remove("hidden");
					appShell.classList.remove("is-hidden");
					globalSearch.focus();
					return;
				}

				splashScreen.classList.add("is-hiding");
				window.setTimeout(() => {
					splashScreen.classList.add("hidden");
					appShell.classList.remove("hidden");
					appShell.classList.remove("is-hidden");
					globalSearch.focus();
				}, 320);
			}

			function returnToSplash() {
				state.isRestoringSession = true;
				document.documentElement.classList.remove("resume-ready");
				appShell.classList.add("hidden");
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
				console.log("[Bootstrap] Starting initializeData...");
				try {
					const data = await loadRelationalData();
					data.ModelsData = normalizeModelsData(data.ModelsData);
					data.PoliciesData = data.PoliciesData || {};
					data.TroubleshootingData = data.TroubleshootingData || {};
					data.KnowledgeBaseData = normalizeKnowledgeData(data.KnowledgeBaseData);
					data.ModelMediaData = await fetchStaticModelMediaData();
					data.ModelPlatformChassisData = safeList(data.ModelPlatformChassisData);
					if (data.ModelPlatformChassisData.length === 0) {
						data.ModelPlatformChassisData = safeList(ModelPlatformChassisData);
					}
					data.DocumentationLinksData = normalizeDocumentationLinksData(data.DocumentationLinksData);
					data.ChangelogEntriesData = safeList(data.ChangelogEntriesData);

					state.data = data;
					state.modelPlatformChassisLookup = buildModelPlatformChassisLookup(data.ModelPlatformChassisData);
					state.modelSearchIndex = buildSearchIndexFromEntries(buildModelSearchEntries(data.ModelsData));
					state.globalSearchIndex = buildSearchIndexFromEntries(buildGlobalEntries(data));
					setChangelogEntries(data.ChangelogEntriesData);

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
				} catch (error) {
					console.error("[Bootstrap] Caught error:", error);
					console.error("Bootstrap error:", error);
					throw error;
				} finally {
					console.log("[Bootstrap] Reached finally block, hiding loader.");
					hideGlobalLoader();
				}
			}

			continueBtn.addEventListener("click", () => {
				if (!state.data) {
					return;
				}
				applyCountryConfig(countrySelect.value);
				showDashboard();
				replaceBrowseHistoryState();
			});

			countrySelect.addEventListener("change", () => {
				if (!countryConfigs[countrySelect.value]) {
					return;
				}
				state.countryCode = countrySelect.value;
				applyStaticTranslations();
				if (!state.data) {
					setContinueButtonState("loading");
				}
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
				goBackOrBrowse();
			});

			articleBackBtn.addEventListener("click", () => {
				goBackOrBrowse();
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

					const adminImagePlaceholder = target.closest(".js-admin-image-placeholder");
					if (adminImagePlaceholder && state.isAdmin) {
						event.preventDefault();
						event.stopPropagation();
						const path = parseAdminPath(adminImagePlaceholder.getAttribute("data-admin-image-path"));
						const nextUrl = window.prompt("Image URL", "https://");
						if (nextUrl !== null && setNestedAdminValue(path, nextUrl.trim())) {
							refreshCurrentAdminDetail();
						}
						return;
					}

					const adminEditTrigger = target.closest(".js-admin-edit");
					if (adminEditTrigger && state.isAdmin) {
						event.preventDefault();
						event.stopPropagation();
						startAdminInlineEdit(adminEditTrigger, () => {
							refreshCurrentAdminDetail();
						});
						return;
					}

					const adminAddTrigger = target.closest(".js-admin-add");
					if (adminAddTrigger && state.isAdmin) {
						event.preventDefault();
						event.stopPropagation();
						const path = parseAdminPath(adminAddTrigger.getAttribute("data-admin-path"));
						if (path.length === 1 && path[0] === "__media") {
							const slot = safeText(window.prompt("Image slot: front, side, remote, ports", "front"), "").toLowerCase();
							const keyBySlot = {
								front: "frontImageUrl",
								side: isMntModel(state.currentModel) ? "media.sideImageUrl" : "sideImageUrl",
								remote: "remoteImageUrl",
								ports: isMntModel(state.currentModel) ? "media.portsImageUrl" : "portsImageUrl"
							};
							const key = keyBySlot[slot] || keyBySlot.front;
							const url = window.prompt("Image URL", "https://");
							if (!url) {
								return;
							}
							const mediaTarget = getMutableAdminTarget(path);
							if (mediaTarget) {
								if (key.includes(".")) {
									const parts = key.split(".");
									if (!isPlainObject(mediaTarget[parts[0]])) {
										mediaTarget[parts[0]] = {};
									}
									mediaTarget[parts[0]][parts[1]] = url.trim();
								} else {
									mediaTarget[key] = url.trim();
								}
								setAdminDirty(true);
								refreshCurrentAdminDetail();
							}
							return;
						}
						if (path.length >= 2 && path[0] === "specs" && path[1] === "technicalByCategory") {
							const defaultCategory = state.specDetailsContext && state.specDetailsContext.detailType
								? ({
									core: "Display/Panel",
									audio: "Sound",
									physical: "Physical",
									connectivity: "Connectivity",
									dimensions: "Dimensions"
								}[state.specDetailsContext.detailType] || "General")
								: "General";
							const categoryName = safeText(window.prompt("Section / category", defaultCategory), "");
							if (!categoryName) {
								return;
							}
							const fieldName = safeText(window.prompt("New Field Name", ""), "");
							if (!fieldName) {
								return;
							}
							const fieldValue = window.prompt("Value", "");
							if (fieldValue === null) {
								return;
							}
							if (setNestedAdminValue(["specs", "technicalByCategory", categoryName, fieldName], fieldValue.trim())) {
								updateAdminModelInCollections(state.currentModel);
								renderSpecDetailsModalFromContext();
								refreshCurrentAdminDetail();
							}
							return;
						}
						const isSupportPath = path[0] === "__media" && path[path.length - 1] === "support";
						if (isSupportPath) {
							showAdminSupportLinkDialog((link) => {
								const model = state.currentModel || getModelById(state.selectedModelId);
								if (model) {
									if (!Array.isArray(model.supportLinks)) {
										model.supportLinks = [];
									}
									model.supportLinks.push({
										title: link.title,
										url: link.url,
										category: link.category,
										region: link.region
									});
								}

								const targetObject = getMutableAdminTarget(path);
								if (targetObject) {
									if (!isPlainObject(targetObject.support)) {
										targetObject.support = {};
									}
									targetObject.support[link.title] = {
										url: link.url,
										category: link.category,
										region: link.region
									};
								}
								setAdminDirty(true);
								updateAdminModelInCollections(state.currentModel);
								refreshCurrentAdminDetail();
							});
							return;
						}

						const itemLabel = window.prompt("New item label", "");
						if (!itemLabel) {
							return;
						}
						const targetObject = getMutableAdminTarget(path);
						const usablePath = path[0] === "__media" ? path.slice(1) : path;
						let cursor = targetObject;
						usablePath.forEach((key, index) => {
							if (index === usablePath.length - 1) {
								if (Array.isArray(cursor[key])) {
									cursor[key].push(itemLabel.trim());
								} else if (isPlainObject(cursor[key])) {
									const itemValue = window.prompt("Value", "Yes");
									if (itemValue !== null) {
										cursor[key][itemLabel.trim()] = itemValue.trim();
									}
								} else if (String(key).toLowerCase() === "knowledge") {
									cursor[key] = [itemLabel.trim()];
								} else {
									const itemValue = window.prompt("Value", "Yes");
									cursor[key] = {};
									if (itemValue !== null) {
										cursor[key][itemLabel.trim()] = itemValue.trim();
									}
								}
								return;
							}
							if (!isPlainObject(cursor[key])) {
								cursor[key] = {};
							}
							cursor = cursor[key];
						});
						setAdminDirty(true);
						refreshCurrentAdminDetail();
						return;
					}

					const zoomableImage = target.closest(".js-zoomable-image");
					if (zoomableImage) {
						if (state.isAdmin && zoomableImage.hasAttribute("data-admin-image-path")) {
							event.preventDefault();
							event.stopPropagation();
							const path = parseAdminPath(zoomableImage.getAttribute("data-admin-image-path"));
							const currentUrl = safeText(zoomableImage.getAttribute("src"), "");
							const nextUrl = window.prompt("Image URL", currentUrl);
							if (nextUrl !== null && setNestedAdminValue(path, nextUrl.trim())) {
								refreshCurrentAdminDetail();
							}
							return;
						}
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

					const adminEditTrigger = target.closest(".js-admin-edit");
					if (adminEditTrigger && state.isAdmin) {
						event.preventDefault();
						event.stopPropagation();
						startAdminInlineEdit(adminEditTrigger, () => {
							renderSpecDetailsModalFromContext();
							refreshCurrentAdminDetail();
						});
						return;
					}

					const adminAddTrigger = target.closest(".js-admin-add");
					if (adminAddTrigger && state.isAdmin) {
						event.preventDefault();
						event.stopPropagation();
						const path = parseAdminPath(adminAddTrigger.getAttribute("data-admin-path"));
						if (path.length >= 2 && path[0] === "specs" && path[1] === "technicalByCategory") {
							const defaultCategory = state.specDetailsContext && state.specDetailsContext.detailType
								? ({
									core: "Display/Panel",
									audio: "Sound",
									physical: "Physical",
									connectivity: "Connectivity",
									dimensions: "Dimensions"
								}[state.specDetailsContext.detailType] || "General")
								: "General";
							const categoryName = safeText(window.prompt("Section / category", defaultCategory), "");
							const fieldName = safeText(window.prompt("New Field Name", ""), "");
							if (!categoryName || !fieldName) {
								return;
							}
							const fieldValue = window.prompt("Value", "");
							if (fieldValue !== null && setNestedAdminValue(["specs", "technicalByCategory", categoryName, fieldName], fieldValue.trim())) {
								updateAdminModelInCollections(state.currentModel);
								renderSpecDetailsModalFromContext();
								refreshCurrentAdminDetail();
							}
						}
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

			window.addEventListener("popstate", (event) => {
				const navigationState = event.state || {};

				if (navigationState.view === "detail" && navigationState.modelId) {
					selectModel(safeText(navigationState.modelId, ""), { skipHistory: true });
					return;
				}

				if (navigationState.view === "article") {
					if (navigationState.articleKind === "policy" && navigationState.policyPayload) {
						openPolicyArticle(navigationState.policyPayload, { skipHistory: true });
						return;
					}

					if (navigationState.articleId) {
						openKnowledgeArticle(safeText(navigationState.articleId, ""), { skipHistory: true });
						return;
					}
				}

				setViewMode("browse");
				updatePath();
			});

			const persistedSession = loadPersistedSessionState();
			const persistedCountry = isPlainObject(persistedSession) ? safeText(persistedSession.countryCode, "") : "";
			if (persistedCountry && countryConfigs[persistedCountry]) {
				countrySelect.value = persistedCountry;
			}

			const effectiveResumeCountry = (persistedCountry && countryConfigs[persistedCountry])
				? persistedCountry
				: ((savedCountry && countryConfigs[savedCountry]) ? savedCountry : "");
			const forceSplash = Boolean(options && options.forceSplash);
			const shouldAutoResume = !forceSplash && Boolean(effectiveResumeCountry);

			if (state.isAdminRoute) {
				ensureAdminChrome();
				document.getElementById("portalLanding")?.classList.add("hidden");
				document.getElementById("trainingShell")?.classList.add("hidden");
				setAdminLocked(true);
			}

			appShell.classList.add("hidden");
			appShell.classList.add("is-hidden");
			splashScreen.classList.remove("hidden");
			splashScreen.classList.remove("is-hiding");
			setContinueButtonState("loading");

			setActiveModule("TV");
			applyCountryConfig(countrySelect.value);
			loadSeenChangelogIds();
			renderChangelogAccordion();
			updateChangelogUnreadDot();
			setPrintPreview(false);
			toggleChangelog(false);
			setResultsView("models");
			setViewMode("browse");
			setContinueButtonState("loading");
			initializeData(persistedSession)
				.then(() => {
					setContinueButtonState("ready");
					if (state.isAdminRoute) {
						const storedToken = getStoredAdminToken();
						if (storedToken) {
							persistAdminToken(storedToken);
							state.isAdmin = true;
							setAdminLocked(false);
							showDashboard({ instant: true });
							replaceBrowseHistoryState();
						} else {
							setAdminLocked(true);
						}
						return;
					}
					if (shouldAutoResume) {
						showDashboard({ instant: true });
						replaceCurrentViewHistoryState();
					}
				})
				.catch((error) => {
					console.error("Failed to initialize Support Hub data:", error);
					setContinueButtonState("error");
					splashHint.textContent = t("loadError");
					returnToSplash();
				});
		}

