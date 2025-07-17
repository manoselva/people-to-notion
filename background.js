// Handle authentication messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTHENTICATE_NOTION') {
    authenticateNotion();
  }
  return true;
});

// Authenticate with Notion
function authenticateNotion() {
  const clientId = "1fcbdaab-9658-4d46-8122-6dc7f30a90c7";
  const redirectUri = encodeURIComponent("https://wvcyqenqqdebyklxsgqg.supabase.co/auth/v1/callback");
  
  const state = generateState(20);
  chrome.storage.local.set({oauthState: state});
  
  const authUrl = `https://www.notion.so/install-integration?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  
  // Open authentication window
  chrome.windows.create({
    url: authUrl,
    type: 'popup',
    width: 600,
    height: 800
  });
}

// Generate random state
function generateState(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Listen for redirect after authentication
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.url.includes('https://wvcyqenqqdebyklxsgqg.supabase.co/auth/v1/callback')) {
    const urlParams = new URLSearchParams(details.url.split('?')[1]);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    chrome.storage.local.get('oauthState', (result) => {
      if (state === result.oauthState) {
        // Store authentication status
        chrome.storage.local.set({notionAuthenticated: true});
        
        // Notify popup
        chrome.runtime.sendMessage({type: 'NOTION_AUTH_COMPLETE'});
      }
    });
  }
}, {url: [{urlMatches: 'https://wvcyqenqqdebyklxsgqg.supabase.co/auth/v1/callback*'}]});
