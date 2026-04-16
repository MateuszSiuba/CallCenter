const PoliciesData = [
  // --- ROCZNIK 2025 ---
  {
    "id": "policy_pixel_6000_2025",
    "policyName": "Pixel Defect Policy - 6000 Series (2025)",
    "matchTags": ["PHP6050", "PUS60", "PFS60"], 
    "validYears": [2025],
    "criteria": {
      "Single bright dot (>1/2 dot)": "N ≤ 0",
      "Two adjacent bright dot": "N ≤ 0",
      "Single dark dot (R/G/B)": "N ≤ 5",
      "Two adjacent dark dot": "N ≤ 1",
      "Three consecutive dark dots": "N ≤ 0",
      "Weak Bright Dot / Partial Dot": "N ≤ 8",
      "Total dots defects": "N ≤ 5"
    }
  },
  {
    "id": "policy_pixel_6900_2025",
    "policyName": "Pixel Defect Policy - 6900 Series (2025)",
    "matchTags": ["PHP6900", "PUS69", "PFS69"],
    "validYears": [2025],
    "criteria": {
      "Single bright dot (>1/2 dot)": "N ≤ 0",
      "Single dark dot (R/G/B)": "N ≤ 9",
      "Two adjacent dark dot": "N ≤ 2",
      "Total dots defects": "N ≤ 9"
    }
  },
  {
    "id": "policy_pixel_7000_2025",
    "policyName": "Pixel Defect Policy - 7000 Series (2025)",
    "matchTags": ["PHP7000", "PUS70", "PFS70"],
    "validYears": [2025],
    "criteria": {
      "Single bright dot (>1/2 dot)": "N ≤ 0",
      "Single dark dot (R/G/B)": "N ≤ 10",
      "Two adjacent dark dot": "N ≤ 2",
      "Three consecutive dark dots": "N ≤ 3",
      "Total dots defects": "N ≤ 10"
    }
  },

  // --- ROCZNIK 2024 ---
  {
    "id": "policy_pixel_oled_2024",
    "policyName": "Pixel Defect Policy - OLED (2024)",
    "matchTags": ["OLED7", "OLED8", "OLED9"], // Serie 7x9, 8x9, 9x9 [cite: 154, 155, 156]
    "validYears": [2024],
    "criteria": {
      "Single bright dot (>1/2 dot)": "N ≤ 0",
      "Two adjacent bright dot": "N ≤ 0",
      "Single dark dot (R/G/B)": "N ≤ 20 (42\"/48\" ≤ 30)",
      "Single dark dot (White)": "N ≤ 4",
      "Total dots defects": "N ≤ 20 (42\"/48\" ≤ 43)",
      "Distance between dot defects": "min ≥ 20mm"
    }
  },
  {
    "id": "policy_pixel_led_2024",
    "policyName": "Pixel Defect Policy - LED (2024)",
    "matchTags": ["PUS7", "PUS8"], // Serie 70x9 do 89x9 [cite: 202, 209]
    "validYears": [2024],
    "criteria": {
      "Single bright dot": "N ≤ 0",
      "Bright dot (≤1/2)": "N ≤ 12 (43\" ≤ 10)",
      "Single dark dot": "43\"-65\" N ≤ 12; 75\"-85\" N ≤ 15",
      "Two adjacent dark dots": "N ≤ 2 (65\"-85\" N ≤ 1)",
      "Total dots defects": "43\"-85\" N ≤ 12; 75\" N ≤ 15"
    }
  },
  {
    "id": "policy_pixel_pml_2024",
    "policyName": "Pixel Defect Policy - MiniLED (2024)",
    "matchTags": ["PML8", "PML9"], // Serie 87x9, 90x9 [cite: 265, 309]
    "validYears": [2024],
    "criteria": {
      "Single bright dot": "55\"-65\" N ≤ 0; 75\" N ≤ 1",
      "Single dark dot": "55\" N ≤ 12; 65\"-75\" N ≤ 15",
      "Total dots defects": "55\"-65\" N ≤ 12; 75\" N ≤ 15",
      "Two adjacent dark dots": "55\" N ≤ 2; 65\"-75\" N ≤ 1"
    }
  },

  // --- ROCZNIK 2023 ---
  {
    "id": "policy_pixel_led_2023",
    "policyName": "Pixel Defect Policy - LED (2023)",
    "matchTags": ["PUS6", "PUS7", "PUS8"], // Serie 68x8 do 88x8 [cite: 380, 385]
    "validYears": [2023],
    "criteria": {
      "Single bright dot": "N ≤ 0",
      "Single dark dot": "N ≤ 14 (24\"-32\" N ≤ 5)",
      "Two adjacent dark dots": "N ≤ 4 (24\"-43\" N ≤ 2)",
      "Total dots defects": "N ≤ 13 (24\"-32\" N ≤ 7)"
    }
  },

  // --- ROCZNIKI 2022, 2021, 2020 (Grupowane dla czytelności, bo mają bardzo podobne LEDy) ---
  {
    "id": "policy_pixel_led_2022",
    "policyName": "Pixel Defect Policy - LED (2022)",
    "matchTags": ["PUS5", "PUS6", "PUS7", "PUS8", "PUS9"], // Serie 55x7 do 95x7 [cite: 451, 459]
    "validYears": [2022],
    "criteria": {
      "Single bright dot": "N ≤ 0",
      "Single dark dot": "N ≤ 13 (24\" N ≤ 4)",
      "Two adjacent dark dots": "N ≤ 4 (24\" N ≤ 1)",
      "Total dots defects": "N ≤ 12"
    }
  },
  {
    "id": "policy_pixel_led_2021",
    "policyName": "Pixel Defect Policy - LED (2021)",
    "matchTags": ["PUS7", "PUS8", "PUS9"], // Serie 74x6 do 92x6 [cite: 479, 487]
    "validYears": [2021],
    "criteria": {
      "Single bright dot": "N ≤ 0",
      "Single dark dot": "N ≤ 12",
      "Two adjacent dark dots": "N ≤ 5",
      "Total dots defects": "N ≤ 12"
    }
  },
  {
    "id": "policy_pixel_pml_2021",
    "policyName": "Pixel Defect Policy - MiniLED (2021)",
    "matchTags": ["PML9636", "PML6506"], // [cite: 507]
    "validYears": [2021],
    "criteria": {
      "Single bright dot": "N ≤ 2",
      "Single dark dot": "N ≤ 10 (75\" N ≤ 15)",
      "Total dots defects": "N ≤ 10"
    }
  },
  {
    "id": "policy_pixel_led_2020",
    "policyName": "Pixel Defect Policy - LED (2020)",
    "matchTags": ["PUS5", "PUS6", "PUS7", "PUS8", "PUS9"], // Serie 55x5 do 94x5 [cite: 528, 537]
    "validYears": [2020],
    "criteria": {
      "Single bright dot": "N ≤ 2",
      "Single dark dot": "N ≤ 10",
      "Two adjacent dark dots": "N ≤ 2",
      "Total dots defects": "N ≤ 12"
    }
  },

  // --- STARSZE MODELE OLED (2018 - 2023) ---
  {
    "id": "policy_pixel_oled_legacy",
    "policyName": "Pixel Defect Policy - General OLED (2018-2023)",
    "matchTags": ["OLED"], // Obejmuje OLED 901F, 9002, 7x4-8x8 itd. [cite: 176, 177, 180, 181]
    "validYears": [2018, 2019, 2020, 2021, 2022, 2023],
    "criteria": {
      "Single bright dot (>1/2 dot)": "N ≤ 0",
      "Single dark dot (R/G/B)": "N ≤ 20 (48\" ≤ 30)",
      "Single dark dot (White)": "N ≤ 4 (48\" ≤ 6)",
      "Two adjacent dark dots": "N ≤ 4 (48\" ≤ 15)",
      "Total dots defects": "N ≤ 20 (48\" ≤ 43)",
      "Distance between dot defects": "min ≥ 20mm"
    }
  },

  // --- ZABYTKI (Legacy <= 2019) ---
  {
    "id": "policy_pixel_led_2019",
    "policyName": "Pixel Defect Policy - LED (2019)",
    "matchTags": ["PUS4", "PUS5", "PUS6", "PUS7", "PUS8", "PUS9"], // Serie 40x4 do 91x4 [cite: 556, 566]
    "validYears": [2019],
    "criteria": {
      "Single bright dot": "N ≤ 2",
      "Single dark dot": "N ≤ 10",
      "Total dots defects": "N ≤ 12"
    }
  },
  {
    "id": "policy_pixel_led_2018",
    "policyName": "Pixel Defect Policy - LED (2018)",
    "matchTags": ["PUS4", "PUS5", "PUS6", "PUS7", "PUS8"], // Serie 42x3 do 85x3 [cite: 603, 618]
    "validYears": [2018],
    "criteria": {
      "Single bright dot": "N ≤ 2",
      "Single dark dot": "N ≤ 10",
      "Total dots defects": "N ≤ 12"
    }
  },
  {
    "id": "policy_pixel_high_range_2017",
    "policyName": "Pixel Defect Policy - High Range (<=2017)",
    "matchTags": ["PUS7", "PUS8", "PUS9"], // Serie 7000, 8000, 9000 [cite: 635, 637, 638]
    "validYears": [2014, 2015, 2016, 2017],
    "criteria": {
      "Single bright dot": "N ≤ 0",
      "Single dark dot": "N ≤ 8",
      "Total dots defects": "N ≤ 10"
    }
  },
  {
    "id": "policy_pixel_mid_low_range_2017",
    "policyName": "Pixel Defect Policy - Mid/Low Range (<=2017)",
    "matchTags": ["PUS3", "PUS4", "PUS5", "PUS6"], // Serie 3000 do 6000 [cite: 655, 674]
    "validYears": [2014, 2015, 2016, 2017],
    "criteria": {
      "Single bright dot": "N ≤ 1",
      "Single dark dot": "N ≤ 10",
      "Total dots defects": "N ≤ 12"
    }
  }
];