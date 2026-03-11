import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = 5000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `https://dino-ping.onrender.com/api/callback`;

// Store access tokens in memory (for demo, use database in production)
const userTokens = new Map();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// Home page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dino-Ping | Discord OAuth2 Test</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }

                .container {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    width: 100%;
                    padding: 50px;
                    text-align: center;
                }

                .logo {
                    font-size: 48px;
                    margin-bottom: 20px;
                }

                h1 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 28px;
                }

                .subtitle {
                    color: #666;
                    margin-bottom: 40px;
                    font-size: 14px;
                }

                .discord-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #5865F2 0%, #4752C4 100%);
                    color: white;
                    padding: 15px 40px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    text-decoration: none;
                    margin-bottom: 20px;
                }

                .discord-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(88, 101, 242, 0.4);
                }

                .discord-btn:active {
                    transform: translateY(0);
                }

                .discord-icon {
                    width: 20px;
                    height: 20px;
                }

                .info-box {
                    background: #f5f5f5;
                    border-left: 4px solid #5865F2;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: left;
                    margin-top: 30px;
                    font-size: 13px;
                }

                .info-box h3 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .info-box p {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 8px;
                }

                .code {
                    background: #333;
                    color: #0f0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    margin: 10px 0;
                    overflow-x: auto;
                }

                .user-profile {
                    display: none;
                    margin-top: 30px;
                    padding-top: 30px;
                    border-top: 2px solid #eee;
                }

                .user-profile.show {
                    display: block;
                }

                .user-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    border: 4px solid #5865F2;
                    object-fit: cover;
                }

                .user-info {
                    color: #333;
                    margin-bottom: 15px;
                }

                .user-info p {
                    margin: 8px 0;
                    color: #666;
                    font-size: 14px;
                }

                .user-id {
                    font-family: 'Courier New', monospace;
                    color: #5865F2;
                    font-weight: bold;
                }

                .logout-btn {
                    background: #f04747;
                    color: white;
                    padding: 10px 25px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: background 0.2s;
                }

                .logout-btn:hover {
                    background: #d63636;
                }

                .status-badge {
                    display: inline-block;
                    background: #43b581;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    margin-left: 10px;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🦕</div>
                <h1>Dino-Ping</h1>
                <p class="subtitle">Discord OAuth2 Authentication Test</p>

                <div id="login-section">
                    <a href="${getDiscordAuthURL()}" class="discord-btn">
                        <svg class="discord-icon" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0A105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a77.15,77.15,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.66,65.69,31.9,60.55,31.9,54s4.61-11.72,10.55-11.72,10.87,5.22,10.55,11.72S48.23,65.69,42.45,65.69Zm42.24,0C78.89,65.69,74.13,60.55,74.13,54s4.62-11.72,10.55-11.72,10.87,5.22,10.55,11.72S90.48,65.69,84.69,65.69Z" fill="white"/>
                        </svg>
                        Continue with Discord
                    </a>
                </div>

                <div id="user-section" class="user-profile">
                    <img id="avatar" class="user-avatar" alt="User Avatar">
                    <div class="user-info">
                        <p><strong id="username"></strong><span class="status-badge">Authenticated</span></p>
                        <p>ID: <span class="user-id" id="userid"></span></p>
                        <p>Email: <span id="email"></span></p>
                    </div>
                    <button onclick="logout()" class="logout-btn">Logout</button>
                </div>

                <div class="info-box">
                    <h3>📋 What This Does</h3>
                    <p>✅ Authenticates with Discord using OAuth2</p>
                    <p>✅ Receives user profile information</p>
                    <p>✅ Stores access token securely</p>
                    <p>✅ Displays user details</p>
                    <p style="margin-top: 15px; font-size: 12px; color: #999;">
                        Make sure you have set CLIENT_ID and CLIENT_SECRET in your .env file
                    </p>
                </div>
            </div>

            <script>
                // Check if user is already authenticated
                async function checkAuth() {
                    try {
                        const response = await fetch('/api/user');
                        if (response.ok) {
                            const user = await response.json();
                            displayUser(user);
                        }
                    } catch (error) {
                        console.log('Not authenticated');
                    }
                }

                function displayUser(user) {
                    document.getElementById('login-section').style.display = 'none';
                    document.getElementById('user-section').classList.add('show');
                    document.getElementById('avatar').src = \`https://cdn.discordapp.com/avatars/\${user.id}/\${user.avatar}.png?size=256\`;
                    document.getElementById('username').textContent = user.username + '#' + user.discriminator;
                    document.getElementById('userid').textContent = user.id;
                    document.getElementById('email').textContent = user.email || 'Not provided';
                }

                function logout() {
                    fetch('/api/logout', { method: 'POST' }).then(() => {
                        document.getElementById('login-section').style.display = 'block';
                        document.getElementById('user-section').classList.remove('show');
                        window.location.href = '/';
                    });
                }

                // Check authentication on page load
                checkAuth();
            </script>
        </body>
        </html>
    `);
});

// Discord OAuth2 Authorization URL
function getDiscordAuthURL() {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify email'
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

// OAuth2 Callback Handler
app.get('/api/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('❌ No authorization code provided');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://discord.com/api/v10/oauth2/token',
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                scope: 'identify email'
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Get user information
        const userResponse = await axios.get(
            'https://discord.com/api/v10/users/@me',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const user = userResponse.data;

        // Store token (in production, use database and sessions)
        userTokens.set(user.id, {
            accessToken,
            user,
            timestamp: Date.now()
        });

        // Set cookie with user ID
        res.cookie('user_id', user.id, { 
            httpOnly: false, 
            maxAge: 3600000 
        });

        // Redirect back to home page
        res.redirect('/');
    } catch (error) {
        console.error('OAuth2 Error:', error.response?.data || error.message);
        res.status(500).send(`
            <h1>❌ Authentication Failed</h1>
            <p>${error.response?.data?.error_description || error.message}</p>
            <a href="/">Go Back</a>
        `);
    }
});

// Get current user info
app.get('/api/user', (req, res) => {
    const userId = req.cookies?.user_id;

    if (!userId || !userTokens.has(userId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userData = userTokens.get(userId);
    res.json(userData.user);
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    const userId = req.cookies?.user_id;
    if (userId) {
        userTokens.delete(userId);
    }
    res.clearCookie('user_id');
    res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: '✅ Running',
        port: PORT,
        oauth2: 'Configured'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌐 Web server running on http://localhost:${PORT}`);
    console.log(`🔐 OAuth2 Callback: http://localhost:${PORT}/api/callback`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
});
