# SkyBrisk ERP System Architecture

## 1. High-Level System Architecture

```mermaid
graph TD
    Client["React Frontend (Vite + Tailwind + Redux Toolkit)"]
    API["Express.js REST API Server (Node.js)"]
    Auth["JWT & Role-Based Access Control (RBAC)"]
    DB[(MongoDB Database / In-Memory Fallback)]
    PDF["jsPDF Engine (Client-side Invoice Generator)"]
    Swagger["Interactive Swagger API Docs (/api-docs)"]

    Client -->|HTTP / JSON Requests with Bearer JWT| API
    Client -->|Generates Corporate Invoices| PDF
    API -->|Validates Token & Permissions| Auth
    API -->|Mongoose ODM Queries & Aggregations| DB
    API -->|Serves OpenAPI Docs| Swagger
```

## 2. Core Business Workflow: Procurement to Inventory (GRN)

```mermaid
sequenceDiagram
    autonumber
    actor Procurement as Purchase Manager
    actor Warehouse as Warehouse Officer
    participant System as SkyBrisk ERP API
    participant DB as MongoDB Collections

    Procurement->>System: POST /api/purchase-orders (Issue PO to Supplier)
    System->>DB: Save PurchaseOrder with status: 'Issued'
    Note over Warehouse: Physical goods arrive at loading dock
    Warehouse->>System: POST /api/grn (Submit Goods Receipt Note)
    System->>DB: Record GRN linked to PO
    System->>DB: Automatically increment Product.stock by receivedQuantity
    System->>DB: Update PurchaseOrder status to 'Received' or 'Partially Received'
    System-->>Warehouse: 201 Created & Stock updated
```

## 3. Order-to-Cash Workflow (Sales to Invoicing)

```mermaid
sequenceDiagram
    autonumber
    actor Sales as Sales Manager
    actor Client as Customer
    participant API as SkyBrisk ERP API
    participant PDF as PDF Invoice Engine

    Sales->>API: POST /api/sales-orders (Create Order)
    API->>API: Verify stock & compute subtotals, tax & discount
    API->>API: Deduct item quantities from Product stock
    Sales->>API: POST /api/invoices (Generate Invoice from Order)
    API->>API: Mark Sales Order isInvoiced = true
    Sales->>PDF: Export Invoice to PDF (jsPDF)
    Sales->>Client: Send Invoice & Payment Details
    Client->>Sales: Settles Invoice Payment
    Sales->>API: PUT /api/invoices/:id/status (Mark 'Paid')
    API->>API: Auto-synchronize SalesOrder paymentStatus = 'Paid'
```

## 4. Role-Based Access Control (RBAC) Matrix

| Module / Endpoint | Admin | Sales | Purchase | Inventory |
|---|:---:|:---:|:---:|:---:|
| **Dashboard KPIs & Charts** | Full Access | Full Access | Full Access | Full Access |
| **Products Catalog** | Read / Write | Read Only | Read / Write | Read / Write |
| **Customer Directory** | Read / Write | Read / Write | Read Only | Read Only |
| **Supplier Directory** | Read / Write | Read Only | Read / Write | Read Only |
| **Sales Orders** | Full Access | Full Access | Read Only | Read Only |
| **Purchase Orders** | Full Access | Read Only | Full Access | Read Only |
| **Goods Receipt Note (GRN)** | Full Access | Read Only | Full Access | Full Access |
| **Invoicing & Billing** | Full Access | Full Access | Read Only | Read Only |
| **User Management (RBAC)** | Full Access | No Access | No Access | No Access |
