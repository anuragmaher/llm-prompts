// Script to add Hiver Support Query to existing variable sets
// Run this in your browser console while the app is open

console.log('Adding Hiver Support Query to existing variable sets...');

// Get existing variable sets
const existingData = localStorage.getItem('llm-prompt-tester-variable-sets');
if (!existingData) {
  console.error('No existing variable sets found');
} else {
  const variableSets = JSON.parse(existingData);
  console.log('Current variable sets:', variableSets.length);
  
  // Check if Hiver Support Query already exists
  const hiverExists = variableSets.find(set => set.id === 'hiver-support-query');
  if (hiverExists) {
    console.log('Hiver Support Query already exists');
  } else {
    // Add the new Hiver Support Query
    const baseTimestamp = Date.now();
    const hiverVariableSet = {
      id: 'hiver-support-query',
      name: 'Hiver Support Query',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Alex Support",
          "role": "Technical Support Specialist"
        },
        "email_thread": [
          {
            "from": "Sarah Johnson <sarah.johnson@acmecorp.com>",
            "to": "Alex Support <support@hiverhq.com>",
            "content": "Hi Hiver Support Team,\\n\\nI'm having trouble getting Hiver to work properly in my Gmail. The extension seems to install fine, but most of the features aren't showing up in my inbox.\\n\\nHere's my current setup:\\n- Browser: Firefox 121.0\\n- Operating System: Windows 11\\n- Gmail View: Basic HTML (company policy)\\n- RAM: 16 GB\\n- Internet Speed: 50 Mbps\\n- Other Extensions: Boomerang for Gmail, Streak CRM\\n\\nI really need this working for our team collaboration. Can you help me troubleshoot this issue?\\n\\nBest regards,\\nSarah Johnson\\nProject Manager, Acme Corporation"
          }
        ],
        "chat_history": "Customer is using Firefox browser and Basic HTML Gmail view, which are not supported by Hiver. Also has conflicting extensions installed.",
        "user_intent": "Provide helpful troubleshooting steps and explain system requirements in a friendly, professional manner"
      }, null, 2),
      createdAt: baseTimestamp - 30000,
      lastModified: baseTimestamp - 30000
    };
    
    // Add to the beginning of the array (so it appears at the top)
    variableSets.unshift(hiverVariableSet);
    
    // Save back to localStorage
    localStorage.setItem('llm-prompt-tester-variable-sets', JSON.stringify(variableSets));
    
    console.log('✅ Hiver Support Query added successfully!');
    console.log('Reloading page to see changes...');
    
    // Reload the page to see the changes
    window.location.reload();
  }
}