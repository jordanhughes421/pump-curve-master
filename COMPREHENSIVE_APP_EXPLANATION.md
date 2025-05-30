# Comprehensive Application Feature Explanation

This document provides a comprehensive explanation of the application's features, based on code analysis and database schema examination.

## User Authentication

This section outlines the User Authentication feature, detailing how users can register, log in, log out, what information is stored, and how sessions are managed.

### 1. User Registration

Users can register for an account using the following methods:

*   **Email and Password:**
    *   Users can create an account by providing their email address and a password.
    *   The system will validate the email format and password strength (details to be specified).
    *   Upon successful registration, a new `User` record is created in the database.
*   **Google OAuth:**
    *   Users can register using their existing Google account.
    *   The system will redirect the user to Google for authentication.
    *   Upon successful authentication and consent, Google provides user information (name, email, profile picture).
    *   A new `User` record is created, and an associated `Account` record is created to link the user to their Google identity.

### 2. User Login

Registered users can log in using the following methods:

*   **Email and Password:**
    *   Users enter their registered email and password.
    *   The system verifies the credentials against the stored `User` data.
*   **Google OAuth:**
    *   Users can log in by selecting the "Sign in with Google" option.
    *   The system redirects the user to Google for authentication.
    *   If the user has previously registered or logged in with this Google account, the system links them to their existing `User` record via the `Account` table.

### 3. User Logout

*   Users can log out of their account.
*   Upon logout, the user's session is invalidated.
*   The client-side session cookie or token is cleared.

### 4. User Information Stored

The following user information is stored in the database:

*   **`User` Model:**
    *   `id`: Unique identifier for the user.
    *   `name`: User's full name (optional, can be obtained from Google or entered manually).
    *   `email`: User's email address (unique, used for login and communication).
    *   `emailVerified`: Timestamp indicating if the user's email address has been verified (relevant for email/password registration).
    *   `image`: URL to the user's profile picture (optional, can be obtained from Google).
    *   `hashedPassword`: Hashed version of the user's password (only for email/password registration).
    *   `createdAt`: Timestamp of when the user account was created.
    *   `updatedAt`: Timestamp of the last update to the user account.
    *   `companyId`: Foreign key linking the user to a `Company` (details of `Company` model are outside this scope but imply users can be associated with companies).
    *   `role`: User's role within the application (e.g., `ADMIN`, `USER`).

*   **`Account` Model:** (Primarily for OAuth providers)
    *   `userId`: Foreign key linking to the `User` model.
    *   `type`: Type of account (e.g., "oauth").
    *   `provider`: Name of the OAuth provider (e.g., "google").
    *   `providerAccountId`: The user's unique ID from the OAuth provider.
    *   `access_token`, `expires_at`, `id_token`, `refresh_token`, `scope`, `session_state`, `token_type`: Tokens and metadata related to the OAuth session.

### 5. Session Management

*   Upon successful login, a session is created for the user.
*   The system uses the `Session` model to store session information linked to the `User`.
    *   `sessionToken`: A unique token identifying the session.
    *   `userId`: Foreign key linking the session to the `User`.
    *   `expires`: Timestamp indicating when the session will expire.
*   This `sessionToken` is likely stored in a client-side cookie (e.g., `next-auth.session-token`) and sent with subsequent requests to authenticate the user.
*   Sessions have an expiration time, after which the user will need to log in again.
*   Logout invalidates the current session.

## Pump Management

This section outlines the Pump Management feature, detailing how users can create, view, and manage pump entries, what information is stored, and the relationship between pumps and users.

### 1. Creating New Pump Entries

*   Users can create new pump entries through a dedicated form (likely accessed via `app/pumps/new/page.tsx` which uses `CreatePumpForm.tsx`).
*   To create a pump, users need to provide the following specifications:
    *   `name`: A user-defined name for the pump.
    *   `type`: The type of pump (e.g., centrifugal, diaphragm, gear).
    *   `manufacturer`: The company that manufactured the pump.
    *   `modelNumber`: The specific model number of the pump.
    *   `maxFlow`: The maximum flow rate the pump can achieve (likely in units like GPM or L/min).
    *   `maxHead`: The maximum head pressure the pump can generate (likely in units like feet or meters).
    *   `maxSpeed`: The maximum operational speed of the pump (likely in RPM).
    *   `description`: An optional field for any additional notes or details about the pump.
*   Upon submission, a new `PumpModel` record is created in the database.

### 2. Pump Specifications Stored and Displayed

The following pump specifications are stored in the `PumpModel` table in the database:

*   `id`: Unique identifier for the pump entry.
*   `name`: User-defined name.
*   `type`: Type of pump.
*   `manufacturer`: Pump manufacturer.
*   `modelNumber`: Pump model number.
*   `maxFlow`: Maximum flow rate.
*   `maxHead`: Maximum head pressure.
*   `maxSpeed`: Maximum operational speed.
*   `description`: Optional description.
*   `userId`: Foreign key linking the pump to the `User` who created it.
*   `createdAt`: Timestamp of when the pump entry was created.
*   `updatedAt`: Timestamp of the last update to the pump entry.

These specifications are displayed to the user when they view a list of pumps or the details of a specific pump.

### 3. Viewing a List of Pumps

*   Users can view a list of all pumps they have created (likely on `app/pumps/page.tsx`).
*   This list typically displays key information for each pump, such as `name`, `type`, and `manufacturer`, allowing users to quickly identify pumps.
*   Each item in the list likely provides a link to view the detailed information for that specific pump.

### 4. Viewing Detailed Pump Information

*   Users can view detailed information for a specific pump by navigating to a dedicated page (e.g., `app/pumps/[id]/page.tsx`, where `[id]` is the pump's unique identifier).
*   This page displays all the stored specifications for the selected pump, including `name`, `type`, `manufacturer`, `modelNumber`, `maxFlow`, `maxHead`, `maxSpeed`, and `description`.

### 5. Relationship Between Pump and User

*   Each pump entry (`PumpModel`) is associated with the user who created it via the `userId` foreign key.
*   This means that users can only see and manage the pumps they have personally added to the system.
*   The system ensures that a pump entry is always linked to a `User` record.

## Pump Curve Management

This section outlines the Pump Curve Management feature, detailing how performance curves are associated with pump models, how curve data is uploaded, edited, deleted, and visualized.

### 1. Association with Pump Models

*   Each pump curve (`PumpCurve` model) is directly associated with a specific pump model (`PumpModel`) via a `pumpModelId` foreign key.
*   This ensures that every curve is linked to a particular pump entry in the system.
*   Users will typically manage curves within the context of a specific pump, likely on the pump's detail page (`app/pumps/[id]/page.tsx`).

### 2. Uploading Curve Data

*   Users can upload new pump curve data for a specific pump using a dedicated form (`UploadCurveForm.tsx`).
*   The process involves:
    *   Specifying the **pump speed** (RPM) to which this curve corresponds.
    *   Providing a series of data points, where each point represents a **flow rate** and its corresponding **head pressure**.
    *   The `curveData` is stored as a string, which is highly likely to be a JSON formatted string representing an array of `{flow, head}` objects (e.g., `"[{\"flow\": 0, \"head\": 60}, {\"flow\": 10, \"head\": 58}, ...]" `).
*   An API route (likely `POST /api/pumps/[id]/curves`) handles the creation of new `PumpCurve` records in the database.

### 3. Editing Existing Curve Data

*   While the provided file names (`UploadCurveForm.tsx`, `ExistingCurvesCard.tsx`) strongly suggest creation and viewing, the ability to edit is a standard requirement for such management features.
*   It's inferred that users can edit existing curve data. This might involve:
    *   Modifying the pump speed associated with the curve.
    *   Altering the flow and head data points.
    *   This would likely be handled by an API route similar to `PUT /api/pumps/[id]/curves/[curveId]` or `PATCH /api/pumps/[id]/curves/[curveId]`.
    *   The interface for editing might reuse or be similar to the `UploadCurveForm.tsx`, pre-filled with existing data.

### 4. Deleting Curves

*   Users can delete existing pump curves.
*   This is likely done through the `ExistingCurvesCard.tsx` component, which would list curves and provide a delete option for each.
*   An API route (e.g., `DELETE /api/pumps/[id]/curves/[curveId]`) is responsible for removing the `PumpCurve` record from the database.

### 5. Visual Display of Pump Curves

*   Pump curves are visually displayed as charts, likely using the `PumpCurveChart.tsx` component.
*   This chart plots head (Y-axis) against flow (X-axis) for one or more pump speeds.
*   Multiple curves (for different speeds) can be overlaid on the same chart for a single pump model, allowing for comprehensive performance visualization.
*   The chart component parses the `curveData` (JSON string) to render the lines on the graph.

### 6. Structure of Curve Data

*   The `PumpCurve` model stores the actual curve points in a field named `curveData` of type `String`.
*   This string is expected to contain a JSON array of objects, where each object has `flow` and `head` properties. For example:
    ```json
    [
      {"flow": 0, "head": 60},
      {"flow": 10, "head": 58},
      {"flow": 20, "head": 55},
      {"flow": 30, "head": 50},
      {"flow": 40, "head": 42},
      {"flow": 50, "head": 30}
    ]
    ```
*   The `pumpSpeed` (integer) is stored as a separate field in the `PumpCurve` model, associating this set of data points with a specific operational speed.

## Pump Curve Scaling (Affinity Laws)

This section outlines the Pump Curve Scaling feature, often referred to as Affinity Laws calculation. It details how users can predict pump performance changes based on variations in speed or impeller diameter, how scaled curves are generated, and how they are stored.

### 1. Purpose of the Feature

*   The primary purpose of this feature is to allow users to predict how a pump's performance curve (flow vs. head) will change if the pump's operational speed or impeller diameter is altered.
*   This is based on the well-established engineering principles known as the Affinity Laws.
*   It helps users understand a pump's capabilities under different conditions without needing to test it at every possible speed or with every impeller size.

### 2. Using the Affinity Calculator

*   Users interact with this feature through the `AffinityCalculator.tsx` component, which is likely available on the pump's detail page (`app/pumps/[id]/page.tsx`).
*   The calculator requires users to:
    *   Select an **existing, original pump curve** as the basis for the calculation. This original curve will have a known pump speed.
    *   Input either:
        *   A **new speed** or a **speed ratio** (new speed / original speed).
        *   A **new impeller diameter** or a **diameter ratio** (new diameter / original diameter). While the schema has `diameterRatio`, the primary input seems to be speed via `newSpeed` in the API. The calculator likely focuses on speed changes first, but diameter changes are also part of affinity laws.
*   Based on these inputs, the system calculates a new, scaled performance curve.

### 3. Generation of Scaled Curves

*   New (scaled) curves are generated by applying the Affinity Law formulas to the data points of an existing, original `PumpCurve`.
*   The `/api/pump-curves/scale` API route is responsible for this calculation. It takes:
    *   The `originalCurveId` (the ID of the base `PumpCurve`).
    *   The `newSpeed` for the scaled curve.
    *   (Potentially `newDiameter` if diameter scaling is also implemented via this API, though `diameterRatio` is stored on the curve itself).
*   The Affinity Laws state:
    *   Flow rate (Q) changes proportionally to the speed (N) ratio: `Q_new / Q_orig = N_new / N_orig`
    *   Head (H) changes proportionally to the square of the speed (N) ratio: `H_new / H_orig = (N_new / N_orig)^2`
    *   (Power (P) changes proportionally to the cube of the speed (N) ratio, though power is not explicitly part of `PumpCurve` data).
*   Similar laws apply for diameter (D) changes:
    *   `Q_new / Q_orig = D_new / D_orig`
    *   `H_new / H_orig = (D_new / D_orig)^2`
*   The API applies these formulas to each `{flow, head}` point in the `originalCurve.curveData` to generate the `curveData` for the new, scaled curve.

### 4. Storage of Scaled Curves

Scaled pump curves are stored as new `PumpCurve` records in the database with specific attributes to distinguish them and link them to their origin:

*   **Marked as Scaled:**
    *   The `isScaled` boolean field is set to `true` for these curves, differentiating them from original, empirically derived or manufacturer-provided curves.
*   **Linking to Original Curve:**
    *   The `originalCurveId` field (nullable `String`) stores the `id` of the `PumpCurve` record from which this scaled curve was derived. This maintains a clear lineage.
*   **Storing Scaling Ratios/Parameters:**
    *   `speedRatio`: A `Float?` field that stores the ratio of the scaled curve's speed to the original curve's speed (`newSpeed / originalSpeed`). Even if `newSpeed` is the direct input, storing the ratio can be useful.
    *   `diameterRatio`: A `Float?` field that stores the ratio of the scaled curve's impeller diameter to the original curve's impeller diameter (`newDiameter / originalDiameter`), if diameter scaling was applied.
    *   The `pumpSpeed` field of the scaled `PumpCurve` record will store the `newSpeed` that was used for the calculation.
*   The `curveData` itself is stored in the same JSON format as original curves, but represents the calculated performance at the new speed/diameter.

This approach allows users to generate multiple "what-if" scenarios (scaled curves) from a single original curve, and these predictions are stored and clearly marked as such. They can then be visualized on the `PumpCurveChart.tsx` alongside original curves.

## Potential Document and Bill of Materials (BOM) Management

This section outlines potential Document Management and Bill of Materials (BOM) Management features as suggested by the database schema (`prisma/schema.prisma`). It details their likely purpose and the type of information that could be stored. **It's important to note that the existence of these database models suggests these features are planned or partially implemented, but their full user interface and functionality may not yet be available in the application.**

### 1. Document Management Feature (Based on `Document` Model)

*   **Likely Purpose:**
    *   To allow users to associate various types of documents with specific pump models (`PumpModel`).
    *   These documents could include technical specifications, manuals, maintenance logs, images, datasheets, or any other relevant files related to a pump.
    *   This feature would help centralize all information pertaining to a pump, making it easily accessible.

*   **Information Stored (as per `Document` model fields):**
    *   `id`: Unique identifier for each document.
    *   `title`: A user-defined title for the document (e.g., "User Manual XJ-500", "Maintenance Report 2023-10-26").
    *   `fileUrl`: The URL or path where the actual document file is stored. This suggests that documents are uploaded and hosted, either on the same server or a cloud storage service.
    *   `fileType`: The type of file (e.g., "pdf", "docx", "jpg", "png"). This helps in identifying and potentially rendering the document.
    *   `pumpModelId`: A foreign key linking the document directly to a `PumpModel`. This establishes the one-to-many relationship (one pump can have many documents).
    *   `userId`: A foreign key linking the document to the `User` who uploaded or owns it. This could be used for tracking and permissions.
    *   `createdAt`: Timestamp for when the document record was created.
    *   `updatedAt`: Timestamp for the last update to the document record.

*   **Potential Functionality (Inferred):**
    *   Uploading new documents and associating them with a pump.
    *   Listing all documents associated with a specific pump.
    *   Viewing/downloading documents.
    *   Deleting documents.
    *   Possibly editing document metadata (like title).

### 2. Bill of Materials (BOM) Management Feature (Based on `BOM` Model)

*   **Likely Purpose:**
    *   To allow users to create and manage a Bill of Materials for each specific pump model (`PumpModel`).
    *   A BOM lists all the components, parts, and assemblies required to build or maintain that particular pump.
    *   This is crucial for maintenance, repair, ordering spare parts, and understanding the pump's construction.

*   **Information Stored (as per `BOM` model fields):**
    *   `id`: Unique identifier for each BOM item.
    *   `partNumber`: The manufacturer's or internal part number for the component.
    *   `description`: A brief description of the part (e.g., "Impeller Nut", "Seal Kit", "Motor Bearing").
    *   `quantity`: The number of units of this part required for one pump.
    *   `manufacturer`: The manufacturer of the specific part (if different from the pump manufacturer).
    *   `supplier`: The supplier from whom the part can be sourced (optional).
    *   `pumpModelId`: A foreign key linking the BOM item directly to a `PumpModel`. This establishes the one-to-many relationship (one pump can have many BOM line items).
    *   `userId`: A foreign key linking the BOM item to the `User` who created or manages it.
    *   `createdAt`: Timestamp for when the BOM item record was created.
    *   `updatedAt`: Timestamp for the last update to the BOM item record.

*   **Potential Functionality (Inferred):**
    *   Adding new parts to a pump's BOM.
    *   Listing all parts in the BOM for a specific pump.
    *   Editing BOM item details (part number, description, quantity, etc.).
    *   Deleting parts from a BOM.
    *   Potentially exporting the BOM (e.g., to CSV or PDF).

### Conclusion on Potential Features

The `Document` and `BOM` models in the Prisma schema strongly indicate the intent to include comprehensive Document Management and Bill of Materials Management features tied to individual pump models. While the backend structure is in place, the extent of their implementation in the user interface and API routes would require further analysis of the frontend components and API handlers related to these models.
