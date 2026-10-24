# Spec: Reservation Flow

## Description
Handles the end-to-end process of requesting, validating, and managing academic space reservations.

## Requirements
- **REQ-RES-01:** The system shall allow authorized users to create a reservation request specifying: space ID, start date/time, and end date/time.
- **REQ-RES-02:** The system shall validate that the start time is in the future.
- **REQ-RES-03:** The system shall validate that the end time is after the start time.
- **REQ-RES-04:** **Availability Validation:** The system shall check for any overlapping reservations for the same space during the requested time window.
- **REQ-RES-05:** **Conflict Prevention:** The system shall block the creation of a request if an "Approved" reservation already exists for that time slot.
- **REQ-RES-06:** The system shall assign a "Pending" status to all new requests.
- **REQ-RES-07:** The system shall allow the reservation to be updated to "Approved" or "Rejected" by an administrator.
- **REQ-RES-08:** The system shall allow users to view their reservation history and current status.
- **REQ-RES-09:** The system shall prevent any single reservation from exceeding a duration of four (4) consecutive hours.

## Restrictions
- **RES-RES-01:** Reservations cannot overlap by even one minute.
- **RES-RES-02:** A request cannot be created if the space is "Inactive".

## Acceptance Scenarios
### Scenario 1: Successful Request Creation
**Given** a space "Lab A" that is free from 10:00 to 12:00
**When** a user requests a reservation for "Lab A" from 10:00 to 12:00
**Then** the system creates the request with status "Pending".

### Scenario 2: Simultaneous Reservation Conflict
**Given** an "Approved" reservation for "Lab A" from 10:00 to 12:00
**When** another user requests "Lab A" from 11:00 to 13:00
**Then** the system rejects the request with a "Space not available for the selected time" error.

### Scenario 3: Invalid Time Window
**Given** a user requesting a reservation
**When** they set the end time before the start time
**Then** the system returns a "Invalid time range" error.

### Scenario 4: Reservation Exceeding 4 Hours
**Given** a user requesting a reservation
**When** the duration between start time and end time is greater than 4 hours (e.g., 10:00 to 15:00)
**Then** the system rejects the request with a "Reservation cannot exceed 4 consecutive hours" error.
