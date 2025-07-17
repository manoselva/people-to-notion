// Add "Add to Notion" button to LinkedIn profile pages
if (window.location.host.includes('linkedin.com') && window.location.pathname.startsWith('/in/')) {
  injectNotionButton();
}

function injectNotionButton() {
  // Check if button already exists
  if (document.getElementById('add-to-notion-btn')) return;
  
  // Create button
  const button = document.createElement('button');
  button.id = 'add-to-notion-btn';
  button.className = 'add-to-notion-btn';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="white"/>
      <path d="M8 7V17M16 7V17M12 3V21" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Add to Notion
  `;
  
  // Find LinkedIn action container
  const actionsContainer = document.querySelector('.pv-top-card-v2-ctas') || 
                          document.querySelector('.pv-top-card__actions');
  
  // Add button to container
  if (actionsContainer) {
    actionsContainer.prepend(button);
  }
  
  // Add click handler
  button.addEventListener('click', () => {
    extractProfileData();
  });
}

// Extract LinkedIn profile data
function extractProfileData() {
  const profileData = {
    name: document.querySelector('h1')?.innerText.trim() || '',
    url: window.location.href.split('?')[0],
    activityUrl: window.location.href + '/overlay/contact-info/recent-activity/all/',
    photo: document.querySelector('.pv-top-card-profile-picture__image')?.src || '',
    bio: document.querySelector('.text-body-medium')?.innerText.trim() || '',
    location: document.querySelector('.pv-text-details__left-panel .text-body-small')?.innerText.trim() || '',
    education: '',
    experience: '',
    email: '',
    phone: ''
  };
  
  // Extract education
  const educationElements = document.querySelectorAll('#education-section .pv-entity__school-name');
  profileData.education = Array.from(educationElements).map(el => el.innerText.trim()).join('; ');
  
  // Extract experience
  const experienceElements = document.querySelectorAll('#experience-section .pv-entity__position-group');
  profileData.experience = Array.from(experienceElements).map(el => {
    const title = el.querySelector('h3')?.innerText.trim() || '';
    const company = el.querySelector('.pv-entity__secondary-title')?.innerText.trim() || '';
    return `${title} at ${company}`;
  }).join('; ');
  
  // Extract contact info
  chrome.runtime.sendMessage({
    type: 'PROFILE_DATA_EXTRACTED',
    data: profileData
  });
}

// Extract contact info from modal
function extractContactInfo() {
  const contactUrl = `${window.location.href}/overlay/contact-info/`;
  
  fetch(contactUrl)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract email
      const emailElement = doc.querySelector('.ci-email a');
      if (emailElement) {
        chrome.runtime.sendMessage({
          type: 'PROFILE_EMAIL_EXTRACTED',
          email: emailElement.innerText.trim()
        });
      }
      
      // Extract phone
      const phoneElement = doc.querySelector('.ci-phone a');
      if (phoneElement) {
        chrome.runtime.sendMessage({
          type: 'PROFILE_PHONE_EXTRACTED',
          phone: phoneElement.innerText.trim()
        });
      }
    });
}

// Extract contact info from cover text
function extractFromCoverText() {
  const coverText = document.querySelector('.pv-about__summary-text')?.innerText || '';
  const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+\d{1,3})?[\d\s()-]{7,}/;
  
  const emailMatch = coverText.match(emailRegex);
  const phoneMatch = coverText.match(phoneRegex);
  
  if (emailMatch) {
    chrome.runtime.sendMessage({
      type: 'PROFILE_EMAIL_EXTRACTED',
      email: emailMatch[0]
    });
  }
  
  if (phoneMatch) {
    chrome.runtime.sendMessage({
      type: 'PROFILE_PHONE_EXTRACTED',
      phone: phoneMatch[0]
    });
  }
}

// Start contact info extraction
extractContactInfo();
extractFromCoverText();
