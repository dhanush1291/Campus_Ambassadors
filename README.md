# Referral Document & Poster Generation Microservice 🚀

A high-performance Node.js and Express microservice dedicated to dynamically generating and streaming branded documents (**Certificates of Excellence**, **Multi-Section Offer Letters**, and **Social Ambassador Badges/Posters**) for student referral programs.

---

## 🛠️ Core Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **PDF Vector Generation:** `pdfkit` (Clean vector-based landscape certificates and multi-section portrait offer letters)
* **Image & Poster Manipulation:** `sharp` (High-definition pixel-level compositing on template graphics)
* **Security & Reliability:**
  * `Authorization: Bearer <API_SECRET_KEY>` custom middleware with timing-safe comparison
  * `cors` with domain restriction (`FRONTEND_URL`)
  * `express-rate-limit` (10 req/min default per client IP)
  * Input validation & sanitization (strict length boundaries <= 50 characters to prevent layout breaks)
  * Centralized global error handling

---

## 📂 Project Structure

```
/
├── package.json               # Dependencies & lifecycle scripts
├── .env.example               # Template environment configuration
├── .env                       # Local environment variables (git-ignored)
├── .gitignore                 # Files ignored in source control
├── README.md                  # Complete documentation and API guide
├── scripts/
│   ├── create-poster-template.js  # Script to generate the high-res 1080x1350 template
│   └── test-endpoints.js          # Automated end-to-end integration test runner
├── output/                    # Generated test files (PDFs, PNGs)
└── src/
    ├── config/
    │   └── index.js           # Central configuration loader
    ├── middleware/
    │   ├── auth.js            # Timing-safe Bearer API Key authentication
    │   ├── rateLimiter.js     # IP rate limiting middleware
    │   ├── validation.js      # Strict field validation & sanitization
    │   └── errorHandler.js    # 404 & global exception error handlers
    ├── controllers/
    │   ├── certificateController.js # Landscape A4 PDF certificate generator
    │   ├── offerLetterController.js # Multi-section portrait A4 PDF offer letter
    │   └── posterController.js      # Sharp SVG/PNG overlay composition
    ├── routes/
    │   ├── documentRoutes.js  # Document generation route definitions
    │   └── index.js           # API route root & health check
    ├── templates/
    │   └── ambassador-poster-template.png # 1080x1350 high-res base graphic
    ├── utils/
    │   └── helpers.js         # XML escaping, date formatting, reference hashing
    └── server.js              # Application entry point & graceful shutdown
```

---

## ⚙️ Quick Start

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your settings:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port on which the HTTP service listens |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `API_SECRET_KEY` | `super-secret-referral-api-key-2026` | Secret API key required for all `/api/*` document requests |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed frontend origin for CORS |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limiting rolling window in milliseconds |
| `RATE_LIMIT_MAX` | `10` | Max requests allowed per window per IP |
| `COMPANY_NAME` | `Nexus Campus Network` | Organization name rendered on documents |

### 3. Generate Template Graphic (Optional)
The pre-built template `src/templates/ambassador-poster-template.png` is included. If you want to rebuild it:
```bash
npm run generate:template
```

### 4. Running the Service
* **Development Mode (Auto-restart on change):**
  ```bash
  npm run dev
  ```
* **Production Mode:**
  ```bash
  npm start
  ```

---

## 🧪 Automated Testing

An automated end-to-end integration test runner is provided:
```bash
npm test
```
This tests:
1. Public health check (`GET /api/health`).
2. Authentication denial (missing header, invalid token -> `401 Unauthorized`).
3. Input validation (missing fields, payload > 50 characters -> `400 Bad Request`).
4. Certificate generation (`POST /api/generate-certificate` -> writes `output/sample-certificate.pdf`).
5. Offer letter generation (`POST /api/generate-offer-letter` -> writes `output/sample-offer-letter.pdf`).
6. Social poster generation (`POST /api/generate-poster` -> writes `output/sample-poster.png`).

---

## 📡 API Endpoints Documentation

All document generation endpoints require the following header:
```http
Authorization: Bearer <API_SECRET_KEY>
Content-Type: application/json
```

---

### 1. Generate Certificate
* **Endpoint:** `POST /api/generate-certificate`
* **Description:** Loads the custom landscape certificate template (`src/templates/certificate-template.png` or `.jpg`, 6250x4419) and renders the user's `name` centered under "Awarded to" and `date` at the bottom-right date line via PDFKit absolute coordinates.
* **Response:** Direct vector PDF download stream (`application/pdf`).

#### Required Inputs
* `name` (string, max 60 chars) - Recipient name
* `date` (string, max 50 chars) - Conferment date (e.g., "October 8, 2026")

#### Request Body
```json
{
  "name": "Sarah Connor",
  "date": "October 8, 2026"
}
```

#### cURL Example
```bash
curl -X POST http://localhost:5000/api/generate-certificate \
  -H "Authorization: Bearer super-secret-referral-api-key-2026" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sarah Connor", "date": "October 8, 2026"}' \
  --output certificate.pdf
```

---

### 2. Generate Offer Letter
* **Endpoint:** `POST /api/generate-offer-letter`
* **Description:** Builds the portrait A4 offer letter layout on letterhead (`src/templates/offer-letter-bg.png`), injecting `name` dynamically right after "Dear" (`Dear [Name],`), while preserving the official RGUKT Srikakulam / Plus Qiskit Fall Fest 2026 text block, role overview, and rewards.
* **Response:** Direct vector PDF download stream (`application/pdf`).

#### Required Inputs
* `name` (string, max 60 chars) - Appointed ambassador name

#### Request Body
```json
{
  "name": "Sarah Connor"
}
```

#### cURL Example
```bash
curl -X POST http://localhost:5000/api/generate-offer-letter \
  -H "Authorization: Bearer super-secret-referral-api-key-2026" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sarah Connor"}' \
  --output offer-letter.pdf
```

---

### 3. Generate Campus Ambassador Poster
* **Endpoint:** `POST /api/generate-poster`
* **Description:** Loads the high-resolution poster background template (`src/templates/poster-template.png`, 3375x4219) using `sharp` and composites SVG overlays: inserting `collegeName` cleanly into the placeholder right under "Campus Ambassador of..." and `referralLink` cleanly inside the white card at the bottom with theme colors and XML escaping.
* **Response:** Binary image stream (`image/png`).

#### Required Inputs
* `collegeName` (string, max 100 chars) - Institution name (e.g., "RGUKT - SRIKAKULAM")
* `referralLink` (string, max 150 chars) - Unique registration URL

#### Request Body
```json
{
  "collegeName": "RGUKT - SRIKAKULAM",
  "referralLink": "https://qffrguktsklm.in/ref/SARAH-2026"
}
```

#### cURL Example
```bash
curl -X POST http://localhost:5000/api/generate-poster \
  -H "Authorization: Bearer super-secret-referral-api-key-2026" \
  -H "Content-Type: application/json" \
  -d '{"collegeName": "RGUKT - SRIKAKULAM", "referralLink": "https://qffrguktsklm.in/ref/SARAH-2026"}' \
  --output ambassador-poster.png
```

---

### 4. Health Check
* **Endpoint:** `GET /api/health`
* **Access:** Public (no auth required)
* **Response:**
```json
{
  "status": "healthy",
  "service": "Referral Document Generation Microservice",
  "timestamp": "2026-10-07T15:55:00.000Z"
}
```

---

## 🔒 Security & Robustness Highlights

1. **Timing-Safe Authentication:** Avoids string comparison side-channel leaks using Node's native `crypto.timingSafeEqual` in `src/middleware/auth.js`.
2. **Strict Character & Input Validation:**
   - Every input string is checked for length (`<= 50` characters).
   - Sanitizes non-printable control characters.
   - All dynamic text mapped to SVG/Sharp overlays is XML-escaped to prevent SVG injection attacks and malformed render errors.
3. **CORS Control:** Restricts browser origin to `FRONTEND_URL` while permitting server-to-server microservice RPC calls.
4. **Rate Limiting:** Protects CPU-intensive PDF/image encoding from abuse with IP-based rate limiting via `express-rate-limit`.
5. **Memory-Efficient Streaming:** Documents are piped directly to the Express HTTP response stream without holding large unneeded buffers in memory.
6. **Graceful Shutdown:** Handles `SIGINT` and `SIGTERM` gracefully.

---

## 💻 Frontend Integration Example (JavaScript / React)

```javascript
async function downloadDocument(endpoint, payload, defaultFilename) {
  const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer super-secret-referral-api-key-2026'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Generation failed');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// Example usage:
// downloadDocument('generate-certificate', { name: 'Sarah Connor', referralCode: 'SARAH2026', level: 'Gold' }, 'certificate.pdf');
```

---

## 📄 License
MIT
