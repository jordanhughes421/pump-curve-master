**Pump Management Feature Description**

This document outlines the Pump Management feature, detailing how users can create, view, and manage pump entries, what information is stored, and the relationship between pumps and users.

**1. Creating New Pump Entries**

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

**2. Pump Specifications Stored and Displayed**

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

**3. Viewing a List of Pumps**

*   Users can view a list of all pumps they have created (likely on `app/pumps/page.tsx`).
*   This list typically displays key information for each pump, such as `name`, `type`, and `manufacturer`, allowing users to quickly identify pumps.
*   Each item in the list likely provides a link to view the detailed information for that specific pump.

**4. Viewing Detailed Pump Information**

*   Users can view detailed information for a specific pump by navigating to a dedicated page (e.g., `app/pumps/[id]/page.tsx`, where `[id]` is the pump's unique identifier).
*   This page displays all the stored specifications for the selected pump, including `name`, `type`, `manufacturer`, `modelNumber`, `maxFlow`, `maxHead`, `maxSpeed`, and `description`.

**5. Relationship Between Pump and User**

*   Each pump entry (`PumpModel`) is associated with the user who created it via the `userId` foreign key.
*   This means that users can only see and manage the pumps they have personally added to the system.
*   The system ensures that a pump entry is always linked to a `User` record.
