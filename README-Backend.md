# GFlights Backend API Integration

This document explains how to set up the backend API integration for the GFlights React Native app.

## Overview

The backend integrates with the Amadeus API to provide real-time flight search functionality. The frontend uses mock data for demonstration, but can be easily connected to a real backend.

## Backend Setup

### 1. Install Dependencies

```bash
npm install express cors axios dotenv
```

### 2. Environment Configuration

Copy `env.example` to `.env` and fill in your Amadeus API credentials:

```bash
cp env.example .env
```

Get your API credentials from [Amadeus Developer Portal](https://developers.amadeus.com/get-started).

### 3. Run the Backend

```bash
node backend-example.js
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Flight Search
- **POST** `/flights/search`
- **Body**: Flight search parameters (origin, destination, dates, passengers, etc.)
- **Response**: Flight offers from Amadeus API

### Airport Search
- **GET** `/airports/search?q=JFK`
- **Response**: List of airports matching the query

### Popular Routes
- **GET** `/routes/popular`
- **Response**: Mock data of popular flight routes

### Health Check
- **GET** `/health`
- **Response**: API status and timestamp

## Frontend Integration

To connect the React Native app to the real backend:

1. Update the API base URL in `src/api/index.ts`:
```typescript
const BASE_URL = 'http://your-backend-url:3000';
```

2. The flight service in `src/services/flightService.ts` is already set up to make real API calls when the mock data is removed.

## Amadeus API Features

The integration supports:
- ✅ Flight search (one-way and round-trip)
- ✅ Airport code lookup
- ✅ Real-time pricing
- ✅ Multiple airlines
- ✅ Different cabin classes
- ✅ Passenger types (adults, children, infants)
- ✅ Date range searches

## Rate Limits

Amadeus API has rate limits:
- **Test Environment**: 2000 calls/month
- **Production**: Based on your subscription

## Error Handling

The backend handles common errors:
- Invalid search parameters
- API authentication failures
- Network timeouts
- Rate limit exceeded

## Security Considerations

- Store API credentials securely in environment variables
- Use HTTPS in production
- Implement proper authentication for your endpoints
- Validate all input parameters
- Handle sensitive data appropriately

## Next Steps

1. Set up Amadeus API credentials
2. Deploy backend to a cloud service (Heroku, AWS, etc.)
3. Update frontend API configuration
4. Test the complete integration
5. Implement booking functionality (requires additional Amadeus API endpoints)
