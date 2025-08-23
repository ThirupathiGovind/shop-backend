# ProShop eCommerce Platform

> eCommerce platform built with the MERN stack & Redux.

![Screenshot](https://github.com/bradtraversy/proshop_mern/blob/master/uploads/Screen%20Shot%202020-09-29%20at%205.50.52%20PM.png)

## Features

- Full-featured shopping cart
- Product reviews and ratings
- Top products carousel
- Product pagination
- Product search feature
- User profile with orders
- Admin product management
- Admin user management
- Admin order details page
- Mark orders as delivered option
- Checkout process (shipping, payment method, etc.)
- PayPal / credit card integration
- Database seeder (products & users)

## Usage

### ES Modules in Node

We use ECMAScript Modules in the backend for this project.  
Make sure you have at least Node v14.6+, or add the `--experimental-modules` flag if using an older version.

When importing a file (not a package), add `.js` at the end to avoid "module not found" errors.

You can also install and set up Babel if you prefer.

### Environment Variables

Create a `.env` file in the root directory and add the following:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongo_URI
JWT_SECRET=abc123
PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Install Dependencies

```sh
npm install
```

### Run the Server

```sh
npm start
```

The Node server will run at [http://localhost:5000](http://localhost:5000).

### Seed the Database

Use the following commands to seed the database with sample users and products, or to destroy all data:

```sh
npm run data:import    # Import sample data
npm run data:destroy   # Destroy all data
```

### Sample User Logins

| Email              | Role    | Password |
|--------------------|---------|----------|
| admin@example.com  | Admin   | 123456   |
| john@example.com   | Customer| 123456   |
| jane@example.com   | Customer| 123456   |