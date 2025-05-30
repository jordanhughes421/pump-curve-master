**User Authentication Feature Description**

This document outlines the User Authentication feature, detailing how users can register, log in, log out, what information is stored, and how sessions are managed.

**1. User Registration**

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

**2. User Login**

Registered users can log in using the following methods:

*   **Email and Password:**
    *   Users enter their registered email and password.
    *   The system verifies the credentials against the stored `User` data.
*   **Google OAuth:**
    *   Users can log in by selecting the "Sign in with Google" option.
    *   The system redirects the user to Google for authentication.
    *   If the user has previously registered or logged in with this Google account, the system links them to their existing `User` record via the `Account` table.

**3. User Logout**

*   Users can log out of their account.
*   Upon logout, the user's session is invalidated.
*   The client-side session cookie or token is cleared.

**4. User Information Stored**

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

**5. Session Management**

*   Upon successful login, a session is created for the user.
*   The system uses the `Session` model to store session information linked to the `User`.
    *   `sessionToken`: A unique token identifying the session.
    *   `userId`: Foreign key linking the session to the `User`.
    *   `expires`: Timestamp indicating when the session will expire.
*   This `sessionToken` is likely stored in a client-side cookie (e.g., `next-auth.session-token`) and sent with subsequent requests to authenticate the user.
*   Sessions have an expiration time, after which the user will need to log in again.
*   Logout invalidates the current session.
