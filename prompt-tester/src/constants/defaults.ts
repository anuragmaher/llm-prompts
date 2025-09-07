import { SavedVariableSet } from '../types';

export const DEFAULT_VARIABLES = JSON.stringify({
  "agent_info": {
    "name": "Anurag Maherchandani",
    "role": "AI Leader"
  },
  "email_thread": [
    {
      "from": "Sarah Johnson <sarah.johnson@example.com>",
      "to": "Anurag Maherchandani <anurag@grexit.com>",
      "content": "Hi Anurag, just checking if we are still on for our meeting tomorrow at 10 AM?"
    }
  ],
  "chat_history": "You previously confirmed 10 AM works and asked whether we'd use the west conference room.",
  "user_intent": "Confirm the meeting time politely and express that you're looking forward to it."
}, null, 2);

export const DEFAULT_PROMPT = `You are a helpful and precise email drafting assistant in a productivity copilot.

🔒 Knowledge Rules

RAG-only troubleshooting: When providing troubleshooting steps, you must only include steps that are explicitly present in rag_context. Do not invent, assume, or add generic steps such as clearing cache, reinstalling, updating, or re-logging in unless they appear in the documentation.

Generic fallback: If no relevant troubleshooting information is available in rag_context, create a polite, generic support response (e.g., asking for more details) without suggesting unsupported steps.

No external deep knowledge: Do not use assumptions about Hiver beyond what is in rag_context.

Paraphrase for readability: Always rewrite rag_context facts in natural, professional language.

📌 Email Drafting Rules

Always sign with agent_info: {{agent_info}}

Use email_thread for context: {{email_thread}}

Use user_intent for purpose and tone: {{user_intent}}

Use chat_history for additional context if provided: {{chat_history}}

Extract relevant information from rag_context: {{rag_context}}

Structure troubleshooting responses as a clear list with short headings (e.g., Browser, Gmail settings, etc.).

Keep tone warm, empathetic, and professional.

Always end with an offer to help further if issues persist.

📌 Fallback Behavior

If user_intent is clear → Draft the email as above.

If user_intent is missing or unclear → Return exactly 5 candidate intents as a JSON array of short strings, ordered most likely to least likely.

If rag_context is empty → Draft a generic support email based on user_intent and email_thread (do not mention missing documentation).

✅ Example Behavior

If rag_context includes system requirements → The email should explain them in a numbered list, paraphrased for readability.

If rag_context does not include password reset steps → The email should still provide a generic support response (e.g., "I'd be happy to help you with this. Could you please share a bit more detail about the issue so I can guide you further?").`;

export const getPredefinedVariableSets = (): SavedVariableSet[] => {
  const baseTimestamp = Date.now();
  return [
    {
      id: 'meeting-reschedule',
      name: 'Meeting Reschedule Request',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Sarah Chen",
          "role": "Product Manager"
        },
        "email_thread": [
          {
            "from": "Michael Rodriguez <michael.r@clientfirm.com>",
            "to": "Sarah Chen <sarah.chen@techcorp.com>",
            "content": "Hi Sarah, I need to reschedule our product demo meeting scheduled for Thursday 2pm. Something urgent came up. Can we move it to next week?"
          }
        ],
        "chat_history": "Client has been very engaged in our product discussions and this is a high-priority demo for Q1 closing.",
        "user_intent": "Accommodate the reschedule request professionally and propose 3 specific time slots next week"
      }, null, 2),
      createdAt: baseTimestamp - 600000,
      lastModified: baseTimestamp - 600000
    },
    {
      id: 'project-status',
      name: 'Project Status Update',
      variables: JSON.stringify({
        "agent_info": {
          "name": "David Park",
          "role": "Engineering Lead"
        },
        "email_thread": [
          {
            "from": "Lisa Thompson <lisa.t@startup.io>",
            "to": "David Park <david.park@devstudio.com>",
            "content": "Hey David, haven't heard updates on the mobile app development in a while. How are we tracking against the March 15th deadline? Any blockers I should know about?"
          }
        ],
        "chat_history": "Project is 85% complete, slightly behind due to API integration challenges, but still on track for deadline.",
        "user_intent": "Provide honest status update with timeline reassurance and mention one current blocker"
      }, null, 2),
      createdAt: baseTimestamp - 540000,
      lastModified: baseTimestamp - 540000
    },
    {
      id: 'budget-approval',
      name: 'Budget Approval Request',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Jennifer Walsh",
          "role": "Marketing Director"
        },
        "email_thread": [
          {
            "from": "Robert Kim <robert.kim@headquarters.com>",
            "to": "Jennifer Walsh <j.walsh@marketingplus.com>",
            "content": "Jennifer, I received your budget proposal for the Q2 campaign. The numbers seem high - can you break down the $75K request and justify the ROI projections?"
          }
        ],
        "chat_history": "Budget includes $30K for paid ads, $25K for content creation, $20K for events - all backed by historical performance data.",
        "user_intent": "Provide detailed budget breakdown with ROI justification and offer to schedule a call for discussion"
      }, null, 2),
      createdAt: baseTimestamp - 480000,
      lastModified: baseTimestamp - 480000
    },
    {
      id: 'customer-complaint',
      name: 'Customer Complaint Resolution',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Amanda Foster",
          "role": "Customer Success Manager"
        },
        "email_thread": [
          {
            "from": "Angry Customer <john.davis@businessclient.com>",
            "to": "Amanda Foster <amanda.foster@customercare.com>",
            "content": "This is unacceptable! Your software crashed during our live presentation to investors. We lost a potential $2M deal because of this. I want immediate answers and compensation!"
          }
        ],
        "chat_history": "Incident occurred during high-traffic period, technical team identified root cause as server overload, fix deployed.",
        "user_intent": "Apologize sincerely, explain root cause, offer compensation, and outline prevention measures"
      }, null, 2),
      createdAt: baseTimestamp - 420000,
      lastModified: baseTimestamp - 420000
    },
    {
      id: 'job-interview',
      name: 'Job Interview Scheduling',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Marcus Johnson",
          "role": "HR Business Partner"
        },
        "email_thread": [
          {
            "from": "Emma Wilson <emma.wilson.dev@gmail.com>",
            "to": "Marcus Johnson <marcus.johnson@hiringfirm.com>",
            "content": "Hi Marcus, thank you for considering my application for the Senior React Developer position. I'm excited about the opportunity and available for interviews next week."
          }
        ],
        "chat_history": "Candidate has strong background, passed initial screening, ready for technical interview with engineering team.",
        "user_intent": "Schedule technical interview, explain interview process, and set expectations for next steps"
      }, null, 2),
      createdAt: baseTimestamp - 360000,
      lastModified: baseTimestamp - 360000
    },
    {
      id: 'partnership-proposal',
      name: 'Partnership Proposal Follow-up',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Rachel Green",
          "role": "Business Development Director"
        },
        "email_thread": [
          {
            "from": "Tom Anderson <t.anderson@partnertech.com>",
            "to": "Rachel Green <rachel.green@bizdev.com>",
            "content": "Rachel, we've reviewed your partnership proposal internally. The terms look interesting but we have some concerns about the revenue sharing model. Can we discuss modifications?"
          }
        ],
        "chat_history": "Initial proposal was 60/40 split, they want to negotiate to 70/30, we have some flexibility but need to maintain minimum margins.",
        "user_intent": "Show flexibility on terms while protecting key business interests and suggest a meeting to discuss details"
      }, null, 2),
      createdAt: baseTimestamp - 300000,
      lastModified: baseTimestamp - 300000
    },
    {
      id: 'event-planning',
      name: 'Event Planning Coordination',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Alex Rodriguez",
          "role": "Event Coordinator"
        },
        "email_thread": [
          {
            "from": "Corporate Client <events@bigcorp.com>",
            "to": "Alex Rodriguez <alex.rodriguez@eventspro.com>",
            "content": "Alex, we need to finalize details for the annual conference next month. 500 attendees confirmed. Need updates on catering, AV setup, and speaker arrangements."
          }
        ],
        "chat_history": "Catering confirmed for 500+50 buffer, AV team scheduled for setup day before, 2 keynote speakers confirmed, 1 still pending.",
        "user_intent": "Provide comprehensive status update on all event elements and request final headcount confirmation"
      }, null, 2),
      createdAt: baseTimestamp - 240000,
      lastModified: baseTimestamp - 240000
    },
    {
      id: 'vendor-negotiation',
      name: 'Vendor Negotiation',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Kevin Liu",
          "role": "Procurement Manager"
        },
        "email_thread": [
          {
            "from": "Supplier Rep <sales@supplierco.com>",
            "to": "Kevin Liu <kevin.liu@procurement.com>",
            "content": "Kevin, we've prepared a new quote based on your volume requirements. The pricing is $12 per unit for 10K units, with 30-day payment terms. This is our best offer."
          }
        ],
        "chat_history": "Market rate is $10-11 per unit, we need 15-day payment terms to match cash flow, relationship is important for future orders.",
        "user_intent": "Negotiate price down to $10.50 per unit and request 15-day payment terms while maintaining positive relationship"
      }, null, 2),
      createdAt: baseTimestamp - 180000,
      lastModified: baseTimestamp - 180000
    },
    {
      id: 'product-launch',
      name: 'Product Launch Announcement',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Priya Patel",
          "role": "Product Marketing Manager"
        },
        "email_thread": [
          {
            "from": "Industry Reporter <news@techdaily.com>",
            "to": "Priya Patel <priya.patel@innovation.com>",
            "content": "Hi Priya, heard rumors about your new AI-powered analytics platform launching next month. Can you share any details for our upcoming feature story on emerging business intelligence tools?"
          }
        ],
        "chat_history": "Launch is March 1st, key features include real-time analytics, predictive modeling, and 50% faster processing than competitors.",
        "user_intent": "Share exciting product details while maintaining some mystery and offer exclusive interview opportunity"
      }, null, 2),
      createdAt: baseTimestamp - 120000,
      lastModified: baseTimestamp - 120000
    },
    {
      id: 'crisis-communication',
      name: 'Crisis Communication',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Victoria Chang",
          "role": "Communications Director"
        },
        "email_thread": [
          {
            "from": "Board Member <james.wilson@boardmember.com>",
            "to": "Victoria Chang <victoria.chang@corpcomms.com>",
            "content": "Victoria, the data breach news is spreading on social media. We need a clear communication strategy before the press picks this up. What's our response plan?"
          }
        ],
        "chat_history": "Breach affected 1,000 users, no financial data compromised, security team contained it within 2 hours, all users notified.",
        "user_intent": "Present clear crisis communication plan focusing on transparency, user safety, and steps taken to prevent future incidents"
      }, null, 2),
      createdAt: baseTimestamp - 60000,
      lastModified: baseTimestamp - 60000
    },
    {
      id: 'hiver-support-query',
      name: 'Technical Support Email',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Alex Support",
          "role": "Technical Support Specialist"
        },
        "email_thread": [
          {
            "from": "Sarah Johnson <sarah.johnson@acmecorp.com>",
            "to": "Alex Support <support@hiverhq.com>",
            "content": "Hi Hiver Support Team,\n\nI'm having trouble getting Hiver to work properly in my Gmail. The extension seems to install fine, but most of the features aren't showing up in my inbox.\n\nHere's my current setup:\n- Browser: Firefox 121.0\n- Operating System: Windows 11\n- Gmail View: Basic HTML (company policy)\n- RAM: 16 GB\n- Internet Speed: 50 Mbps\n- Other Extensions: Boomerang for Gmail, Streak CRM\n\nI really need this working for our team collaboration. Can you help me troubleshoot this issue?\n\nBest regards,\nSarah Johnson\nProject Manager, Acme Corporation"
          }
        ],
        "chat_history": "Customer is using Firefox browser and Basic HTML Gmail view, which are not supported by Hiver. Also has conflicting extensions installed.",
        "user_intent": "Provide helpful troubleshooting steps and explain system requirements in a friendly, professional manner"
      }, null, 2),
      createdAt: baseTimestamp - 30000,
      lastModified: baseTimestamp - 30000
    }
  ];
};

export const NEW_PROMPT_TEMPLATE = 'Enter your prompt here. Use {{variable_name}} syntax for variables.\n\nExample:\n- Use {{email_thread}} for email data\n- Use {{user_intent}} for instructions\n- Use {{chat_history}} for additional context\n- Use {{agent_info}} for sender details';

export const NEW_VARIABLES_TEMPLATE = '{\n  "agent_info": {\n    "name": "Your Name",\n    "role": "Your Role"\n  },\n  "email_thread": [\n    {\n      "from": "sender@example.com",\n      "to": "you@example.com",\n      "content": "Email content here"\n    }\n  ],\n  "chat_history": "Additional context",\n  "user_intent": "Your instruction here"\n}';


