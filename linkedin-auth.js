import 'dotenv/config';
import express from 'express';
import axios from 'axios';

const app = express();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

// Step 1: Redirect user to LinkedIn for authentication
app.get('/auth/linkedin', (req, res) => {
  const scope = 'r_liteprofile r_emailaddress';
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
  res.redirect(authUrl);
});

// Step 2: LinkedIn redirects back to your site with a code
app.get('/auth/linkedin/callback', async (req, res) => {
  const code = req.query.code;
  try {
    // Step 3: Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;

    // Step 4: Use access token to get user info
    const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const emailRes = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    res.json({
      profile: profileRes.data,
      email: emailRes.data.elements[0]['handle~'].emailAddress
    });
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
