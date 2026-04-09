/* ============================================================
   SERENITY – Mental Health AI Chatbot
   script.js – All interaction logic
   Covers: emotion detection, CBT/DBT responses, crisis handling,
           typing animation, mood chips, auto-scroll, reset
   ============================================================ */

// ── Wait for DOM to be ready ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Element references ──────────────────────────────────────
  const messagesEl   = document.getElementById('chatMessages');
  const userInputEl  = document.getElementById('userInput');
  const sendBtn      = document.getElementById('sendBtn');
  const typingEl     = document.getElementById('typingIndicator');
  const resetBtn     = document.getElementById('resetBtn');
  const moodChips    = document.querySelectorAll('.mood-chip');

  // Only run chat logic on the chat page
  if (!messagesEl) return;

  // ── Bot Configuration ────────────────────────────────────────
  const BOT_NAME   = 'Serenity';
  const BOT_AVATAR = '🌿';
  const USER_INITIALS = 'You';

  // ── Keyword Definitions ──────────────────────────────────────
  // Crisis words trigger immediate safety response
  const CRISIS_WORDS = [
    'want to die', 'kill myself', 'end my life', 'suicide', 'suicidal',
    'self harm', 'self-harm', 'hurt myself', 'no reason to live',
    'can\'t go on', 'cannot go on', 'give up on life', 'better off dead'
  ];

  // Keyword map: emotion → response category
  const EMOTION_MAP = [
    { keywords: ['sad', 'depressed', 'depression', 'unhappy', 'miserable', 'hopeless', 'worthless', 'empty', 'grief', 'grieving', 'heartbroken', 'crying', 'tears', 'cry'], emotion: 'sad' },
    { keywords: ['anxious', 'anxiety', 'panic', 'panicking', 'worried', 'worry', 'nervous', 'fear', 'scared', 'afraid', 'dread', 'phobia', 'overthinking'], emotion: 'anxious' },
    { keywords: ['stress', 'stressed', 'overwhelmed', 'burnout', 'exhausted', 'pressure', 'overloaded', 'too much', 'can\'t handle'], emotion: 'stressed' },
    { keywords: ['angry', 'anger', 'furious', 'frustrated', 'frustration', 'mad', 'rage', 'irritated', 'annoyed', 'upset', 'hate', 'resentful'], emotion: 'angry' },
    { keywords: ['happy', 'excited', 'joy', 'joyful', 'great', 'wonderful', 'amazing', 'fantastic', 'good', 'grateful', 'thankful', 'blessed', 'content', 'peaceful', 'calm'], emotion: 'happy' },
    { keywords: ['lonely', 'alone', 'isolated', 'abandoned', 'no one', 'nobody', 'disconnected', 'invisible'], emotion: 'lonely' },
    { keywords: ['numb', 'empty', 'nothing', 'detached', 'disconnected', 'blank', 'feel nothing', 'don\'t feel'], emotion: 'numb' },
  ];

  // ── Response Bank ────────────────────────────────────────────
  // Multiple responses per emotion (randomly chosen for variety)
  const RESPONSES = {

    // 🔴 CRISIS – top priority, always shown first
    crisis: [
      `💙 I'm really glad you're still here, and I'm here with you right now.\n\nWhat you're feeling is real and it matters deeply. Please know you don't have to carry this alone.\n\n📞 Please reach out to someone who can truly support you:\n• **iCall (India):** 9152987821\n• **Vandrevala Foundation:** 1860-2662-345\n• **International:** findahelpline.com\n\nYou deserve care and support. Would you like to talk about what's been happening?`
    ],

    // 😢 SAD / DEPRESSED → CBT style
    sad: [
      `I'm really sorry you're feeling this way. Your feelings are completely valid and it takes courage to acknowledge them.\n\n💭 *CBT Check-in:* Sometimes our minds tell us things that feel absolutely true but may not be the full picture. Can you tell me a little about what's been happening? What thought keeps coming back to you?`,

      `It sounds like you're carrying something heavy right now. That takes a real toll.\n\n💭 *Let's try a gentle CBT exercise:* What's one thought that's been repeating in your mind? We can look at it together — not to dismiss it, but to understand it more clearly.`,

      `I hear you. Feeling sad or low doesn't mean something is wrong with you — it means you're human.\n\n🌱 *One small thing:* Can you name one tiny thing — even something as small as a warm drink or a single breath of fresh air — that brought you any comfort recently? Sometimes finding that anchor helps us start.`
    ],

    // 😰 ANXIOUS → DBT / breathing techniques
    anxious: [
      `I hear you. Anxiety can feel overwhelming, like your body is responding to a threat that isn't quite there.\n\n🌬️ *Let's try a DBT breathing technique right now:*\n1. Breathe **in** slowly for **4 counts**\n2. **Hold** for **4 counts**\n3. Breathe **out** slowly for **6 counts**\n\nRepeat this 3 times. You're safe. Your nervous system can slow down. How do you feel after trying this?`,

      `Anxiety is your mind trying to protect you — even when it overdoes it. You're not broken.\n\n🖐️ *Try the 5-4-3-2-1 grounding technique:*\n• **5 things** you can see\n• **4 things** you can touch\n• **3 things** you can hear\n• **2 things** you can smell\n• **1 thing** you can taste\n\nThis brings your mind back to the present moment. Want to try it together?`,

      `Take a gentle breath with me. In… and out. You're here, and you're okay.\n\n💆 *DBT Tip – TIPP:* When anxiety spikes, try **Temperature** — hold cold water or ice. It activates your body's calming reflex almost instantly. Would you like more techniques like this?`
    ],

    // 😓 STRESSED / OVERWHELMED → DBT + CBT mix
    stressed: [
      `Stress has a way of making everything feel urgent at once. Let's slow that down together.\n\n📋 *CBT strategy:* Try listing what's on your mind — every worry, task, or fear. Just getting it out of your head and on to "paper" (even here) reduces the mental load. What's weighing on you most right now?`,

      `When we're overwhelmed, our brain can't prioritize properly — everything screams equally loudly. That's exhausting.\n\n🌊 *DBT – Radical Acceptance:* Some things are outside our control. For the next 60 seconds, let's just acknowledge: "This is hard right now, and that's okay." No fixing, no solving. Just accepting the moment. Can you try that?`,

      `You don't have to solve everything today. One breath, one step, one moment at a time.\n\n🧘 *Mindfulness check:* Right now, place both feet flat on the floor. Feel the ground. Notice the weight of your body in your chair. You are here. You are present. That's enough for this moment.`
    ],

    // 😠 ANGRY → de-escalation + CBT
    angry: [
      `Anger is a completely valid emotion — it often tells us something important about our needs or boundaries.\n\n🌬️ *First, let's cool the physiological response:* Take a slow breath in through your nose, then a long slow exhale through your mouth. Repeat 3 times. This genuinely helps lower cortisol.\n\nOnce you feel slightly calmer: what happened that sparked this feeling?`,

      `I hear that you're really frustrated. That feeling is telling you something important.\n\n💭 *CBT lens:* What's the story your mind is telling about this situation? Is there any part of it that might look different from another angle? (This isn't about excusing anything — just about not letting anger drive decisions we might regret.)`,

      `It makes sense to feel angry. Your feelings are not wrong. What matters is what we do with them.\n\n🧊 *DBT – TIPP skill:* Try splashing cold water on your face or holding something cold. It sounds simple, but it activates your dive reflex and genuinely calms your nervous system in seconds. Would that help right now?`
    ],

    // 😊 HAPPY / POSITIVE → reinforcement
    happy: [
      `That's wonderful to hear! 🌟 Positive moments are worth pausing and really *feeling*.\n\n✨ *Positive psychology tip:* Take 30 seconds right now to truly absorb this feeling. Where do you feel it in your body? Let it anchor in. These moments build emotional resilience for harder days.`,

      `I'm so glad you're feeling good! 💚 Hold onto this.\n\nWould you like to reflect on what contributed to this feeling? Understanding what lifts us up helps us intentionally create more of it in our lives.`,

      `That's genuinely lovely to hear. 🌿 You deserve good moments.\n\n📓 *Gratitude practice:* Can you name 3 specific things — people, moments, or small gifts — that you feel grateful for today? Writing them down (even here) helps the brain register them more deeply.`
    ],

    // 💔 LONELY
    lonely: [
      `Loneliness is one of the most quietly painful feelings. Thank you for sharing that with me.\n\n💙 You reached out right now — and that matters. Connection starts with small steps.\n\nIs there one person — a friend, family member, or anyone — you could send a simple message to today? Even just a 'hey, thinking of you' can open a door.`,

      `Feeling alone, even in a room full of people, is incredibly hard. Your need for connection is human and valid.\n\n🌱 *CBT perspective:* Sometimes loneliness is accompanied by thoughts like "nobody cares" or "I'm a burden." These feel absolutely true — but they're thoughts, not facts. Can we look at one of those thoughts together?`
    ],

    // 😶 NUMB
    numb: [
      `Feeling numb or empty is its own kind of pain — sometimes harder to name than sadness or anxiety.\n\n🌊 *Grounding exercise:* Press your feet firmly into the floor. Squeeze your hands together. Take a slow breath. Sometimes physical sensation can gently reconnect us to the present when emotions have gone quiet.\n\nCan you describe what 'numb' feels like for you right now?`,

      `Not feeling anything can sometimes be our mind's way of protecting us from too much. It's okay.\n\n💭 *Gentle check-in:* When did you last feel connected — to yourself, to someone else, to something you loved? Let's start there and find a small thread to follow.`
    ],

    // 🤷 FALLBACK – when no emotion is detected
    unknown: [
      `Thank you for sharing that with me. I'm here and I'm listening.\n\nCould you tell me a little more about how you're feeling? You can describe it however feels natural — there's no wrong way.`,

      `I want to make sure I understand what you're going through. Could you share a bit more about what's on your mind or heart right now?`,

      `I hear you. Sometimes it's hard to find the right words for what we feel — and that's completely okay. Take your time. I'm here.`
    ]
  };

  // ── Welcome message shown when chat loads ────────────────────
  const WELCOME_MESSAGE = `Hello, I'm Serenity 🌿\n\nThis is a safe, judgment-free space. I'm here to listen and support you using calming techniques rooted in CBT and DBT.\n\n💙 How are you feeling today? You can type freely, or tap a mood on the left to start.`;

  // ── Conversation history (for context) ──────────────────────
  let conversationHistory = [];

  // ── Utility: get current time as HH:MM AM/PM ────────────────
  function getTimestamp() {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // ── Utility: pick a random item from an array ────────────────
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── Append a message bubble to the chat ─────────────────────
  function appendMessage(text, sender, isCrisis = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}${isCrisis ? ' crisis' : ''}`;

    // Avatar
    const rowDiv = document.createElement('div');
    rowDiv.className = 'message-row';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'msg-avatar';
    avatarDiv.textContent = sender === 'bot' ? BOT_AVATAR : '😊';

    // Bubble
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    // Support line breaks and basic bold (**text**)
    bubbleDiv.innerHTML = formatText(text);

    rowDiv.appendChild(avatarDiv);
    rowDiv.appendChild(bubbleDiv);

    // Timestamp
    const tsDiv = document.createElement('div');
    tsDiv.className = 'message-timestamp';
    tsDiv.textContent = getTimestamp();

    messageDiv.appendChild(rowDiv);
    messageDiv.appendChild(tsDiv);

    messagesEl.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
  }

  // ── Format text: line breaks + **bold** ─────────────────────
  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/\n/g, '<br>');                           // newlines
  }

  // ── Scroll chat to the bottom ────────────────────────────────
  function scrollToBottom() {
    setTimeout(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 50);
  }

  // ── Show / hide typing indicator ────────────────────────────
  function showTyping()  { typingEl.style.display = 'flex'; scrollToBottom(); }
  function hideTyping()  { typingEl.style.display = 'none'; }

  // ── Check for crisis keywords ────────────────────────────────
  function isCrisis(text) {
    const lower = text.toLowerCase();
    return CRISIS_WORDS.some(word => lower.includes(word));
  }

  // ── Detect emotion from user text ────────────────────────────
  function detectEmotion(text) {
    const lower = text.toLowerCase();
    for (const entry of EMOTION_MAP) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        return entry.emotion;
      }
    }
    return 'unknown';
  }

  // ── Generate a bot response ──────────────────────────────────
  function generateResponse(userText) {
    if (isCrisis(userText)) {
      return { text: pickRandom(RESPONSES.crisis), isCrisis: true };
    }
    const emotion = detectEmotion(userText);
    return { text: pickRandom(RESPONSES[emotion]), isCrisis: false };
  }

  // ── Send a message flow ──────────────────────────────────────
  function sendMessage(text) {
    text = text.trim();
    if (!text) return;

    // Show user message
    appendMessage(text, 'user');

    // Save to history
    conversationHistory.push({ role: 'user', content: text });

    // Clear input
    if (userInputEl) {
      userInputEl.value = '';
      userInputEl.style.height = 'auto';
    }

    // Typing delay (realistic feel: 1.5–2.5s)
    const delay = 1500 + Math.random() * 1000;
    showTyping();

    setTimeout(() => {
      hideTyping();
      const { text: responseText, isCrisis: crisis } = generateResponse(text);
      appendMessage(responseText, 'bot', crisis);
      conversationHistory.push({ role: 'assistant', content: responseText });
    }, delay);
  }

  // ── Send button click ────────────────────────────────────────
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (userInputEl) sendMessage(userInputEl.value);
    });
  }

  // ── Enter key sends, Shift+Enter adds newline ────────────────
  if (userInputEl) {
    userInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(userInputEl.value);
      }
    });

    // Auto-resize textarea as user types
    userInputEl.addEventListener('input', () => {
      userInputEl.style.height = 'auto';
      userInputEl.style.height = Math.min(userInputEl.scrollHeight, 120) + 'px';
    });
  }

  // ── Mood chip clicks ─────────────────────────────────────────
  moodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const mood = chip.dataset.mood;
      // Map mood to a natural message
      const moodMessages = {
        sad:         "I've been feeling really sad lately.",
        anxious:     "I'm feeling very anxious and can't seem to calm down.",
        angry:       "I'm feeling really angry right now.",
        stressed:    "I'm completely stressed and overwhelmed.",
        happy:       "I'm actually feeling quite happy today!",
        numb:        "I feel kind of numb and empty inside.",
        lonely:      "I've been feeling really lonely.",
        overwhelmed: "I feel completely overwhelmed by everything."
      };
      const message = moodMessages[mood] || `I'm feeling ${mood} right now.`;
      if (userInputEl) {
        userInputEl.value = message;
        userInputEl.focus();
      }
      sendMessage(message);
    });
  });

  // ── Reset chat button ────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset the conversation? This will clear all messages.')) {
        messagesEl.innerHTML = '';
        conversationHistory = [];
        // Re-show welcome message
        setTimeout(() => {
          appendMessage(WELCOME_MESSAGE, 'bot');
        }, 300);
      }
    });
  }

  // ── Show welcome message on load ─────────────────────────────
  setTimeout(() => {
    appendMessage(WELCOME_MESSAGE, 'bot');
  }, 400);

});

// ── Home page: smooth link animations (runs on index.html) ───
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', () => {
    document.body.style.opacity = '0.85';
    document.body.style.transition = 'opacity 0.3s ease';
  });
});