window.TroubleshootingData = {
					byOS: {
						"Titan OS": [
							{
								issue: "Wi-Fi drops every few minutes",
								steps: [
									"Disable Smart Network Switch and reconnect to 5 GHz SSID.",
									"Set DNS manually to 8.8.8.8 and retest streaming.",
									"If still failing, clear network stack from diagnostics menu."
								]
							},
							{
								issue: "App launch freeze after update",
								steps: [
									"Clear app cache from App Manager.",
									"Power-cycle TV for 60 seconds.",
									"Confirm firmware branch is at least TVA.2024.71.1002."
								]
							}
						],
						"Android TV": [
							{
								issue: "Play Store missing or crashing",
								steps: [
									"Verify Google account sync is enabled.",
									"Clear Play Store + Play Services cache.",
									"Reboot and run network validation in device settings."
								]
							},
							{
								issue: "Voice remote not responding",
								steps: [
									"Repair Bluetooth remote from Accessories menu.",
									"Check microphone switch is ON.",
									"Run remote firmware update if available."
								]
							}
						],
						"Google TV": [
							{
								issue: "Matter pairing fails",
								steps: [
									"Confirm TV and hub are on same VLAN.",
									"Enable mDNS/Bonjour forwarding on router.",
									"Reset Matter credentials and retry pairing within 10 minutes."
								]
							},
							{
								issue: "High input lag in game mode",
								steps: [
									"Set HDMI input to Ultra Mode.",
									"Disable motion smoothing in picture presets.",
									"Validate console outputs 120 Hz VRR."
								]
							}
						]
					},
					byChassis: {
						"TPM24.1E": [
							{
								issue: "Boot loop after OTA patch",
								steps: [
									"Perform soft reset from recovery.",
									"If unresolved, apply USB recovery package 24.1E-R2.",
									"Capture crash log and escalate to Tier2 firmware."
								]
							}
						],
						"TPM22.5E": [
							{
								issue: "HDMI handshake black screen",
								steps: [
									"Power cycle source and TV.",
									"Switch HDMI mode from Enhanced to Standard, retest.",
									"Replace cable with certified 18 Gbps cable."
								]
							}
						],
						"TPM26.3L": [
							{
								issue: "Intermittent eARC audio drop",
								steps: [
									"Set Digital Output to Auto.",
									"Disable quick start for full HDMI reinit.",
									"Update soundbar firmware and re-run eARC test pattern."
								]
							}
						]
					}
				};

window.KnowledgeBaseData = [
					{
						id: "kb-matter-standard",
						title: "What Is Matter (Smart Home Standard)?",
						summary: "Agent-ready overview of Matter for quick customer explanations.",
						tags: ["matter", "smart home", "pairing", "thread", "wifi"],
						filters: {
							topics: ["matter"],
							os: ["Google TV", "Google OS", "Android TV"]
						},
						sections: [
							{
								heading: "Definition",
								paragraphs: [
									"Matter is a smart home interoperability standard that allows devices from different brands to work together.",
									"It runs over existing local networks such as Wi-Fi and Thread, with Bluetooth Low Energy used for onboarding."
								],
								bullets: [
									"Focuses on local control and reliability.",
									"Supports multi-admin so users can manage devices in multiple ecosystems.",
									"Reduces app and ecosystem lock-in."
								]
							},
							{
								heading: "Agent Script",
								paragraphs: [
									"Use this one-liner: Matter helps your devices talk the same language across brands, so setup and control are easier.",
									"If pairing fails, check same-network conditions and mDNS visibility first."
								],
								bullets: []
							}
						]
					},
					{
						id: "kb-contact-numbers",
						title: "Contact Numbers and Escalation Channels",
						summary: "Region-based call routing, logistics, and panel-lab channels.",
						tags: ["contacts", "hotline", "escalation", "logistics", "panel lab"],
						sections: [
							{
								heading: "Primary Hotlines",
								paragraphs: [
									"UK Tier1: 0800-100-7744",
									"PL Tier1: +48 22 390 88 11",
									"DE Tier1: +49 30 5683 4410"
								],
								bullets: [
									"Logistics mailboxes are region-specific.",
									"Panel-lab escalation requires fault evidence and serial number.",
									"Use country-specific template before transfer."
								]
							}
						]
					},
					{
						id: "kb-known-issues-bulletin",
						title: "Known Issues Bulletin - Q2 2026",
						summary: "Cross-model issues currently monitored by Tier2 and engineering.",
						tags: ["known issues", "firmware", "wifi", "hdmi", "audio"],
						sections: [
							{
								heading: "Active Bulletins",
								paragraphs: [
									"Intermittent eARC drop on certain soundbars with quick-start enabled.",
									"Android Play Store login loop on outdated Google Services package."
								],
								bullets: [
									"Temporary fix for eARC: disable quick-start and reboot TV + soundbar.",
									"Temporary fix for Play Store: clear cache for Play Store and Play Services.",
									"Collect firmware build and timestamp before escalation."
								]
							}
						]
					}
				]; 
const KnowledgeBaseData = [
  {
    "id": "kb_titan_os",
    "title": "Titan OS",
    "tags": ["Titan OS", "Smart TV", "System"],
		"filters": {
			"topics": ["Titan OS", "App Gallery"],
			"os": ["Titan OS"]
		},
    "summary": "Philips' proprietary Smart TV operating system introduced for modern LED and OLED TVs, focusing on speed and ease of use.",
    "contentPoints": [
      "Extremely fast and lightweight compared to older Android TV versions.",
      "Supports major VOD apps out of the box (Netflix, Prime Video, Disney+, YouTube).",
      "Features 'Titan Channel' - a built-in free streaming service with curated content.",
      "Note for customers: It does not have the Google Play Store. Apps are managed via the dedicated Titan App Gallery."
    ]
  },
  {
    "id": "kb_ambilight_4sided",
    "title": "4-sided Ambilight",
    "tags": ["4-sided Ambilight", "Ambilight", "Lighting"],
		"filters": {
			"topics": ["4-sided Ambilight", "Ambilight"]
		},
    "summary": "The highest tier of Philips signature bias lighting technology, projecting colors from all four sides of the TV.",
    "contentPoints": [
      "LEDs are placed on the top, bottom, left, and right edges of the rear panel.",
      "Creates a 'floating' screen effect, significantly reducing eye strain in dark rooms.",
      "Syncs perfectly with on-screen action, music, or can be set to a static lounge light mode.",
      "Best performance requires wall-mounting or placing the TV at least 15cm away from the wall."
    ]
  },
  {
		"id": "kb_ambilight_3sided",
		"title": "3-sided Ambilight",
		"tags": ["3-sided Ambilight", "Ambilight", "Lighting"],
		"filters": {
			"topics": ["3-sided Ambilight", "Ambilight"]
		},
		"summary": "Ambilight configuration with LEDs on three sides of the TV for immersive bias lighting.",
		"contentPoints": [
			"Projects matching light from the left, right, and top edges of the rear panel.",
			"Delivers a strong immersion effect while being available on a wider model range than 4-sided variants.",
			"Works best when the TV is placed close to a neutral-color wall for cleaner color reflection.",
			"Supports Ambilight styles such as video-follow, audio-reactive, and static lounge modes."
		]
	},
	{
    "id": "kb_dolby_vision_2_max",
    "title": "Dolby Vision 2 Max",
    "tags": ["Dolby Vision 2 Max", "Dolby Vision", "HDR", "Video"],
		"filters": {
			"topics": ["Dolby Vision 2 Max"],
			"years": [2026]
		},
    "summary": "The latest and most advanced High Dynamic Range (HDR) standard supported by high-end Philips displays.",
    "contentPoints": [
      "Dynamically optimizes brightness, contrast, and color frame-by-frame.",
      "'Max' designation implies full utilization of high-peak brightness panels (like OLED META or MiniLED) without clipping highlights.",
      "Automatically adjusts the picture based on the ambient light sensor in the TV (Dolby Vision IQ features)."
    ]
  },
	{
		"id": "kb_dolby_vision",
		"title": "Dolby Vision",
		"tags": ["Dolby Vision", "HDR Format", "Video"],
		"filters": {
			"topics": ["Dolby Vision"]
		},
		"summary": "Dynamic HDR format that improves brightness, contrast, and color scene-by-scene on supported content.",
		"contentPoints": [
			"Dolby Vision uses dynamic metadata, so each scene can be optimized instead of one static HDR profile for the whole movie.",
			"It helps preserve highlight details and dark-scene visibility, especially in difficult mixed-light scenes.",
			"Customers need Dolby Vision content from streaming apps or external players to see the full benefit.",
			"Compared with Dolby Vision 2 Max, this is the standard Dolby Vision capability used across many 2025 and 2026 models."
		]
	},
  {
    "id": "kb_auracast",
    "title": "Bluetooth Auracast",
    "tags": ["Auracast", "Bluetooth", "Audio", "Smart"],
    "summary": "A next-generation Bluetooth audio broadcasting technology available in 2025/2026 models.",
    "contentPoints": [
      "Allows the TV to broadcast audio to an unlimited number of nearby Auracast-compatible headphones or speakers simultaneously.",
      "Perfect for couples watching TV late at night with two separate pairs of headphones.",
      "Eliminates the traditional pairing process – users just 'tune in' to the TV's audio stream like a radio station."
    ]
  },
  {
    "id": "kb_matter_dash",
    "title": "MATTER Dash (Ambiscape)",
    "tags": ["MATTER Dash", "Ambiscape", "Matter", "Smart Home"],
		"filters": {
			"topics": ["MATTER Dash", "Matter", "Ambiscape"],
			"os": ["Titan OS"]
		},
    "summary": "The central smart home dashboard integrated into the TV, using the universal Matter protocol.",
    "contentPoints": [
      "Allows the TV to act as a control hub for smart home devices (lights, thermostats, locks) from any brand that supports Matter (Apple, Google, Amazon, Philips Hue).",
      "'Ambiscape' feature specifically integrates Ambilight with other smart lighting in the room to create a unified lighting environment.",
      "Accessible directly from the TV remote without interrupting the viewing experience."
    ]
  },
  {
    "id": "kb_easylink_plus",
    "title": "Easylink+",
    "tags": ["Easylink+", "Easylink", "HDMI-CEC"],
    "summary": "Philips' enhanced version of HDMI-CEC for seamless device control.",
    "contentPoints": [
      "Allows controlling connected devices (Soundbars, Blu-ray players, Consoles) using just the TV remote.",
      "The '+' version includes deeper UI integration – for example, adjusting Soundbar EQ settings directly on the TV screen.",
      "Ensures automatic power on/off sync between the TV and the connected audio system."
    ]
  },
  {
    "id": "kb_ai_art_aurora",
    "title": "AI Art (Aurora 3.0)",
    "tags": ["AI Art (Aurora 3.0)", "Aurora", "Screensaver"],
    "summary": "A smart screensaver mode that turns the TV into a digital canvas when not in use.",
    "contentPoints": [
      "Displays curated high-quality artwork, photography, or AI-generated images.",
      "Integrates with Ambilight to create a relaxing atmosphere in the room.",
      "Helps prevent screen burn-in on OLED panels by slowly shifting pixels and limiting brightness."
    ]
  },
  {
    "id": "kb_hdmi_vrr",
    "title": "HDMI-VRR (Variable Refresh Rate)",
    "tags": ["HDMI-VRR", "VRR", "Gaming"],
    "summary": "A crucial gaming feature that syncs the TV's refresh rate with the console/PC's frame rate.",
    "contentPoints": [
      "Eliminates screen tearing and stuttering during fast-paced games.",
      "Works natively with PlayStation 5 and Xbox Series X/S via HDMI 2.1.",
      "Operates smoothly within a wide range (e.g., 40Hz up to 144Hz or 165Hz depending on the panel)."
    ]
  },
  {
    "id": "kb_freesync_premium",
    "title": "FreeSync Premium",
    "tags": ["FreeSync Premium", "FreeSync", "Gaming"],
    "summary": "AMD's certified tier of variable refresh rate technology, ensuring top-tier gaming performance.",
    "contentPoints": [
      "Guarantees tear-free, low flicker, and low latency gaming.",
      "Includes Low Framerate Compensation (LFC) – if the game drops below the TV's minimum refresh rate, the TV will display frames multiple times to keep gameplay smooth.",
      "Highly recommended for PC gamers using AMD Radeon graphics cards."
    ]
  },
  {
    "id": "kb_dled_qd",
    "title": "DLED QD (Quantum Dot)",
    "tags": ["DLED QD", "DLED", "PanelType", "Quantum Dot"],
    "summary": "Direct LED backlighting combined with a Quantum Dot layer for enhanced color and brightness.",
    "contentPoints": [
      "DLED (Direct LED) means the LEDs are directly behind the screen, offering better contrast and uniformity than Edge-LED.",
      "QD (Quantum Dot) is a nanoparticle layer that dramatically increases the color gamut and peak brightness.",
      "Results in much richer reds and greens compared to standard LED TVs."
    ]
  }
];