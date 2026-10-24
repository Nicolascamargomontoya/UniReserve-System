# Spec: Space Management

## Description
Handles the administration of academic spaces (laboratories, auditoriums, computer rooms).

## Requirements
- **REQ-SPC-01:** The system shall allow administrators to create new academic spaces with attributes: name, type (lab/auditorium/room), capacity, location, and equipment list.
- **REQ-SPC-02:** The system shall allow administrators to edit space details.
- **REQ-SPC-03:** The system shall allow administrators to mark a space as "Inactive" to prevent new reservations.
- **REQ-SPC-04:** The system shall provide a searchable list of all active spaces for all users, allowing filters by name and type (lab/auditorium/room).

## Restrictions
- **RES-SPC-01:** Space names must be unique.
- **RES-SPC-02:** Capacity must be a positive integer.

## Acceptance Scenarios
### Scenario 1: Creating a New Lab
**Given** an administrator
**When** they create a space with name "Lab A", type "Laboratory", capacity 30, and location "Building 1"
**Then** the space is saved and appears in the catalog.

### Scenario 2: Deactivating a Space
**Given** an active space "Auditorium 1"
**When** an administrator marks it as inactive
**Then** users can no longer see it in the "Available Spaces" search.
