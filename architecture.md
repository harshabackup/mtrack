============================================================
PRIVATE MARRIAGE PROPOSAL MANAGEMENT WEB APP
FULL END-TO-END ARCHITECTURE
============================================================

PROJECT PURPOSE
----------------

Build a private personal web application accessible only by the
owner.

The application is used to store, organize, search, review and
compare Indian marriage proposals.

Each proposal can contain:

- Personal information
- Girl's photos
- Family information
- Education
- Career
- Contact information
- Lifestyle information
- Indian astrology / Kundali information
- Horoscope images
- Horoscope PDFs
- Biodata PDFs
- Other documents
- Personal notes
- Tags
- Proposal status
- Compatibility / matching information

The application must support uploading images and PDFs and
automatically extracting information from them using OCR/document
processing.

IMPORTANT:

OCR/AI extracted information must NEVER directly overwrite the
database.

The flow must always be:

UPLOAD
  ↓
PROCESS
  ↓
EXTRACT
  ↓
SHOW DETECTED DATA
  ↓
USER REVIEWS
  ↓
USER CORRECTS IF REQUIRED
  ↓
SAVE


============================================================
1. TECHNOLOGY STACK
============================================================

FRONTEND
--------

React
TypeScript
Vite
React Router
Axios
Bootstrap 5
Custom CSS

Do NOT use:

- Tailwind
- Material UI
- Ant Design
- Chakra UI
- shadcn
- heavy UI frameworks

Bootstrap should handle basic layout/components.

Custom CSS should handle the application's actual visual design.


BACKEND
-------

Python
FastAPI
Pydantic
SQLAlchemy
Alembic
JWT Authentication
Argon2 or bcrypt password hashing


DATABASE
--------

PostgreSQL


FILE STORAGE
------------

Initial:

Local private storage

Future:

- Supabase Storage
- Cloudflare R2
- AWS S3
- MinIO


DOCUMENT PROCESSING
-------------------

Images:

PaddleOCR or Tesseract

PDF:

PyMuPDF

Scanned PDF:

PDF → Image → OCR


IMAGE PROCESSING
----------------

Pillow


OPTIONAL BACKGROUND PROCESSING
------------------------------

For initial version:

FastAPI BackgroundTasks

Future if processing grows:

Redis
Celery


DEPLOYMENT
----------

Docker
Docker Compose
Nginx
HTTPS


============================================================
2. HIGH LEVEL ARCHITECTURE
============================================================

                         INTERNET
                            |
                          HTTPS
                            |
                            v
                    +---------------+
                    |     NGINX     |
                    | Reverse Proxy |
                    | SSL / HTTPS   |
                    +-------+-------+
                            |
              +-------------+-------------+
              |                           |
              v                           v
       +-------------+             +-------------+
       |    REACT    |             |   FASTAPI   |
       |  FRONTEND   |<----------->|   BACKEND   |
       |             |    REST     |             |
       +-------------+     API     +------+------+
                                           |
                  +------------------------+------------------+
                  |                        |                  |
                  v                        v                  v
           +-------------+          +-------------+    +-------------+
           | PostgreSQL  |          |File Storage |    | OCR Worker  |
           |             |          |             |    |             |
           | Proposal    |          | Photos      |    | OCR         |
           | Astrology   |          | PDFs        |    | PDF Parser  |
           | Family      |          | Documents   |    | Extraction  |
           | Notes       |          |             |    |             |
           +-------------+          +-------------+    +------+------+
                                                            |
                                                            v
                                                    +---------------+
                                                    | Extracted Data|
                                                    |               |
                                                    | Name          |
                                                    | DOB           |
                                                    | Birth Time    |
                                                    | Birth Place   |
                                                    | Rashi         |
                                                    | Nakshatra     |
                                                    | Lagna         |
                                                    | etc.          |
                                                    +-------+-------+
                                                            |
                                                            v
                                                    USER REVIEW
                                                            |
                                                            v
                                                     SAVE TO DB


============================================================
3. APPLICATION MODULES
============================================================

1. Authentication
2. Dashboard
3. Proposal Management
4. Personal Information
5. Family Information
6. Education & Career
7. Astrology / Kundali
8. Photos
9. Documents
10. OCR Processing
11. Search
12. Filters
13. Tags
14. Notes
15. Status Management
16. Proposal Comparison
17. Compatibility / Matching
18. Settings
19. Backup
20. Audit Logging


============================================================
4. FRONTEND ARCHITECTURE
============================================================

frontend/

├── public/
│
├── src/
│
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── pages/
│   │   │
│   │   ├── Login/
│   │   │   └── Login.tsx
│   │   │
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── Proposals/
│   │   │   ├── Proposals.tsx
│   │   │   └── ProposalList.tsx
│   │   │
│   │   ├── AddProposal/
│   │   │   └── AddProposal.tsx
│   │   │
│   │   ├── ProposalDetails/
│   │   │   └── ProposalDetails.tsx
│   │   │
│   │   ├── Compare/
│   │   │   └── CompareProposals.tsx
│   │   │
│   │   └── Settings/
│   │       └── Settings.tsx
│   │
│   ├── components/
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── proposals/
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── ProposalTable.tsx
│   │   │   ├── ProposalForm.tsx
│   │   │   ├── ProposalHeader.tsx
│   │   │   └── ProposalStatus.tsx
│   │   │
│   │   ├── astrology/
│   │   │   ├── AstrologyForm.tsx
│   │   │   ├── PlanetTable.tsx
│   │   │   ├── HouseTable.tsx
│   │   │   ├── DoshaSection.tsx
│   │   │   ├── PanchangaSection.tsx
│   │   │   └── KundaliPreview.tsx
│   │   │
│   │   ├── files/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── PdfViewer.tsx
│   │   │   └── FilePreview.tsx
│   │   │
│   │   ├── ocr/
│   │   │   ├── OCRProcessing.tsx
│   │   │   ├── OCRResult.tsx
│   │   │   └── ExtractedFields.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── SortDropdown.tsx
│   │   │
│   │   └── common/
│   │       ├── Modal.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── Loading.tsx
│   │       ├── EmptyState.tsx
│   │       └── Toast.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── authApi.ts
│   │   ├── proposalApi.ts
│   │   ├── fileApi.ts
│   │   ├── astrologyApi.ts
│   │   ├── searchApi.ts
│   │   └── dashboardApi.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProposals.ts
│   │   ├── useProposal.ts
│   │   ├── useFiles.ts
│   │   ├── useOCR.ts
│   │   └── useSearch.ts
│   │
│   ├── types/
│   │   ├── proposal.ts
│   │   ├── astrology.ts
│   │   ├── file.ts
│   │   └── user.ts
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   │
│   └── styles/
│       ├── global.css
│       ├── layout.css
│       ├── dashboard.css
│       ├── proposal.css
│       ├── astrology.css
│       ├── forms.css
│       └── responsive.css
│
├── index.html
├── package.json
└── vite.config.ts


============================================================
5. BACKEND ARCHITECTURE
============================================================

backend/

├── app/
│
│   ├── main.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── proposals.py
│   │   ├── astrology.py
│   │   ├── files.py
│   │   ├── ocr.py
│   │   ├── search.py
│   │   ├── tags.py
│   │   ├── notes.py
│   │   └── matching.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── proposal.py
│   │   ├── astrology.py
│   │   ├── planet.py
│   │   ├── house.py
│   │   ├── file.py
│   │   ├── note.py
│   │   ├── tag.py
│   │   ├── match.py
│   │   └── audit.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── proposal.py
│   │   ├── astrology.py
│   │   ├── file.py
│   │   ├── ocr.py
│   │   └── matching.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── proposal_service.py
│   │   ├── astrology_service.py
│   │   ├── file_service.py
│   │   ├── ocr_service.py
│   │   ├── search_service.py
│   │   ├── matching_service.py
│   │   └── backup_service.py
│   │
│   ├── processors/
│   │   ├── image_processor.py
│   │   ├── pdf_processor.py
│   │   ├── ocr_processor.py
│   │   └── astrology_extractor.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── logging.py
│   │
│   ├── db/
│   │   ├── session.py
│   │   └── migrations/
│   │
│   └── workers/
│       └── document_worker.py
│
├── tests/
├── requirements.txt
├── Dockerfile
└── alembic.ini


============================================================
6. MAIN APPLICATION SCREENS
============================================================

LOGIN
-----

Only one account.

Fields:

Email / Username
Password

No public registration.

After successful login:

LOGIN
  ↓
DASHBOARD


============================================================
7. DASHBOARD
============================================================

Dashboard should show:

Total Proposals
New
Reviewing
Shortlisted
Contacted
Discussion
Final
Rejected

Example:

+------------------------------------------------------+
| Marriage Proposal Vault                              |
+------------------------------------------------------+
|                                                      |
|  Total       New       Reviewing       Shortlisted   |
|    48         7            9               12        |
|                                                      |
+------------------------------------------------------+
| Search proposals...                     [ + Add ]   |
+------------------------------------------------------+
|                                                      |
| Recent Proposals                                     |
|                                                      |
| Photo | Name | Age | City | Rashi | Status          |
|                                                      |
+------------------------------------------------------+


============================================================
8. PROPOSAL DATA STRUCTURE
============================================================

Each proposal contains:

PROPOSAL
|
├── Personal Details
├── Family Details
├── Education
├── Career
├── Lifestyle
├── Astrology
├── Marriage Preferences
├── Photos
├── Documents
├── Notes
├── Tags
└── Status


============================================================
9. PERSONAL DETAILS
============================================================

name
date_of_birth
time_of_birth
place_of_birth
age
gender
height
weight
mother_tongue
native_place
current_city
current_country
marital_status

Optional:

complexion
diet
smoking
drinking
hobbies
interests
about


============================================================
10. EDUCATION
============================================================

highest_education
degree
specialization
college
university
graduation_year


============================================================
11. CAREER
============================================================

occupation
job_title
company
industry
work_location
experience
annual_income
employment_type


============================================================
12. FAMILY DETAILS
============================================================

father_name
father_occupation

mother_name
mother_occupation

brothers_count
sisters_count

siblings_details

family_location
family_type
family_background

additional_family_notes


============================================================
13. CONTACT DETAILS
============================================================

contact_person
phone
alternate_phone
email
relationship_to_proposal
contact_notes


IMPORTANT:

Contact details should not be publicly exposed.

They are accessible only after authentication.


============================================================
14. LIFESTYLE
============================================================

diet
smoking
drinking
hobbies
interests
sports
travel
languages
personality_notes


============================================================
15. ASTROLOGY / KUNDALI
============================================================

Astrology should be a separate domain/module.

BIRTH INFORMATION
-----------------

date_of_birth
time_of_birth
birth_place
birth_latitude
birth_longitude
birth_timezone


PANCHANGA
---------

tithi
paksha
nakshatra
nakshatra_lord
nakshatra_pada
yoga
karana


RASHI
-----

rashi
rashi_lord


LAGNA
-----

lagna
lagna_lord


DOSHA
-----

manglik_status
manglik_type
manglik_notes

nadi
gana
yoni
varna
vashya
rajju
bhakoot


============================================================
16. PLANETARY POSITIONS
============================================================

Do NOT create:

sun_degree
moon_degree
mars_degree
etc.

Instead create a separate planetary_positions table.

Each record:

planet
sign
degree
house
nakshatra
pada
retrograde
combust


Example:

Planet    : Mars
Sign      : Scorpio
Degree    : 18.42
House     : 5
Nakshatra : Jyeshtha
Pada      : 2
Retrograde: No
Combust   : No


Planets:

Sun
Moon
Mars
Mercury
Jupiter
Venus
Saturn
Rahu
Ketu


============================================================
17. HOUSES
============================================================

Create separate house records.

12 houses:

1
2
3
4
5
6
7
8
9
10
11
12


Each house:

house_number
sign
house_lord
planets_present


Example:

House:
7

Sign:
Capricorn

House Lord:
Saturn

Planets:
Venus


============================================================
18. ASHTAKOOTA
============================================================

Store compatibility information separately.

Ashtakoota:

Varna
Vashya
Tara
Yoni
Graha Maitri
Gana
Bhakoot
Nadi

Store:

obtained_score
maximum_score

Also:

total_score
maximum_score


============================================================
19. PROPOSAL MATCHING
============================================================

Never store matching directly inside a proposal.

Use:

proposal_matches

Example:

Proposal A
    |
    |
    +------ proposal_matches ------+
                                   |
Proposal B ------------------------+

Match record:

proposal_1_id
proposal_2_id

guna_score
maximum_guna

varna_score
vashya_score
tara_score
yoni_score
graha_maitri_score
gana_score
bhakoot_score
nadi_score

manglik_result
nadi_result
bhakoot_result

matching_notes

created_at


============================================================
20. PHOTOS
============================================================

A proposal can contain multiple photos.

Example:

proposal/
    photos/
        profile.jpg
        photo_2.jpg
        photo_3.jpg
        family.jpg


Database stores:

file_id
proposal_id
filename
storage_path
mime_type
file_size
is_primary
created_at


Actual image is NOT stored inside PostgreSQL.

Only metadata is stored in PostgreSQL.


============================================================
21. DOCUMENTS
============================================================

Supported:

PDF
JPG
JPEG
PNG
WEBP

Possible documents:

Biodata
Horoscope
Kundali
Family details
Education documents
Screenshots
Other documents


Example:

proposal/
    documents/
        biodata.pdf
        horoscope.pdf
        horoscope.jpg
        family.pdf


============================================================
22. FILE STORAGE
============================================================

Use private storage.

Example:

storage/

├── proposals/
│
│   ├── 8d2a.../
│   │   ├── photos/
│   │   │   ├── profile.webp
│   │   │   ├── photo2.webp
│   │   │   └── family.webp
│   │   │
│   │   └── documents/
│   │       ├── biodata.pdf
│   │       └── horoscope.pdf
│   │
│   └── 4fa1.../
│       ├── photos/
│       └── documents/


Do NOT expose this directory directly through Nginx.


============================================================
23. FILE ACCESS
============================================================

React requests:

GET /api/files/{file_id}

FastAPI:

1. Validate JWT
2. Validate file exists
3. Validate owner
4. Return file


Flow:

React
  ↓
GET /api/files/123
  ↓
FastAPI
  ↓
Authentication
  ↓
Authorization
  ↓
File Storage
  ↓
Response


============================================================
24. OCR ARCHITECTURE
============================================================

User uploads:

horoscope.pdf

          ↓

FastAPI
          ↓
Save original file
          ↓
Create OCR Job
          ↓
Document Processor
          ↓
Detect PDF type
          |
          +----------------------+
          |                      |
          v                      v
Text PDF                    Scanned PDF
          |                      |
          v                      v
PyMuPDF                    PDF → Images
                                 |
                                 v
                                OCR
                                 |
                                 +-----------+
                                             |
                                             v
                                      Extracted Text
                                             |
                                             v
                                      Astrology Parser
                                             |
                                             v
                                      Structured Data
                                             |
                                             v
                                      Review Screen
                                             |
                                             v
                                         User Save


============================================================
25. OCR IMAGE PROCESSING
============================================================

Image:

horoscope.jpg

        ↓

Image Validation

        ↓

Image Processing

        ↓

OCR

        ↓

Raw Text

        ↓

Field Detection

        ↓

Structured Data


Example extracted:

Name:
Anusha Reddy

Date of Birth:
14-06-1998

Time:
08:42 AM

Place:
Hyderabad

Rashi:
Vrishabha

Nakshatra:
Rohini

Pada:
2

Lagna:
Karka


============================================================
26. OCR REVIEW SCREEN
============================================================

Never automatically save OCR results.

Display:

+------------------------------------------------+
| DETECTED INFORMATION                           |
+------------------------------------------------+
|                                                |
| Name                                           |
| [ Anusha Reddy                              ]  |
|                                                |
| Date of Birth                                  |
| [ 14-06-1998                                ]  |
|                                                |
| Birth Time                                     |
| [ 08:42 AM                                  ]  |
|                                                |
| Birth Place                                    |
| [ Hyderabad                                 ]  |
|                                                |
| Rashi                                          |
| [ Vrishabha                                  ]  |
|                                                |
| Nakshatra                                      |
| [ Rohini                                     ]  |
|                                                |
| Manglik                                        |
| [ No                                         ] |
|                                                |
+------------------------------------------------+
| [ Discard ]                  [ Save Details ] |
+------------------------------------------------+


============================================================
27. PROPOSAL STATUS
============================================================

Use:

NEW
REVIEWING
SHORTLISTED
CONTACTED
DISCUSSION
FINAL
REJECTED


Flow:

NEW
 ↓
REVIEWING
 ↓
SHORTLISTED
 ↓
CONTACTED
 ↓
DISCUSSION
 ↓
FINAL

At any stage:

REJECTED


============================================================
28. TAGS
============================================================

Create reusable tags.

Examples:

Hyderabad
Bangalore
Software Engineer
Doctor
MBA
B.Tech
Shortlisted
Family Contacted
Horoscope Received
Need Discussion


Tables:

tags

id
name


proposal_tags

proposal_id
tag_id


============================================================
29. NOTES
============================================================

Notes should be separate records.

proposal_notes:

id
proposal_id
note
created_at
updated_at


Example:

"Family contacted on 14 Aug."

"Need to discuss horoscope."

"Good family background."

"Waiting for additional photos."


============================================================
30. SEARCH
============================================================

Search across:

Name
Location
Age
Education
Occupation
Company
Rashi
Nakshatra
Lagna
Status
Tags


Example:

"Hyderabad MBA"


Advanced filter:

Age:
25 - 28

City:
Hyderabad

Education:
MBA

Profession:
Software Engineer

Rashi:
Taurus

Status:
Shortlisted


Use PostgreSQL search.

DO NOT introduce Elasticsearch for this personal application.


============================================================
31. PROPOSAL LIST
============================================================

Desktop:

+---------------------------------------------------------------+
| Search proposals...                           + Add Proposal  |
+---------------------------------------------------------------+
| Filters                                                       |
+---------------------------------------------------------------+
| Photo | Name | Age | City | Education | Rashi | Status       |
+---------------------------------------------------------------+
|       |      |     |      |           |       |              |
|       |      |     |      |           |       |              |
+---------------------------------------------------------------+


Mobile:

Use Bootstrap responsive cards.


============================================================
32. PROPOSAL DETAIL PAGE
============================================================

+---------------------------------------------------------------+
| < Back                              Edit     Delete            |
+---------------------------------------------------------------+
|                                                               |
| [ Main Photo ]       Anusha Reddy                             |
|                     26 • Hyderabad                            |
|                     Software Engineer                         |
|                                                               |
|                     [ SHORTLISTED ]                           |
|                                                               |
+---------------------------------------------------------------+
| Personal | Family | Career | Astrology | Files | Notes        |
+---------------------------------------------------------------+


PERSONAL TAB

Name
Age
DOB
Birth Time
Birth Place
Height
Location
Mother Tongue
etc.


FAMILY TAB

Father
Mother
Siblings
Family Background
etc.


CAREER TAB

Education
Occupation
Company
Income
etc.


ASTROLOGY TAB

Rashi
Nakshatra
Pada
Lagna
Panchanga
Dosha
Planetary Positions
Houses


FILES TAB

Photos
PDFs
Documents


NOTES TAB

Personal notes
Discussion notes
Contact notes


============================================================
33. DATABASE TABLES
============================================================

users

id
email
password_hash
created_at
updated_at


proposals

id
name
date_of_birth
time_of_birth
place_of_birth
age
gender
height
weight
mother_tongue
native_place
current_city
current_country
marital_status
status
created_at
updated_at


proposal_education

id
proposal_id
highest_education
degree
specialization
college
university
graduation_year


proposal_career

id
proposal_id
occupation
job_title
company
industry
work_location
experience
annual_income
employment_type


proposal_family

id
proposal_id
father_name
father_occupation
mother_name
mother_occupation
brothers_count
sisters_count
siblings_details
family_location
family_type
family_background
notes


proposal_contact

id
proposal_id
contact_person
phone
alternate_phone
email
relationship
notes


proposal_lifestyle

id
proposal_id
diet
smoking
drinking
hobbies
interests
sports
travel
languages
notes


proposal_astrology

id
proposal_id

birth_date
birth_time
birth_place
latitude
longitude
timezone

rashi
rashi_lord

nakshatra
nakshatra_lord
nakshatra_pada

lagna
lagna_lord

tithi
paksha
yoga
karana

manglik_status
manglik_type
manglik_notes

nadi
gana
yoni
varna
vashya
rajju
bhakoot


planetary_positions

id
astrology_id
planet
sign
degree
house
nakshatra
pada
retrograde
combust


astrology_houses

id
astrology_id
house_number
sign
house_lord
planets_present


proposal_files

id
proposal_id
filename
storage_path
mime_type
file_size
file_type
is_primary
ocr_status
ocr_text
created_at
updated_at


ocr_jobs

id
file_id
status
processor
raw_text
error_message
started_at
completed_at


proposal_notes

id
proposal_id
note
created_at
updated_at


tags

id
name


proposal_tags

proposal_id
tag_id


proposal_matches

id
proposal_1_id
proposal_2_id

guna_score
maximum_guna

varna_score
vashya_score
tara_score
yoni_score
graha_maitri_score
gana_score
bhakoot_score
nadi_score

manglik_result
nadi_result
bhakoot_result

notes
created_at


audit_logs

id
user_id
action
entity_type
entity_id
metadata
created_at


============================================================
34. DATABASE RELATIONSHIP
============================================================

users
  |
  | 1:N
  v
proposals
  |
  +------------------ proposal_education
  |
  +------------------ proposal_career
  |
  +------------------ proposal_family
  |
  +------------------ proposal_contact
  |
  +------------------ proposal_lifestyle
  |
  +------------------ proposal_astrology
  |                         |
  |                         +--- planetary_positions
  |                         |
  |                         +--- astrology_houses
  |
  +------------------ proposal_files
  |                         |
  |                         +--- ocr_jobs
  |
  +------------------ proposal_notes
  |
  +------------------ proposal_tags
                              |
                              v
                             tags


proposals
    |
    +------ proposal_matches ------+
                                   |
                              proposals


============================================================
35. API STRUCTURE
============================================================

AUTH

POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me


DASHBOARD

GET    /api/dashboard/stats


PROPOSALS

GET    /api/proposals
POST   /api/proposals

GET    /api/proposals/{id}
PUT    /api/proposals/{id}
DELETE /api/proposals/{id}

PATCH  /api/proposals/{id}/status


PERSONAL

GET    /api/proposals/{id}/personal
PUT    /api/proposals/{id}/personal


FAMILY

GET    /api/proposals/{id}/family
PUT    /api/proposals/{id}/family


EDUCATION

GET    /api/proposals/{id}/education
PUT    /api/proposals/{id}/education


CAREER

GET    /api/proposals/{id}/career
PUT    /api/proposals/{id}/career


LIFESTYLE

GET    /api/proposals/{id}/lifestyle
PUT    /api/proposals/{id}/lifestyle


ASTROLOGY

GET    /api/proposals/{id}/astrology
PUT    /api/proposals/{id}/astrology

GET    /api/proposals/{id}/astrology/planets
PUT    /api/proposals/{id}/astrology/planets

GET    /api/proposals/{id}/astrology/houses
PUT    /api/proposals/{id}/astrology/houses


FILES

POST   /api/proposals/{id}/files
GET    /api/proposals/{id}/files

GET    /api/files/{id}
DELETE /api/files/{id}


OCR

POST   /api/files/{id}/process
GET    /api/files/{id}/ocr


SEARCH

GET    /api/search?q=...


TAGS

GET    /api/tags
POST   /api/tags
DELETE /api/tags/{id}


NOTES

GET    /api/proposals/{id}/notes
POST   /api/proposals/{id}/notes
PUT    /api/notes/{id}
DELETE /api/notes/{id}


MATCHING

POST   /api/matches
GET    /api/matches/{id}
DELETE /api/matches/{id}


============================================================
36. API REQUEST FLOW
============================================================

React:

POST /api/proposals

        ↓

FastAPI Router

        ↓

Pydantic Validation

        ↓

Proposal Service

        ↓

SQLAlchemy

        ↓

PostgreSQL

        ↓

Response

        ↓

React


============================================================
37. FILE UPLOAD FLOW
============================================================

React
  |
  | multipart/form-data
  v
FastAPI
  |
  +--> Validate MIME
  |
  +--> Validate extension
  |
  +--> Validate size
  |
  +--> Generate UUID
  |
  +--> Store file
  |
  +--> Create proposal_files record
  |
  +--> Create OCR job
  |
  v
Response

{
    file_id,
    status: "PROCESSING"
}


============================================================
38. OCR STATUS
============================================================

PENDING
PROCESSING
COMPLETED
FAILED
REVIEW_REQUIRED


Example:

Upload:

PROCESSING

Then:

COMPLETED

Then:

REVIEW_REQUIRED

After user confirms:

CONFIRMED


============================================================
39. SECURITY
============================================================

This application contains highly private personal information.

Security is mandatory.

Authentication:

JWT

Password:

Argon2 or bcrypt

HTTPS:

Required

Database:

Private network only

Storage:

Private

API:

Authenticated

File downloads:

Authenticated


NEVER:

- Store plaintext passwords
- Expose PostgreSQL publicly
- Expose uploaded files publicly
- Put secret keys in frontend
- Commit .env to Git
- Trust file extension alone
- Automatically trust OCR results


============================================================
40. ENVIRONMENT VARIABLES
============================================================

Backend .env:

DATABASE_URL=postgresql://...
SECRET_KEY=...
JWT_EXPIRE_MINUTES=...
STORAGE_PATH=...
MAX_FILE_SIZE=...
OCR_ENGINE=...
ENVIRONMENT=production


Frontend:

VITE_API_URL=https://your-domain/api


Never expose:

DATABASE_URL
SECRET_KEY
JWT secret

to React.


============================================================
41. IMAGE PROCESSING
============================================================

Original image:

Keep original.

Generate:

thumbnail
display version

Example:

original.jpg
thumbnail.webp
display.webp


The UI uses display.webp.

The original is retained for future use.


============================================================
42. PDF PROCESSING
============================================================

PDF type 1:

Text PDF

PDF
 ↓
PyMuPDF
 ↓
Extract text


PDF type 2:

Scanned PDF

PDF
 ↓
Render pages
 ↓
OCR
 ↓
Extract text


Both ultimately produce:

raw_text


============================================================
43. ASTROLOGY EXTRACTION
============================================================

Raw document:

"Name: Anusha Reddy
Date of Birth: 14 June 1998
Time: 08:42 AM
Place: Hyderabad
Rashi: Vrishabha
Nakshatra: Rohini
Pada: 2
Lagna: Karka
Manglik: No"


Extraction:

{
    name: "Anusha Reddy",
    date_of_birth: "1998-06-14",
    time_of_birth: "08:42",
    place_of_birth: "Hyderabad",
    rashi: "Vrishabha",
    nakshatra: "Rohini",
    pada: 2,
    lagna: "Karka",
    manglik_status: "NO"
}


IMPORTANT:

The extractor should return confidence values.

Example:

name:
value = "Anusha Reddy"
confidence = 0.98

rashi:
value = "Vrishabha"
confidence = 0.91

If confidence is low:

SHOW USER REVIEW.


============================================================
44. ASTROLOGY DATA NORMALIZATION
============================================================

Do not store inconsistent values such as:

Taurus
Vrishabha
Vrishabham
Vrishabha Rashi

as completely separate values.

Create normalized values.

Example:

rashi_code:
TAURUS

display_name:
Vrishabha

english_name:
Taurus


Similarly:

Nakshatra:

ROHINI

display:
Rohini


This makes search and matching much easier.


============================================================
45. PROPOSAL COMPARISON
============================================================

Allow selecting two proposals:

[ ] Proposal A
[ ] Proposal B

Then:

COMPARE


Comparison screen:

+-------------------------------------------------------+
|                    PROPOSAL COMPARISON                |
+-------------------------------------------------------+
|                   | Proposal A | Proposal B           |
+-------------------------------------------------------+
| Age               | 26         | 27                  |
| Height            | 5'5"       | 5'6"                |
| City              | Hyderabad  | Hyderabad           |
| Education         | MBA        | B.Tech              |
| Profession        | Engineer   | Doctor              |
| Rashi             | Taurus     | Cancer              |
| Nakshatra         | Rohini     | Pushya              |
| Lagna             | Cancer     | Virgo               |
| Manglik           | No         | No                  |
+-------------------------------------------------------+


============================================================
46. MATCHING ENGINE
============================================================

Matching engine should be a separate service.

matching_service.py

Input:

proposal_1
proposal_2

Output:

{
    guna_score,
    manglik_result,
    nadi_result,
    bhakoot_result,
    notes
}


Do not mix matching logic with:

proposal_service.py


============================================================
47. BACKUP
============================================================

Backup TWO things separately:

1. PostgreSQL
2. File Storage


Daily:

PostgreSQL dump
+
File backup


Example:

backup/

2026-08-14/
    database.sql
    files.tar.gz

2026-08-13/
    database.sql
    files.tar.gz


Keep multiple historical backups.


============================================================
48. DOCKER ARCHITECTURE
============================================================

docker-compose.yml


Services:

frontend
backend
postgres
nginx


Optional:

redis


Architecture:

+----------------------+
|       NGINX          |
+----------+-----------+
           |
     +-----+-----+
     |           |
     v           v
 FRONTEND     BACKEND
                |
        +-------+-------+
        |               |
        v               v
    POSTGRES         STORAGE
        |
        v
      OCR


============================================================
49. DEVELOPMENT ENVIRONMENT
============================================================

Local:

localhost:3000
      |
      v
React


localhost:8000
      |
      v
FastAPI


localhost:5432
      |
      v
PostgreSQL


Example:

React:
http://localhost:3000

FastAPI:
http://localhost:8000

Swagger:
http://localhost:8000/docs

PostgreSQL:
localhost:5432


============================================================
50. PRODUCTION ENVIRONMENT
============================================================

Domain:

https://your-domain.com


NGINX
  |
  +---- /
  |     |
  |     v
  |   React
  |
  +---- /api
        |
        v
      FastAPI
        |
        +---- PostgreSQL
        |
        +---- File Storage
        |
        +---- OCR


============================================================
51. DEVELOPMENT PHASES
============================================================

PHASE 1
-------

Project setup

- React
- TypeScript
- Bootstrap
- FastAPI
- PostgreSQL
- Docker
- Authentication


PHASE 2
-------

Proposal management

- Create
- Read
- Update
- Delete
- Search
- Status


PHASE 3
-------

Files

- Photo upload
- Multiple photos
- PDF upload
- File preview
- File deletion


PHASE 4
-------

OCR

- Image OCR
- PDF extraction
- Scanned PDF OCR
- OCR result screen
- Auto-fill


PHASE 5
-------

Astrology

- Birth details
- Rashi
- Nakshatra
- Lagna
- Panchanga
- Dosha
- Planets
- Houses


PHASE 6
-------

Organization

- Tags
- Notes
- Filters
- Advanced search


PHASE 7
-------

Matching

- Proposal comparison
- Ashtakoota
- Guna matching
- Dosha comparison


PHASE 8
-------

Production

- Docker
- Nginx
- HTTPS
- Backup
- Logging
- Security


============================================================
52. MVP PRIORITY
============================================================

BUILD FIRST:

1. Login
2. Dashboard
3. Add Proposal
4. Proposal Details
5. Edit Proposal
6. PostgreSQL
7. Photo Upload
8. PDF Upload
9. Search
10. Astrology fields


THEN:

11. OCR
12. Auto-fill
13. Tags
14. Notes
15. Comparison
16. Matching


============================================================
53. WHAT NOT TO BUILD INITIALLY
============================================================

DO NOT ADD:

- Multiple users
- Admin roles
- RBAC
- Organizations
- Chat
- Notifications
- Elasticsearch
- Kubernetes
- Kafka
- Microservices
- Complex AI agents
- Mobile app
- Social features


This is a private personal application.

Keep the architecture simple.


============================================================
54. FINAL PROJECT ARCHITECTURE
============================================================


                        PRIVATE USER
                             |
                             v
                     +---------------+
                     |    Browser    |
                     +-------+-------+
                             |
                           HTTPS
                             |
                             v
                     +---------------+
                     |     NGINX     |
                     +-------+-------+
                             |
                             v
                 +-----------------------+
                 |     REACT + TS        |
                 |                       |
                 | Bootstrap 5           |
                 | Custom CSS            |
                 | React Router          |
                 | Axios                 |
                 +-----------+-----------+
                             |
                           REST API
                             |
                             v
                 +-----------------------+
                 |       FASTAPI         |
                 |                       |
                 | Authentication        |
                 | Proposal Service      |
                 | Astrology Service     |
                 | File Service          |
                 | OCR Service           |
                 | Search Service        |
                 | Matching Service      |
                 +-----------+-----------+
                             |
             +---------------+----------------+
             |               |                |
             v               v                v
      +-------------+  +-------------+  +-------------+
      | PostgreSQL  |  | File Storage|  | OCR Engine  |
      |             |  |             |  |             |
      | Proposals   |  | Photos      |  | Image OCR   |
      | Astrology   |  | PDFs        |  | PDF OCR     |
      | Family      |  | Documents   |  | Extraction  |
      | Career      |  |             |  |             |
      | Notes       |  |             |  |             |
      | Matching    |  |             |  |             |
      +-------------+  +-------------+  +------+------+
                                               |
                                               v
                                      +----------------+
                                      | Extracted Data |
                                      +-------+--------+
                                              |
                                              v
                                      +----------------+
                                      | User Review    |
                                      |                |
                                      | Confirm/Edit   |
                                      +-------+--------+
                                              |
                                              v
                                         PostgreSQL


============================================================
55. CORE PRINCIPLE
============================================================

The application has FOUR major data layers:

                    PROPOSAL
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
    PROFILE        ASTROLOGY        DOCUMENTS
       |               |               |
       |               |               |
       v               v               v
 Personal          Kundali          Photos
 Family            Rashi            PDFs
 Career            Nakshatra        Biodata
 Lifestyle         Lagna            Horoscope
 Contact           Planets          Screenshots
                   Houses
                   Doshas
                   Panchanga
                       |
                       v
                  MATCHING ENGINE
                       |
                       v
                COMPARISON RESULT


============================================================
FINAL RECOMMENDED STACK
============================================================

Frontend:
React + TypeScript + Bootstrap 5 + Custom CSS

Backend:
Python + FastAPI

Database:
PostgreSQL

ORM:
SQLAlchemy

Migration:
Alembic

Authentication:
JWT + Argon2/bcrypt

HTTP:
Axios

OCR:
PaddleOCR / Tesseract

PDF:
PyMuPDF

Image:
Pillow

Storage:
Private local storage initially
→ S3 / R2 / Supabase Storage later

Deployment:
Docker + Docker Compose + Nginx

Backup:
PostgreSQL dump + File backup


============================================================
END
============================================================