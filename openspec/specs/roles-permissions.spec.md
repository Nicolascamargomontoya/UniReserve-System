# Spec: Roles and Permissions

## Description
Defines the access control levels and the operations allowed for each role.

## Requirements
- **REQ-ROL-01:** The system shall support three primary roles: `Student`, `Professor`, and `Administrator`.
- **REQ-ROL-02:** `Student` and `Professor` roles shall be permitted to search for spaces and create reservation requests.
- **REQ-ROL-03:** Only `Administrator` role shall be permitted to manage the catalog of spaces (Create, Edit, Delete).
- **REQ-ROL-04:** Only `Administrator` role shall be permitted to approve or reject reservation requests.
- **REQ-ROL-05:** Users shall only be permitted to cancel their own reservation requests.

## Restrictions
- **RES-ROL-01:** A user can only have one primary role assigned at a time.
- **RES-ROL-02:** Role changes must be performed only by an `Administrator`.

## Acceptance Scenarios
### Scenario 1: Student Accessing Admin Panel
**Given** a user with the `Student` role
**When** they attempt to access the "Manage Spaces" endpoint
**Then** the system returns a "403 Forbidden" error.

### Scenario 2: Admin Approving Reservation
**Given** a user with the `Administrator` role
**When** they send an approval command for a pending reservation
**Then** the reservation status is updated to "Approved".

### Scenario 3: User Cancelling Own Reservation
**Given** a user who created a reservation
**When** they request to cancel it
**Then** the system updates the status to "Cancelled".
