# EPICK User: Sales Category OR PickRight Area

## Summary

EPICK users can now be assigned by **Sales Category** (existing) or **PickRight Area** (new). One option per user. Backend is implemented; frontend must send `assignmentType` and either `category` or `pickRightAreas`.

---

## 1. Database migration (PostgreSQL)

Run once on your Postgres DB (e.g. when deploying):

```sql
-- epick_user: add assignment type and PickRight areas
ALTER TABLE epick_user
  ADD COLUMN IF NOT EXISTS "assignmentType" VARCHAR(255) NOT NULL DEFAULT 'sales_category',
  ADD COLUMN IF NOT EXISTS "pickRightAreas" TEXT[] NOT NULL DEFAULT '{}';

-- Backfill existing users as sales_category
UPDATE epick_user SET "assignmentType" = 'sales_category' WHERE "assignmentType" IS NULL;
UPDATE epick_user SET "pickRightAreas" = '{}' WHERE "pickRightAreas" IS NULL;

-- epick_confirmation: add PickRight areas for confirmations
ALTER TABLE epick_confirmation
  ADD COLUMN IF NOT EXISTS "pickRightAreas" TEXT[] NOT NULL DEFAULT '{}';

UPDATE epick_confirmation SET "pickRightAreas" = '{}' WHERE "pickRightAreas" IS NULL;
```

---

## 2. Backend API changes

### Create EPICK user

**POST** `/api/distrubutor/createEpickUser` (or your manager base path)

**Body (Sales Category – same as before, with new field):**

```json
{
  "email": "picker@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "password": "secret123",
  "userNumber": 101,
  "assignmentType": "sales_category",
  "category": [10, 12],
  "order_type": "order_number",
  "shortby": "Des",
  "item_sort_by": "line_number"
}
```

**Body (PickRight Area – new):**

```json
{
  "email": "picker2@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "password": "secret123",
  "userNumber": 102,
  "assignmentType": "pickright_area",
  "pickRightAreas": ["AREA-A", "AREA-B"],
  "order_type": "order_number",
  "shortby": "Des",
  "item_sort_by": "line_number"
}
```

- `assignmentType`: **required** — `"sales_category"` or `"pickright_area"`.
- If `assignmentType === "sales_category"`: **category** required (array of numbers, same rules as before).
- If `assignmentType === "pickright_area"`: **pickRightAreas** required (array of strings; values must exist in MSSQL `PickRight_AreaDefinition.PickArea`).

### Get PickRight areas for dropdown

**GET** `/api/distrubutor/pickRightAreasForEpick`

**Response:**

```json
{
  "success": true,
  "data": [
    { "pickArea": "AREA-A", "pickAreaDescription": "Cooler Section" },
    { "pickArea": "AREA-B", "pickAreaDescription": "Dry Goods" }
  ]
}
```

Use `data` to build the multi-select for “PickRight Area” when `assignmentType === 'pickright_area'`.

### Get EPICK users

**GET** `/api/distrubutor/epickUsers`

Response now includes per user:

- `assignmentType`: `"sales_category"` or `"pickright_area"`
- `category`: number[] (used when sales_category)
- `pickRightAreas`: string[] (used when pickright_area)

### Update EPICK user

**PUT** `/api/distrubutor/updateEpickUser/:id`

- To switch to Sales Category: send `assignmentType: "sales_category"` and `category: [10, 12]` (and optionally `pickRightAreas: []`).
- To switch to PickRight Area: send `assignmentType: "pickright_area"` and `pickRightAreas: ["AREA-A"]`.
- Cannot change assignment type while the user has in-progress orders.

---

## 3. Frontend changes (what to implement)

### 3.1 Create / Edit EPICK user screen

1. **Assignment type**
   - Add a control (e.g. radio or tabs): **“Sales Category”** vs **“PickRight Area”**.
   - Default: **“Sales Category”** (keeps current behaviour).

2. **When “Sales Category” is selected**
   - Show the existing **Sales Category** multi-select (same as today).
   - Send `assignmentType: "sales_category"` and `category: [ … ]`.
   - Do **not** send `pickRightAreas`, or send `[]`.

3. **When “PickRight Area” is selected**
   - On load (or when switching to this option), call **GET** `/api/distrubutor/pickRightAreasForEpick` and build a multi-select (or tag input) from `data[].pickArea` and `data[].pickAreaDescription`.
   - User selects one or more areas.
   - On submit, send `assignmentType: "pickright_area"` and `pickRightAreas: ["AREA-A", "AREA-B"]` (use actual `pickArea` values).

4. **Validation (client-side)**
   - If “Sales Category”: at least one category selected.
   - If “PickRight Area”: at least one area selected.
   - Exactly one of the two options; do not send both with values.

### 3.2 EPICK user list / detail

- Show **Assignment type**: “Sales Category” or “PickRight Area”.
- Show either:
  - “Categories: 10, 12” (and optionally resolve IDs to names if you have a list), or
  - “Areas: AREA-A, AREA-B” (and optionally show `pickAreaDescription` from the PickRight areas list).

### 3.3 EPICK picker app (mobile/web)

- No change required for flow: picker still sees “their” order lines. Backend already filters by **Sales_Category** or **PickArea** depending on `assignmentType`.
- If you show “Your categories” anywhere, extend to “Your categories/areas” or show areas when `assignmentType === 'pickright_area'` using the user object returned by your auth/details API.

---

## 4. Example: how the feature works

### Scenario A: Picker with Sales Category (unchanged)

1. Manager creates EPICK user with **Sales Category** e.g. `[10, 12]`.
2. Picker logs in and accepts an order. Backend creates an `EpickConfirmation` with `category: [10, 12]`.
3. **getOrderItem** returns only order lines whose `Inventory.Sales_Category` is 10 or 12.
4. Picker scans and completes. Order completion still requires all categories (and, if used, all PickRight areas) in the order to be covered by completed confirmations.
5. Dashboard / Picker Performance attributes time and qty to this picker by category as before.

### Scenario B: Picker with PickRight Area (new)

1. Manager opens Create EPICK user, selects **“PickRight Area”**, loads areas from **GET** `/pickRightAreasForEpick`, and selects e.g. “Cooler Section” and “Dry Goods” (`AREA-A`, `AREA-B`).
2. Submit: `assignmentType: "pickright_area"`, `pickRightAreas: ["AREA-A", "AREA-B"]`. Backend validates that these exist in `PickRight_AreaDefinition` and applies the same “single area exclusive” rule as for single category.
3. Picker logs in and accepts an order. Backend creates `EpickConfirmation` with `pickRightAreas: ["AREA-A", "AREA-B"]`, `category: []`.
4. **getOrderItem** returns only order lines whose `Inventory.PickArea` is `AREA-A` or `AREA-B`.
5. Picker scans and completes. Order is fully completed when every Sales_Category and every PickArea present in the order has at least one completed confirmation covering it.
6. Dashboard / Picker Performance attributes time and scanned qty to this picker using `pickRightAreas` and `Inventory.PickArea`.

### Scenario C: Mixed order (category + area pickers)

- Order has lines with different `Sales_Category` and different `PickArea`.
- Category picker completes their categories; area picker completes their areas.
- Order is marked complete when both “all categories covered” and “all areas covered” by completed confirmations.

---

## 5. Backend files touched

- **Models:** `epickUser.model.ts` (assignmentType, pickRightAreas), `epickConfirmation.model.ts` (pickRightAreas).
- **Validation:** `manager.validation.ts` (createEpickUserSchema, updateEpickUserSchema).
- **Manager service:** create/update EpickUser, getAssignedPickRightAreas, validatePickRightAreaAssignment, getPickRightAreasForEpick.
- **Epick service:** getOrderItem (filter by category or PickArea), acceptOrder (set category/pickRightAreas on confirmation), areAllCategoriesCompleted (include PickRight areas), getOrderPickRightAreas.
- **Dashboard service:** getEpickDashboard and getPickerPerformance (confirmations and order details use category + pickRightAreas; scan attribution by category or area).
- **Routes/controller:** GET `/pickRightAreasForEpick`, manager controller.

---

## 6. CURL examples

**Create EPICK user (Sales Category):**

```bash
curl -X POST "http://localhost:3000/api/distrubutor/createEpickUser" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "picker@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "password": "secret123",
    "userNumber": 101,
    "assignmentType": "sales_category",
    "category": [10, 12]
  }'
```

**Create EPICK user (PickRight Area):**

```bash
curl -X POST "http://localhost:3000/api/distrubutor/createEpickUser" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "picker2@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "password": "secret123",
    "userNumber": 102,
    "assignmentType": "pickright_area",
    "pickRightAreas": ["AREA-A", "AREA-B"]
  }'
```

**Get PickRight areas:**

```bash
curl -X GET "http://localhost:3000/api/distrubutor/pickRightAreasForEpick" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Replace base URL and auth as needed.
