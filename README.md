# LysspieAPI

LysspieAPI is a backend web interface and API for managing Nightbot commands, queue management, and user interactions for a Twitch stream. The API includes user authentication using JWT tokens, queue management features, and a live dashboard with user controls.

## Features

- User authentication with JWT tokens
- Queue management (join, leave, skip, position)
- Nine lives management for user moderation
- Real-time data fetching and auto-refresh
- Random user selection from the queue
- Interactive and responsive dashboard interface

## Requirements

- Python 3.8+
- Flask
- PostgreSQL or MySQL database

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/LysspieAPI.git
    cd LysspieAPI
    ```

2. Create a virtual environment and activate it:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. Set up your `.env` file with the following variables:

    ```env
    DEBUG=True
    PRODUCTION=False
    DATABASE=POSTGRES  # or MYSQL
    POSTGRES_DEV_URI=your_postgres_dev_uri
    POSTGRES_PROD_URI=your_postgres_prod_uri
    MYSQL_DEV_URI=your_mysql_dev_uri
    MYSQL_PROD_URI=your_mysql_prod_uri
    JWT_SECRET_KEY=your_secret_key
    JWT_DEFAULT_TIMEOUT=15  # timeout in minutes
    ```

5. Run the application:

    ```bash
    python app.py
    ```

## Endpoints

### Authentication

- `POST /login`: User login endpoint. Expects `email` and `password` in the request body. Returns a JWT token.

### Queue Management

- `GET /api/queue?action=join&username=<username>`: Add a user to the queue.
- `GET /api/queue?action=leave&username=<username>`: Remove a user from the queue.
- `GET /api/queue?action=skip&username=<username>`: Skip the current user in the queue.
- `GET /api/queue?action=position&username=<username>`: Get the position of a user in the queue.
- `POST /api/clean_queue`: Clear the entire queue.
- `POST /api/update_queue_order`: Update the order of users in the queue.

### Nine Lives Management

- `GET /api/ninelives?username=<username>`: Manage nine lives for a user.
- `POST /api/adjust_lives?username=<username>&amount=<amount>`: Adjust the number of lives for a user.
- `POST /api/ban_user?username=<username>`: Ban a user from the chat.

## Dashboard

The dashboard provides an interactive interface for managing the queue and user lives. It includes features for:
- Viewing and managing the queue.
- Adjusting user lives and banning users.
- Randomly selecting users from the queue.
- Auto-refreshing data and real-time updates.

## Security

- JWT tokens are used for authentication and are configured to expire based on the `JWT_DEFAULT_TIMEOUT` value in the `.env` file.
- Tokens are cleared on browser close or tab exit to enhance security.

## Contribution

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the GPL-3.0 License.
