# Order Completion Data Flow Explanation

## Your Scenario:

**Order Number: 123**

- **Item 1**: Qty 2 (both scanned normally)
- **Item 2**: Qty 2 (1 qty passed with note "damaged", 1 qty scanned)
- **Item 3**: Qty 2 (1 qty is substitute, 1 qty scanned normally)
- **Item 4**: Qty 2 (both scanned normally)

---

## PostgreSQL Tables That Will Have Data:

### 1. **Order_Pick** Table (PostgreSQL)

**Table Name:** `Order_Pick`

**What Happens:**

- When order is completed, the status is updated to `'completed'`
- `completedAt` timestamp is set
- `scannedLines` and `scannedQty` are updated (these are cumulative from all scans)

**Example Data:**

```sql
orderNumber: 123
status: 'completed'
completedAt: '2024-01-15 10:30:00'
scannedLines: 5  -- (Item 1: 1 line, Item 2: 1 line, Item 3: 2 lines, Item 4: 1 line)
scannedQty: 5    -- (Item 1: 2, Item 2: 1, Item 3: 2, Item 4: 2)
```

---

### 2. **Order_Pick_Scan** Table (PostgreSQL)

**Table Name:** `Order_Pick_Scan`

**What Happens:**

- Stores ALL scanned items (both regular and substitute items)
- Each scan entry links to a box via `boxId`
- Substitute items have `isSubsitute = true`

**Data Entries for Your Scenario:**

| id  | orderNumber | itemNumber | qty | isSubsitute | boxId |
| --- | ----------- | ---------- | --- | ----------- | ----- | ----------------------------------- |
| 1   | 123         | 1          | 2   | false       | 10    |
| 2   | 123         | 2          | 1   | false       | 10    |
| 3   | 123         | 3          | 1   | **true**    | 10    | ← Substitute item (the replacement) |
| 4   | 123         | 3          | 1   | false       | 10    | ← Original item scanned normally    |
| 5   | 123         | 4          | 2   | false       | 10    |

**Key Points:**

- **Item 1**: 1 record with qty=2 (both scanned)
- **Item 2**: 1 record with qty=1 (only the scanned one, not the passed one)
- **Item 3**: 2 records:
  - 1 record with `isSubsitute=true` (the substitute product that was scanned)
  - 1 record with `isSubsitute=false` (the original item scanned normally)
- **Item 4**: 1 record with qty=2 (both scanned)

---

### 3. **passScanItems** Table (PostgreSQL)

**Table Name:** `passScanItems`

**What Happens:**

- Stores items that were **passed/skipped** (not scanned)
- Includes items that were substituted (original item is marked as passed)
- Can have manager notes (like "damaged")

**Data Entries for Your Scenario:**

| id  | order_number | item_number | user_id | note      | quantity_scanned | is_active |
| --- | ------------ | ----------- | ------- | --------- | ---------------- | --------- |
| 1   | 123          | 2           | 5       | "damaged" | 0                | true      |
| 2   | 123          | 3           | 5       | NULL      | 0                | true      |

**Key Points:**

- **Item 2**: 1 record with `note="damaged"` (the 1 qty that was passed/skipped)
- **Item 3**: 1 record with `note=NULL` (the original item that was substituted - auto-created by system)

**Note:** The `quantity_scanned` field starts at 0 and tracks how many were scanned after being passed (if any).

---

### 4. **Order_Detail** Table (MMSQL - NOT PostgreSQL)

**Table Name:** `Order_Detail`

**What Happens:**

- `Quantity_Shipped` is updated for each item based on what was scanned
- For substitute items, a **NEW OrderDetail record** is created for the substitute product
- Original items that were substituted have `Quantity_Shipped` reset to 0

**Data Changes for Your Scenario:**

**Original Order_Detail Records (Before):**
| Order_Number | Item_Number | Line_Number | Quantity_Ordered | Quantity_Shipped |
|--------------|-------------|-------------|------------------|------------------|
| 123 | 1 | 1 | 2 | 0 |
| 123 | 2 | 2 | 2 | 0 |
| 123 | 3 | 3 | 2 | 0 |
| 123 | 4 | 4 | 2 | 0 |

**After Order Completion:**

**Updated Records:**
| Order_Number | Item_Number | Line_Number | Quantity_Ordered | Quantity_Shipped |
|--------------|-------------|-------------|------------------|------------------|
| 123 | 1 | 1 | 2 | **2** | ← Updated
| 123 | 2 | 2 | 2 | **1** | ← Updated (only 1 scanned)
| 123 | 3 | 3 | 2 | **0** | ← Reset to 0 (substituted)
| 123 | 4 | 4 | 2 | **2** | ← Updated

**New Record Created (for substitute):**
| Order_Number | Item_Number | Line_Number | Quantity_Ordered | Quantity_Shipped |
|--------------|-------------|-------------|------------------|------------------|
| 123 | **999** | **5** | 1 | **1** | ← NEW: Substitute item (e.g., item 999)

**Key Points:**

- **Item 1**: `Quantity_Shipped = 2` (both scanned)
- **Item 2**: `Quantity_Shipped = 1` (only 1 scanned, 1 passed)
- **Item 3**: `Quantity_Shipped = 0` (original item reset because substitute was used)
- **Item 4**: `Quantity_Shipped = 2` (both scanned)
- **NEW**: Substitute item (e.g., item 999) gets a new OrderDetail record with `Quantity_Shipped = 1`

---

### 5. **Order_Header** Table (MMSQL - NOT PostgreSQL)

**Table Name:** `Order_Header`

**What Happens:**

- `Picker_ID` is updated with the picker's user number
- `Bundles` and `Totes` counts are updated based on boxes created
- `Confirmed` status may be updated

**Example Data:**

```sql
Order_Number: 123
Picker_ID: 5  -- (picker's userNumber from WebUsers table)
Bundles: 2    -- (count of boxes + drinks)
Totes: 0      -- (count of totes)
```

---

## Summary Table:

| Table (Database)                 | What It Stores                           | Your Scenario Data                                      |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| **Order_Pick** (PostgreSQL)      | Order picking status and metadata        | Status = 'completed', scannedLines = 5, scannedQty = 5  |
| **Order_Pick_Scan** (PostgreSQL) | All scanned items                        | 5 records (Item 1: 1, Item 2: 1, Item 3: 2, Item 4: 1)  |
| **passScanItems** (PostgreSQL)   | Passed/skipped items with notes          | 2 records (Item 2 with "damaged" note, Item 3 original) |
| **Order_Detail** (MMSQL)         | Order line items with shipped quantities | 4 updated + 1 new (substitute)                          |
| **Order_Header** (MMSQL)         | Order header with picker info            | Picker_ID, Bundles, Totes updated                       |

---

## Important Notes:

1. **Substitute Items:**

   - When you scan a substitute, the **original item** goes into `passScanItems` (auto-created)
   - The **substitute item** goes into `Order_Pick_Scan` with `isSubsitute=true`
   - A **new OrderDetail record** is created for the substitute item

2. **Passed Items:**

   - Items passed with notes (like "damaged") go into `passScanItems` with the note
   - The `Quantity_Shipped` in Order_Detail is NOT incremented for passed items

3. **Regular Scanned Items:**

   - Go into `Order_Pick_Scan` with `isSubsitute=false`
   - `Quantity_Shipped` in Order_Detail is incremented

4. **Order Completion:**
   - All `Order_Detail.Confirmed` fields are set to `true`
   - `Order_Pick.status` is set to `'completed'`
   - Lock record is removed from `Record_Locks` table
