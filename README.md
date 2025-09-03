# CARE ABDM FE

CARE ABDM FE is a frontend plugin for CARE based on micro frontend architecture for ABDM Integration. This plugin adds UI components for:
- Creating and linking ABHA numbers to patients
- Raising data fetch requests over ABDM
- Viewing health information data

## Overview

The plugin integrates with the main CARE frontend application to provide ABDM (Ayushman Bharat Digital Mission) related functionality through various pluggable components, custom pages, and encounter tabs.

## Getting Started

### Prerequisites

- Node.js and npm _(refer care_fe repo for exact version required.)_

### Setup Instructions

1. Clone both repositories:
```bash
git clone git@github.com:ohcnetwork/care_fe.git
git clone git@github.com:ohcnetwork/care_abdm_fe.git
```

2. Install dependencies for CARE ABDM FE:
```bash
cd care_abdm_fe
npm install
```

3. Start the development server:
```bash
npm run start
```

4. Configure CARE FE:
```bash
cd ../care_fe
```
Update the `REACT_ENABLED_APPS` environment variable:
```
REACT_ENABLED_APPS="ohcnetwork/care_abdm_fe@localhost:5173"
```
Note: `localhost:5173` should point to where care_abdm_fe is being served

5. Setup and run CARE FE:
```bash
npm run setup
npm install
npm run dev
```

## Components

### Pluggable Components

1. **FacilityHomeActions**
   - Location: Facility Settings page, dropdown menu
   - Function: Provides a dialog for editing Health Facility ID
   
2. **PatientDetailsTabDemographyGeneralInfo**
   - Location: Patient details page, demography tab
   - Function: Displays ABHA details card
   - Condition: Visible only when the Patient's ABHA number is linked

3. **PatientHomeActions**
   - Location: Patient details page
   - Function: Provides ABHA linking functionality
   - Condition: Visible only when the Patient doesn't have thier ABHA Number linked
   - Requirements: Health Facility ID should be linked before linking ABHA Number to the Patient

4. **EncounterActions**
   - Location: Encounter page, dropdown menu
   - Function: Dialog for creating consent requests for data from 3rd party hospitals
   - Condition: Visible only when the Patient's ABHA number is linked
   - Requirements: Health Facility ID should be linked before making a consent request

5. **PatientRegistrationForm**
   - Location: Patient registration page
   - Function: ABHA linking with auto-fill capabilities
   - Features:
     - Auto-fills patient registration form with ABDM data upon successful linking
     - Shows disabled form with ABHA details if already linked
   - Requirements: Health Facility ID should be linked before linking ABHA Number to the Patient

### Encounter Tab

**ABDM Records**
- Displays consent requests and artifacts
- Links to HealthInformation page when consent artifact is clicked
- Condition: Visible only when the Patient's ABHA number is linked

### Custom Pages

**HealthInformation Page**
- Purpose: Displays health information received from 3rd party hospitals via ABDM
- Rendering: Uses custom `hi-profiles` package ([GitHub Repository](https://github.com/ohcnetwork/hi-profiles))
