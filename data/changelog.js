const ChangelogEntriesData = [
  {
    id: "2026-04-20-v102",
    date: "20 Apr 2026",
    dateIso: "2026-04-20",
    version: "v1.0.2",
    title: "Dimensions View Cleanup",
    details: [
      "Dimensions card: removed the Packaged row from the summary panel.",
      "Dimensions full view: removed Stand Screw Part and Screw Data Source rows.",
      "VESA screw fields merged into one line, e.g. M6 10-16mm."
    ]
  },
  {
    id: "2026-04-20-v101",
    date: "20 Apr 2026",
    dateIso: "2026-04-20",
    version: "v1.0.1",
    title: "2K21 Screws And Models Import",
    details: [
      "Imported 2021 sheet data (rows 4-76) from TV screw dimensions workbook.",
      "Added missing TV models from the sheet and attached mounting screw metadata.",
      "Skipped rows with Chinese characters per import rule."
    ]
  },
  {
    id: "2026-04-17-v100",
    date: "17 Apr 2026",
    dateIso: "2026-04-17",
    version: "v1.0.0",
    title: "Data Unification And Quality Baseline",
    details: [
      "Consolidated ports data to models.js as the single source.",
      "Added quality scripts: normalize, validate, language audit, and combined check.",
      "Cleaned temporary artifacts and removed obsolete helper files."
    ]
  },
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
  },
  {
    id: "2026-04-15-v093",
    date: "15 Apr 2026",
    dateIso: "2026-04-15",
    version: "v0.9.3",
    title: "Omni-Search Expansion",
    details: [
      "Search Index: Added support for ModelsData, KnowledgeBaseData, and PoliciesData.",
      "Search UI: Added categorized dropdown (TV Models, Knowledge Base, Contacts and Policies).",
      "Renderer: Added article/policy view mode when non-model results are selected."
    ]
  },
  {
    id: "2026-04-14-v092",
    date: "14 Apr 2026",
    dateIso: "2026-04-14",
    version: "v0.9.2",
    title: "Detail View Cognitive Load Reduction",
    details: [
      "Detail View: Split content into strict single-pane tabs.",
      "Tabs Added: Troubleshooting, Policies, and Gallery placeholders.",
      "Layout: Hides generic model results when a specific model detail is opened."
    ]
  }
];

if (typeof window !== "undefined") {
  window.ChangelogEntriesData = ChangelogEntriesData;
}
