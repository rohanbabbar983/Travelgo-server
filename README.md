# TravelGo - Server

The **TravelGo Server** is the backend of the TravelGo travel booking platform.  
It provides REST APIs for managing trips, hotels, tourist attractions, and chatbot responses.

## Live Demo

Check out the live site: https://travelgo-client.onrender.com/

## Features

- **Trips API** – Fetch travel packages by city name.  
- **Hotels API** – Get hotels with price, rating, and description.  
- **Attractions API** – Provide tourist attractions for each city.  
- **Chatbot API** – Rule-based travel Q&A.  
- **RESTful API** – Clean and structured endpoints.

## Tech Stack

- **Node.js** – Backend runtime  
- **Express.js** – Server framework  
- **CORS & Body-Parser** – Middleware  
- **Static JSON / MongoDB** – Data source 

## Installation

1. Clone the repository
    ```bash
    git clone https://github.com/rohanbabbar983/Travelgo-server.git
    cd Travelgo-server
    ```

2. Install dependencies
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the necessary environment variables:
    ```env
    FRONTEND_URL= your_frontend_url
    PORT = 5000
    ```

4. Start the server
    ```bash
    npm run dev
    ```

## Usage

The backend server will run on `http://localhost:5000`.


## Known Issues

- Chatbot supports only predefined Q&A.
- Currently uses static JSON (can be replaced with MongoDB).
- No Authentication and Authorization is implemented.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
