import re

QA_PAIRS = [
  (["hi","hello","hey","hii","helo"],
   "Hey! 👋 I'm CampusBot. Ask me about events, RSVPs, or anything campus-related!"),
  (["how are you","how r u","wassup","what's up"],
   "I'm doing great! 🙌 What event can I help you find today?"),
  (["who are you","what are you","introduce yourself"],
   "I'm CampusBot 🤖 — your smart campus event assistant for Eventify at RCCIT!"),
  (["bye","goodbye","see you","cya"],
   "Bye! 👋 Don't forget to check your upcoming RSVPs!"),
  (["thanks","thank you","thx","ty"],
   "You're welcome! 😊 Let me know if you need anything else."),

  (["what events","show events","list events","all events","events today","what is happening","what's on"],
   "Check the event feed on your home screen! It's personalised based on your interests. Use search or mood filters 🎯"),
  (["upcoming events","future events","next events","events this week"],
   "Your feed shows all upcoming events sorted by relevance. Use 🧠 Learn, 😎 Chill, or 🏆 Compete filters to narrow it down!"),
  (["popular events","trending events","most attended","best events","top events"],
   "Events with 🔥 Trending badge have 100+ RSVPs. Career Fair 2025 (445 RSVPs) and Diwali Cultural Fest (312 RSVPs) are the hottest right now!"),

  (["tech events","technology events","coding events","programming events","computer events"],
   "Tech events: HackIIIT 2025 🏆, ML Paper Reading Club, Data Science Bootcamp, Blockchain Workshop, Robotics Demo Day, UI/UX Design Sprint, App Dev Workshop!"),
  (["hackathon","hack","coding competition"],
   "HackIIIT 2025 is a 48-hour hackathon with ₹2L prize pool! Mentors from Google and Microsoft on site. 142 students already RSVP'd 🚀"),
  (["machine learning","ml events","ai events","data science"],
   "ML Paper Reading Club covers 'Attention Is All You Need' this week. Data Science Bootcamp is a full-day hands-on session with pandas + sklearn!"),
  (["blockchain","web3","solidity","ethereum"],
   "Blockchain Workshop covers Solidity basics and deploying your first smart contract on Ethereum testnet!"),
  (["robotics","robot"],
   "Robotics Demo Day showcases line followers, robotic arms, and an autonomous rover. Free entry!"),
  (["ui ux","design","figma"],
   "UI/UX Design Sprint is a 48-hour design challenge with Figma licenses provided. Teams of 3!"),

  (["career events","placement","job","internship","career fair"],
   "Career Fair 2025 has 42 companies with on-spot interviews! Resume Workshop with Google HR is also coming up 💼"),
  (["resume","cv","resume workshop"],
   "Resume Workshop has Google HR reviewing resumes live! Limited to 30 seats — RSVP fast. Bring printed copies 📄"),
  (["startup","pitch","entrepreneur"],
   "Startup Pitch Night has 6 student startups pitching to VCs and angel investors. Open for all to attend and network!"),

  (["cultural events","culture","fest","festival"],
   "Cultural events: TEDx Campus, Photography Walk, Inter-College Debate, Diwali Cultural Fest, Stand-Up Comedy Night 🎭"),
  (["tedx","ted talk"],
   "TEDx Campus features student speakers on innovation, mental health, and climate action. 89 students already RSVPed! 🎤"),
  (["diwali","cultural fest"],
   "Diwali Cultural Fest — dance, food stalls, rangoli competition, fireworks! 312 students going 🪔"),
  (["comedy","stand up"],
   "Stand-Up Comedy Night has 3 professional comedians + 2 student openers. 167 students going 😂"),
  (["debate","public speaking"],
   "Inter-College Debate motion: 'AI will replace creativity'. Great for communication skills + MAR points!"),

  (["sports events","games","tournament"],
   "Sports events: IPL Watch Party, Badminton Open, Cricket Finals, Swimming Gala. All with MAR points! ⚽"),
  (["cricket"],
   "Cricket Finals: CS vs Mechanical — semester championship! 198 students going 🏏"),
  (["badminton"],
   "Badminton Open has singles and doubles categories. Prizes for top 3! 🏸"),
  (["ipl","watch party"],
   "IPL Watch Party has a giant screen, food stalls, and live commentary! 210 students going 📺"),

  (["music events","concert"],
   "Music events: Classical Fusion Night, Open Mic Night, Acoustic Jam Session 🎵"),
  (["open mic","poetry","spoken word"],
   "Open Mic Night welcomes comedy, poetry, music, spoken word — 5-minute slots. 134 going! 🎤"),
  (["jam","acoustic","guitar"],
   "Acoustic Jam Session — guitars, cajon, tabla. Bring your instrument. Free chai! ☕"),

  (["wellness","mental health","yoga"],
   "Wellness events: Yoga & Mindfulness, Mental Health Seminar, Nutrition & Fitness Talk 🧘"),
  (["yoga","meditation","mindfulness"],
   "Yoga & Mindfulness is at 6:30 AM on campus lawn. Mats provided — perfect exam-season reset!"),
  (["mental health","anxiety","burnout","counselling"],
   "Mental Health Seminar has psychologists discussing exam anxiety and burnout. Important to attend 💚"),

  (["gaming","esports","valorant"],
   "Gaming events: Valorant Tournament (₹15K prize pool!) and Gaming LAN Party (12-hour CS:GO, FIFA, Minecraft) 🎮"),
  (["valorant","fps"],
   "Valorant Tournament is 5v5, ₹15,000 prize pool. Register your squad of 5 before Nov 11! 🏆"),
  (["lan party","cs go","minecraft"],
   "Gaming LAN Party is 12 hours non-stop on campus LAN. Just bring your laptop! 🖥️"),

  (["how to rsvp","rsvp","register","sign up","how to register"],
   "Click the RSVP button on any event card! You earn 20 points per RSVP and it syncs to your portfolio 🎫"),
  (["cancel rsvp","unregister","cancel registration"],
   "Click the green 'Going' button on the event card again to cancel your RSVP."),
  (["rsvp confirmation","am i registered","confirm rsvp"],
   "Check your Portfolio page — it shows all events you've RSVPed to with a green 'Going' button on the card."),

  (["mar points","mar","attendance points","mar criteria"],
   "Every RSVP earns 20 MAR points! Check your Portfolio page to track your total 📊"),
  (["how many mar","mar target"],
   "MAR requirements vary by policy. Check your Portfolio for your current total and keep RSVPing!"),

  (["points","earn points","how points work"],
   "RSVP = +20 pts, Bookmark = +5 pts. Check the Leaderboard for your rank! ⚡"),
  (["leaderboard","ranking","top students"],
   "Check the 🏆 Leaderboard page from the navbar! Top students ranked by total points."),
  (["badges","achievement","explorer","pro","event master"],
   "Badges: 🌱 Explorer (1 RSVP), ⭐ Active (5), 🏅 Pro (10), 👑 Event Master (20). Check your Portfolio!"),

  (["calendar","add to calendar","ics","google calendar"],
   "Click the 📅 button on any event card to download an .ics file for Google Calendar, Apple Calendar, or Outlook!"),
  (["conflict","clash","two events same time"],
   "Eventify auto-detects clashes! When you RSVP to an overlapping event you'll see a ⚠️ warning instantly."),

  (["search","how to search","find event"],
   "Use the search bar at the top of your feed! Type naturally like 'music tonight' or 'coding workshop' 🔍"),
  (["surprise","random event","something different"],
   "Click 🎲 Surprise Me on your feed! It recommends an event outside your usual interests!"),
  (["mood filter","learn chill compete"],
   "Use mood buttons: 🧠 Learn (tech/career), 😎 Chill (music/wellness), 🏆 Compete (sports/gaming)!"),
  (["bookmark","save","wishlist"],
   "Click the 🤍 heart icon on any event card to bookmark it. Find all in your Portfolio page. +5 points!"),

  (["map","campus map","where is event","location"],
   "Go to the 🗺 Map page from the navbar! Colored pins for all events. Click any pin to RSVP directly 📍"),

  (["portfolio","my events","my profile","my activity"],
   "Your Portfolio page shows all RSVPs, badges, MAR points, category chart, and total points 📁"),

  (["gesture","hand gesture","gesture control"],
   "Enable gesture control with the 🖐 button bottom-left! Swipe=browse, 👍=RSVP, 🤌=calendar, ✊=chatbot!"),
  (["gesture not working","hand not detected"],
   "Tips: stay 30-50cm from camera, good lighting, hold gestures 0.5 sec. Click '? Gesture guide' for help!"),

  (["organizer","create event","add event","publish event"],
   "Go to the 📋 Organizer page from the navbar. Fill in details and click Publish!"),
  (["analytics","event analytics","rsvp stats"],
   "Click any event on the Organizer page to see hourly RSVP trend, department breakdown, heatmap, and success score 📊"),

  (["app not loading","not working","error","bug"],
   "Try refreshing (Ctrl+Shift+R). If still broken, clear cache and log out/in."),
  (["login","sign in","how to login"],
   "Go to the home page and complete onboarding — name, email, department, interests. That's your login!"),
  (["logout","sign out"],
   "Click 'out' next to your avatar in the top-right navbar to log out."),

  (["help","support","what can you do"],
   "Ask me about events by category, RSVP help, MAR points, gestures, or features! Try: 'any tech events?' 🤖"),
  (["about","about app","about eventify","what is eventify"],
   "Eventify is a smart campus event platform by Team REALX (RCCIT). AI-powered, gesture-controlled, personalised! 🎓"),
  (["team","who built","developers","realx"],
   "Eventify is built by Team REALX from RCCIT — Debasmita, Adrija, and Rishi. Made with ❤️ for students!"),
]

COMPILED = [(set(kws), resp) for kws, resp in QA_PAIRS]

def _tokenise(text: str) -> set:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return set(text.split())

def ask_campusbot(user_message: str, events: list, chat_history=None) -> str:
    msg_lower = user_message.lower()
    
    for keywords, response in QA_PAIRS:
        if any(kw in msg_lower for kw in keywords):
            return response

    # Dynamic fallback — search actual event titles
    tokens = _tokenise(user_message)
    if events:
        matched = []
        for e in events:
            event_words = _tokenise(
                f"{e['title']} {e['description']} {e['category']} {e['venue']}"
            )
            if tokens & event_words:
                matched.append(e)
        if matched:
            names = ", ".join(e['title'] for e in matched[:3])
            return f"I found some events related to your query: **{names}**. Check them out on your feed! 🎯"

    return (
        "Hmm, I'm not sure about that 🤔 "
        "Try asking about specific events, RSVP, MAR points, or type 'help' to see what I can do!"
    )
