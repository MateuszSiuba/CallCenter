const ChangelogEntriesData = [
  {
    id: "2026-04-20-v102",
    date: "20 Apr 2026",
    dateIso: "2026-04-20",
    version: "v1.0.2",
    title: "Dimensions: Faster Agent View",
    details: [
      "In TV Model Detail > Dimensions, the view now highlights the values most useful during customer calls.",
      "In Show full dimensions details, VESA screw info is shown as one ready-to-read line (for example: M6 10-16mm).",
      "Result: faster answers for mounting and fit questions without scanning extra fields."
    ]
  },
  {
    id: "2026-04-20-v101",
    date: "20 Apr 2026",
    dateIso: "2026-04-20",
    version: "v1.0.1",
    title: "2021 Models And Mounting Data Added",
    details: [
      "Added missing 2021 TV models, now available in Model Results and Global Search.",
      "Added mounting screw information for these models in TV Model Detail > Dimensions.",
      "Result: better first-contact support for installation and wall-mount questions on older models."
    ]
  },
  {
    id: "2026-04-17-v100",
    date: "17 Apr 2026",
    dateIso: "2026-04-17",
    version: "v1.0.0",
    title: "More Consistent Model Answers",
    details: [
      "Model information is now more consistent across Specs and Ports views.",
      "You can use one model detail page with higher confidence when answering compatibility questions.",
      "Result: fewer contradictory values during the same customer call."
    ]
  },
  {
    id: "2026-04-15-v094",
    date: "15 Apr 2026",
    dateIso: "2026-04-15",
    version: "v0.9.4",
    title: "Changelog Easier To Follow",
    details: [
      "Use the bell icon in the top bar to quickly check what changed.",
      "Updates are grouped as expandable entries, so you can scan only what is relevant.",
      "Result: faster pre-shift update check for agents."
    ]
  },
  {
    id: "2026-04-15-v093",
    date: "15 Apr 2026",
    dateIso: "2026-04-15",
    version: "v0.9.3",
    title: "Global Search Covers More Content",
    details: [
      "Global Omni-Search now finds TV models, knowledge content, and policy items from one search box.",
      "Results are grouped by type to help you jump to the right answer faster.",
      "Selecting a knowledge or policy result opens the relevant article view directly."
    ]
  },
  {
    id: "2026-04-14-v092",
    date: "14 Apr 2026",
    dateIso: "2026-04-14",
    version: "v0.9.2",
    title: "Model Detail Organized Into Clear Tabs",
    details: [
      "TV Model Detail is split into clear tabs: Specs, Ports, Troubleshooting, Policies, and Gallery.",
      "You can switch context without leaving the selected model.",
      "Result: smoother call handling when you need specs and troubleshooting in the same conversation."
    ]
  }
];

if (typeof window !== "undefined") {
  window.ChangelogEntriesData = ChangelogEntriesData;
}
