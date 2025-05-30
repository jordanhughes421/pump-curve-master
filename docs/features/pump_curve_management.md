**Pump Curve Management Feature Description**

This document outlines the Pump Curve Management feature, detailing how performance curves are associated with pump models, how curve data is uploaded, edited, deleted, and visualized.

**1. Association with Pump Models**

*   Each pump curve (`PumpCurve` model) is directly associated with a specific pump model (`PumpModel`) via a `pumpModelId` foreign key.
*   This ensures that every curve is linked to a particular pump entry in the system.
*   Users will typically manage curves within the context of a specific pump, likely on the pump's detail page (`app/pumps/[id]/page.tsx`).

**2. Uploading Curve Data**

*   Users can upload new pump curve data for a specific pump using a dedicated form (`UploadCurveForm.tsx`).
*   The process involves:
    *   Specifying the **pump speed** (RPM) to which this curve corresponds.
    *   Providing a series of data points, where each point represents a **flow rate** and its corresponding **head pressure**.
    *   The `curveData` is stored as a string, which is highly likely to be a JSON formatted string representing an array of `{flow, head}` objects (e.g., `"[{\"flow\": 0, \"head\": 60}, {\"flow\": 10, \"head\": 58}, ...]" `).
*   An API route (likely `POST /api/pumps/[id]/curves`) handles the creation of new `PumpCurve` records in the database.

**3. Editing Existing Curve Data**

*   While the provided file names (`UploadCurveForm.tsx`, `ExistingCurvesCard.tsx`) strongly suggest creation and viewing, the ability to edit is a standard requirement for such management features.
*   It's inferred that users can edit existing curve data. This might involve:
    *   Modifying the pump speed associated with the curve.
    *   Altering the flow and head data points.
    *   This would likely be handled by an API route similar to `PUT /api/pumps/[id]/curves/[curveId]` or `PATCH /api/pumps/[id]/curves/[curveId]`.
    *   The interface for editing might reuse or be similar to the `UploadCurveForm.tsx`, pre-filled with existing data.

**4. Deleting Curves**

*   Users can delete existing pump curves.
*   This is likely done through the `ExistingCurvesCard.tsx` component, which would list curves and provide a delete option for each.
*   An API route (e.g., `DELETE /api/pumps/[id]/curves/[curveId]`) is responsible for removing the `PumpCurve` record from the database.

**5. Visual Display of Pump Curves**

*   Pump curves are visually displayed as charts, likely using the `PumpCurveChart.tsx` component.
*   This chart plots head (Y-axis) against flow (X-axis) for one or more pump speeds.
*   Multiple curves (for different speeds) can be overlaid on the same chart for a single pump model, allowing for comprehensive performance visualization.
*   The chart component parses the `curveData` (JSON string) to render the lines on the graph.

**6. Structure of Curve Data**

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
