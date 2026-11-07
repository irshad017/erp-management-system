# SkyBrisk ERP API Documentation

Base URL: `http://localhost:5000/api`  
Interactive Swagger UI: `http://localhost:5000/api-docs`

---

## 1. Authentication

### Register User
- **Method**: `POST`
- **Endpoint**: `/api/register`
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@erp.com",
    "password": "password123",
    "role": "sales"
  }
  ```
- **Response** `(201 Created)`:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "67cb1...",
      "name": "Sarah Connor",
      "email": "sarah@erp.com",
      "role": "sales"
    }
  }
  ```

### Login User
- **Method**: `POST`
- **Endpoint**: `/api/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "admin@erp.com",
    "password": "admin123"
  }
  ```
- **Response** `(200 OK)`:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "67cb1...",
      "name": "Alex Rivera (Admin)",
      "email": "admin@erp.com",
      "role": "admin"
    }
  }
  ```

---

## 2. Products

- `GET /api/products`: Get paginated products (`?page=1&limit=10&search=&category=&status=low|in|out`)
- `GET /api/products/:id`: Get product details
- `POST /api/products`: Create new product (Admin, Purchase, Inventory)
- `PUT /api/products/:id`: Update product
- `DELETE /api/products/:id`: Remove product
- `GET /api/products/alerts/low-stock`: Fetch products where `stock <= reorderLevel`

---

## 3. Customers & Suppliers

- `GET /api/customers`: Get paginated customer accounts
- `POST /api/customers`: Add customer
- `PUT /api/customers/:id`: Update customer
- `DELETE /api/customers/:id`: Delete customer (Admin only)
- `GET /api/suppliers`: Get vendor directory
- `POST /api/suppliers`: Register vendor with payment terms
- `PUT /api/suppliers/:id`: Edit vendor
- `DELETE /api/suppliers/:id`: Delete vendor (Admin only)

---

## 4. Sales Orders & Invoicing

- `GET /api/sales-orders`: List orders with customer details
- `POST /api/sales-orders`: Create order with automated inventory deduction & tax calculations
- `PUT /api/sales-orders/:id`: Update status (`Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)
- `GET /api/invoices`: List corporate invoices
- `POST /api/invoices`: Generate invoice from sales order
- `PUT /api/invoices/:id/status`: Update payment status (`Paid`, `Unpaid`, `Overdue`)

---

## 5. Goods Receipt Notes (GRN)

- `GET /api/grn`: List verified arrival records
- `POST /api/grn`:
  - **Body**:
    ```json
    {
      "purchaseOrderId": "67cb1a4...",
      "deliveryNoteNumber": "DN-4920",
      "receivedItems": [
        {
          "product": "67cb1a1...",
          "orderedQuantity": 40,
          "receivedQuantity": 40,
          "remarks": "Passed Quality Inspection"
        }
      ]
    }
    ```
  - **Logic**: Automatically increments warehouse product stock and updates Purchase Order status to `Received` or `Partially Received`.

---

## 6. Dashboard Analytics

- `GET /api/dashboard/stats`:
  - Returns aggregate KPIs (Total Revenue, Purchase Cost, Net Margin, Active Orders, Low Stock Alerts)
  - Returns 6-month financial performance trends for charting
  - Returns category inventory distribution and order status breakdown

