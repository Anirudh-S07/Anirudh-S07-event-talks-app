# BigQuery Release Insights Dashboard

A premium, interactive web application built with Python Flask and vanilla HTML, CSS, and JavaScript that fetches, parses, and displays Google Cloud BigQuery release notes. 

The dashboard enables real-time search, categorization filtering, and one-click sharing of individual updates to X (Twitter) with built-in character limit validation.

---

## ✨ Features

* 🔄 **Live RSS Integration**: Fetches and parses the live BigQuery release notes feed directly from Google Cloud.
* 🧩 **Granular Update Isolation**: Splits daily update logs into distinct, individual cards (e.g. separates Features, Issues, and Deprecations).
* ⚡ **Real-Time Client Search**: Search for specific terms, features, or dates instantly.
* 🏷️ **Type Filters**: Filter release notes using color-coded category badges (Features, Issues, Deprecations, Changes, General).
* 🐦 **Interactive Tweet Composer**: Click any card to load, preview, edit, and post a pre-formatted draft to X (Twitter) within the 280-character limit.
* 🎨 **Premium Glassmorphic UI**: Sleek dark-mode dashboard with hover effects, smooth transitions, skeleton loading, and an SVG character count progress ring.

---

## 📁 Directory Structure

```text
bq-release-notes/
├── app.py                  # Flask backend server (fetches and parses feed)
├── templates/
│   └── index.html          # Frontend page template
├── static/
│   ├── css/
│   │   └── style.css       # Custom styling (glassmorphic dark-theme)
│   └── js/
│       └── script.js       # Client state, rendering, search/filters, X integration
├── venv/                   # Python virtual environment
└── .gitignore              # Git ignore file
```

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites
* Python 3.10+ installed on your system.
* Active internet connection (to fetch the feed).

### Setup & Installation

1. **Navigate to the Project Directory**:
   ```bash
   cd D:\agy2-projects\agy-cli-projects\bq-release-notes
   ```

2. **Activate the Virtual Environment**:
   * On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\activate
     ```
   * On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies** (if installing manually on a new setup):
   ```bash
   pip install Flask requests beautifulsoup4
   ```

4. **Start the Flask Server**:
   ```bash
   python app.py
   ```

5. **Access the Dashboard**:
   Open your browser and navigate to:
   👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🛠️ How It Works

### Server Side (app.py)
* Requests the BigQuery feed from `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`.
* Converts the Atom feed XML to an object model.
* Uses **BeautifulSoup** to parse the CDATA HTML payload, splitting it by `<h3>` tags to isolate individual, categorizable release items.
* Exposes the endpoint `/api/release-notes` which serves this parsed dataset.

### Client Side (script.js)
* Fetches data from `/api/release-notes`.
* Manages search and category filtering in local state.
* Generates tweet templates for selected release items:
  `BigQuery Update (Date) | Type: [Truncated Text] [Link]`
* Updates an SVG-based circular progress ring representing character usage and disables posting if characters exceed the 280 limit.
* Invokes the Twitter Intent API in a new browser tab when the share button is clicked.
