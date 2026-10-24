# Spec: User Management

## Description
Handles the registration, authentication, and administration of users within the reservation system.

## Requirements
- **REQ-USR-01:** The system shall allow users to create an account with an email, password, and full name.
- **REQ-USR-02:** The system shall validate that the email is unique.
- **REQ-USR-03:** The system shall allow users to authenticate using their email and password.
- **REQ-USR-04:** The system shall provide a way to update user profile information (name, email).
- **REQ-USR-05:** The system shall allow administrators to deactivate user accounts.

## Restrictions
- **RES-USR-01:** Passwords must be stored using a secure hashing algorithm (e.g., bcrypt).
- **RES-USR-02:** Emails must follow a valid email format.

## Acceptance Scenarios
### Scenario 1: Successful Registration
**Given** a user provides a unique valid email and password
**When** the registration request is sent
**Then** the system creates the account and returns a success message.

### Scenario 2: Duplicate Email Registration
**Given** an email that already exists in the system
**When** a new user tries to register with that email
**Then** the system rejects the request and returns an "Email already in use" error.

### Scenario 3: Failed Authentication
**Given** a registered user
**When** they provide an incorrect password
**Then** the system denies access and returns an "Invalid credentials" error.
