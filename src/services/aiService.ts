// AI Generation Service for LinkPilot AI

type ToneType = 'professional' | 'casual' | 'bold' | 'persuasive' | 'empathetic';

const CAPTION_TEMPLATES: Record<ToneType, string[]> = {
  professional: [
    "🚀 Scaling a startup isn't about working harder; it's about building systems that outlast your daily output.\n\nHere are 3 core pillars we've adopted this quarter:\n1. Automating transactional workflows\n2. Aligning OKRs cross-functionally\n3. Encouraging asynchronous alignment\n\nWhat are you doing to build sustainable systems in your organization?",
    "📈 The digital transformation era is over. We are now in the age of algorithmic velocity.\n\nIf your organization is still relying on manual outreach, you're playing catch-up. Leading product teams are leveraging automation to scale. The shift starts with modern workflows.\n\nAgree or disagree? Share in the comments.",
    "🎯 True leadership isn't measured by headcount, but by leverage. When you empower your team with the right tools, you unlock exponential creativity and productivity.\n\nAt LinkPilot, we're building exactly that. Stay tuned for the rollout."
  ],
  casual: [
    "Quick question for the group: How many browser tabs do you have open right now? 🫣\n\nI’m at 42. And yes, I know exactly what's on 3 of them. \n\nAutomation saves me some sanity, but clearly not all of it. How do you keep your workspace clean? Let's chat!",
    "Coffee ☕ + automation 🤖 = my ideal morning.\n\nJust scheduled our entire weekly output in under 10 minutes. Honestly, it feels like cheating. If you haven't automated your post schedule yet, this is your sign to do it.",
    "Honestly, most business advice is way too complicated. \n\nKeep it simple. Write down what works. Do more of that. Automate the boring parts. Sleep 8 hours. Repeat."
  ],
  bold: [
    "🔥 Unpopular opinion: Most 'strategies' are just excuses for not executing.\n\nYou don’t need another masterclass, spreadsheet, or brainstorm session. You need to press 'Publish'.\n\nGet out of your own way. Build, share, iterate.",
    "⚡ Stop waiting for the perfect moment. It doesn't exist. \n\nThe creators and brands winning today aren't smarter than you—they're just more consistent. They build in public and accept that version 1 is better than version 0.",
    "💡 If your product doesn't automate the repetitive stuff, you aren't building a SaaS; you're building a digital checklist. Leverage technology to scale or get left behind."
  ],
  persuasive: [
    "Are you still spending hours manually drafting and posting to LinkedIn? ⏳\n\nIt’s time to stop trading your hours for impressions. Top creators leverage scheduling and AI-guided content to stay active 24/7 without being glued to their screens.\n\nStart scaling your personal brand today. LinkPilot makes it effortless.",
    "📊 What if you could double your LinkedIn engagement with 80% less effort?\n\nBy posting at optimal times automatically, you capture eyes you’d otherwise miss. Don't let timezone differences kill your reach. Get scheduled, get seen.",
    "🚨 The biggest mistake creators make is inconsistent publishing. A gap of just 3 days can drop your algorithmic reach by 50%.\n\nKeep your funnel active. Automate your posts with LinkPilot and focus on building relationships, not managing schedules."
  ],
  empathetic: [
    "I get it. Building a business is exhausting. You're wearing ten different hats and trying to stay visible online at the same time.\n\nIt’s okay to look for help. Automating your scheduling isn't 'cheating'—it's giving yourself room to breathe. Take care of your energy first.",
    "We've all faced that blank screen feeling. Staring at the blinking cursor, wondering what to say to sound smart.\n\nRemember: your audience wants authenticity, not perfection. Share a lesson you learned the hard way. It's always what resonates most.",
    "To anyone struggling to keep up with the constant demand for content: you are doing great. It's okay to schedule your posts, step away, and spend time with family. Balance is the ultimate goal."
  ]
};

const HASHTAG_TEMPLATES: string[] = [
  "#SaaS #StartupLife #Automation #LinkedInMarketing",
  "#Productivity #DigitalMarketing #Networking #GrowthHacking",
  "#AI #Innovation #Technology #FutureOfWork",
  "#Solopreneur #BusinessGrowth #Consistency #SocialMedia",
  "#Leadership #Management #Strategy #CompanyCulture"
];

export const generateCaption = async (topic: string, tone: string = 'professional'): Promise<string> => {
  const selectedTone = (tone in CAPTION_TEMPLATES ? tone : 'professional') as ToneType;
  const templates = CAPTION_TEMPLATES[selectedTone];
  const randomIndex = Math.floor(Math.random() * templates.length);
  const baseCaption = templates[randomIndex];
  
  return `🤖 AI Generated Post (Topic: "${topic}")\n\n${baseCaption}`;
};

export const generateHashtags = async (content: string): Promise<string> => {
  const randomIndex1 = Math.floor(Math.random() * HASHTAG_TEMPLATES.length);
  let randomIndex2 = Math.floor(Math.random() * HASHTAG_TEMPLATES.length);
  while (randomIndex1 === randomIndex2) {
    randomIndex2 = Math.floor(Math.random() * HASHTAG_TEMPLATES.length);
  }
  return `${HASHTAG_TEMPLATES[randomIndex1]} ${HASHTAG_TEMPLATES[randomIndex2]}`;
};

export const improveContent = async (content: string, action: string): Promise<string> => {
  if (action === 'shorten') {
    return content.substring(0, Math.min(content.length, 120)) + "... (Shortened by AI)";
  }
  if (action === 'expand') {
    return content + "\n\n💡 Expanded insight: Furthermore, standardizing this flow helps you avoid cognitive load. Consistently applying these lessons over a 90-day window builds compounding advantages that position your brand at the absolute top of your industry.";
  }
  return content + "\n\n✨ Polished to sound more engaging, professional, and clear.";
};

export const generateCTA = async (tone?: string): Promise<string> => {
  const ctas = [
    "👉 Try LinkPilot for free today! (Link in bio)",
    "💬 What are your thoughts on this? Drop a comment below!",
    "🔔 Click the bell icon on my profile to never miss an update.",
    "📥 Send me a DM if you'd like to learn more about our pilot program.",
    "📌 Save this post for later so you don't lose these pillars."
  ];
  return ctas[Math.floor(Math.random() * ctas.length)];
};
