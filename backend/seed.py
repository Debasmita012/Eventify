from database import get_db, init_db
import json
from datetime import datetime

events = [
  {
    "id":1,
    "title":"HackIIIT 2025",
    "description":"48-hour hackathon open to all branches. Build real products, win prizes worth ₹2 lakhs. Mentors from Google and Microsoft on site.",
    "category":"tech",
    "venue":"Main Auditorium",
    "lat":22.578,"lng":88.432,
    "datetime":"2025-11-15 09:00",
    "rsvp_count":142,
    "image_url":"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200",
    "why_it_matters":"Boosts your resume + MAR points",
    "event_type": "hackathon",
    "problems": [
      {"title": "FinTech Revolution", "description": "Build decentralized apps for microlending."},
      {"title": "EdTech for All", "description": "Create accessible learning platforms for rural students."},
      {"title": "Sustainable Campus", "description": "IoT solutions to reduce electricity & water waste."}
    ],
    "sub_events": [
      {"title": "Pitch Perfect", "time": "Day 2, 4:00 PM", "venue": "Seminar Hall", "description": "A 5-minute elevator pitch to VC judges."},
      {"title": "Midnight Coding Relay", "time": "Day 1, 11:59 PM", "venue": "Main Arena", "description": "Pass the keyboard every 30 mins to build a mini-game."}
    ],
    "agenda": [
      {"time": "09:00 AM", "session": "Opening Ceremony", "speaker": "Dr. Smith"},
      {"time": "10:30 AM", "session": "Hacking Begins", "speaker": "Organizers"},
      {"time": "06:00 PM", "session": "Dinner & Networking", "speaker": ""},
      {"time": "10:00 AM", "session": "Submissions Closed", "speaker": ""}
    ],
    "sponsors": [
      {"name": "Google", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", "tier": "Title Sponsor"},
      {"name": "Microsoft", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", "tier": "Co-Sponsor"},
      {"name": "GitHub", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg", "tier": "Platform Partner"}
    ],
    "contact_email": "hello@hackiiit.in",
    "contact_phone": "+91 98765 43210",
    "brochure_url": "#"
  },
  {"id":2,  "title":"TEDx Campus","description":"Student speakers on innovation, mental health, climate action and entrepreneurship.","category":"cultural","venue":"Open Air Theatre","lat":22.579,"lng":88.431,"datetime":"2025-11-18 17:00","rsvp_count":89,"image_url":"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400","why_it_matters":"Expand your worldview"},
  {"id":3,  "title":"IPL Watch Party","description":"Live screening of the final match with giant screen, food stalls, and live commentary.","category":"sports","venue":"Sports Complex","lat":22.576,"lng":88.433,"datetime":"2025-11-20 19:30","rsvp_count":210,"image_url":"https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400","why_it_matters":"Unwind + socialize"},
  {"id":4,  "title":"Resume Workshop","description":"Google HR reviews your resume live. Limited to 30 seats. Bring printed copies.","category":"career","venue":"Seminar Hall B","lat":22.580,"lng":88.430,"datetime":"2025-11-16 14:00","rsvp_count":67,"image_url":"https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400","why_it_matters":"Direct placement prep"},
  {"id":5,  "title":"Classical Fusion Night","description":"Carnatic meets jazz. Student ensemble Raagam performs under the stars.","category":"music","venue":"Amphitheatre","lat":22.577,"lng":88.434,"datetime":"2025-11-22 19:00","rsvp_count":95,"image_url":"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400","why_it_matters":"Cultural enrichment"},
  {"id":6,  "title":"ML Paper Reading Club","description":"This week: Attention Is All You Need. We break it down line by line.","category":"tech","venue":"CR-204","lat":22.578,"lng":88.429,"datetime":"2025-11-17 16:00","rsvp_count":28,"image_url":"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400","why_it_matters":"Core AI knowledge for placements"},
  {"id":7,  "title":"Yoga & Mindfulness","description":"Morning session with certified instructor on campus lawn. Mats provided.","category":"wellness","venue":"Lawn Area C","lat":22.575,"lng":88.431,"datetime":"2025-11-19 06:30","rsvp_count":44,"image_url":"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400","why_it_matters":"Mental health matters"},
  {"id":8,  "title":"Valorant Tournament","description":"5v5 tournament across 16 teams. Prize pool ₹15,000.","category":"gaming","venue":"Computer Lab 3","lat":22.581,"lng":88.428,"datetime":"2025-11-23 13:00","rsvp_count":78,"image_url":"https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400","why_it_matters":"Team-building + fun"},
  {"id":9,  "title":"Startup Pitch Night","description":"6 student startups pitch to VCs and angel investors. Open audience. Network after.","category":"career","venue":"Innovation Hub","lat":22.579,"lng":88.435,"datetime":"2025-11-21 18:00","rsvp_count":112,"image_url":"https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400","why_it_matters":"Network with investors"},
  {"id":10, "title":"Photography Walk","description":"Guided campus walk with DSLR instructor. Learn composition and lighting.","category":"cultural","venue":"Campus Gate","lat":22.574,"lng":88.432,"datetime":"2025-11-24 07:00","rsvp_count":33,"image_url":"https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400","why_it_matters":"Creative portfolio builder"},
  {"id":11, "title":"Inter-College Debate","description":"Motion: AI will replace creativity. Four colleges, eight speakers, one winner.","category":"cultural","venue":"Seminar Hall A","lat":22.580,"lng":88.433,"datetime":"2025-11-25 10:00","rsvp_count":156,"image_url":"https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400","why_it_matters":"Communication skills + MAR"},
  {"id":12, "title":"Data Science Bootcamp","description":"Full-day hands-on bootcamp covering pandas, sklearn, and model deployment.","category":"tech","venue":"Computer Lab 1","lat":22.581,"lng":88.430,"datetime":"2025-11-26 09:00","rsvp_count":55,"image_url":"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400","why_it_matters":"Hands-on industry skills"},
  {"id":13, "title":"Badminton Open","description":"Singles and doubles categories. Prizes for top 3 in each category.","category":"sports","venue":"Indoor Stadium","lat":22.576,"lng":88.436,"datetime":"2025-11-27 08:00","rsvp_count":88,"image_url":"https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400","why_it_matters":"Sports certificate + MAR points"},
  {"id":14, "title":"Open Mic Night","description":"Comedy, poetry, music, spoken word — 5-minute slots, sign up at the door.","category":"music","venue":"Student Lounge","lat":22.577,"lng":88.430,"datetime":"2025-11-28 20:00","rsvp_count":134,"image_url":"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400","why_it_matters":"Confidence + expression"},
  {"id":15, "title":"Mental Health Seminar","description":"Psychologists and counsellors discuss exam anxiety, burnout, and seeking help.","category":"wellness","venue":"Lecture Hall 2","lat":22.579,"lng":88.432,"datetime":"2025-11-29 15:00","rsvp_count":71,"image_url":"https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400","why_it_matters":"Awareness + wellbeing"},
  {"id":16, "title":"Blockchain Workshop","description":"Build your first smart contract on Ethereum. Solidity basics from scratch.","category":"tech","venue":"CR-301","lat":22.580,"lng":88.428,"datetime":"2025-11-30 10:00","rsvp_count":42,"image_url":"https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400","why_it_matters":"Web3 skills in demand"},
  {"id":17, "title":"Cricket Finals","description":"Semester championship. CS vs Mechanical. Come support your department.","category":"sports","venue":"Cricket Ground","lat":22.574,"lng":88.434,"datetime":"2025-12-01 09:00","rsvp_count":198,"image_url":"https://images.unsplash.com/photo-1540747913346-19212a729db0?w=400","why_it_matters":"College spirit + MAR"},
  {"id":18, "title":"UI/UX Design Sprint","description":"48-hour design challenge. Teams of 3 redesign a real campus app.","category":"tech","venue":"Design Lab","lat":22.578,"lng":88.431,"datetime":"2025-12-02 10:00","rsvp_count":61,"image_url":"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400","why_it_matters":"Portfolio project ready"},
  {"id":19, "title":"Diwali Cultural Fest","description":"Dance, food stalls, rangoli competition, and fireworks.","category":"cultural","venue":"Main Ground","lat":22.576,"lng":88.432,"datetime":"2025-12-03 17:00","rsvp_count":312,"image_url":"https://images.unsplash.com/photo-1574972865587-5c0b3c24f19a?w=400","why_it_matters":"Cultural participation certificate"},
  {"id":20, "title":"Career Fair 2025","description":"42 companies on campus. On-the-spot interviews for internships and full-time roles.","category":"career","venue":"Exhibition Hall","lat":22.578,"lng":88.430,"datetime":"2025-12-09 10:00","rsvp_count":445,"image_url":"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400","why_it_matters":"Direct placement opportunity"},
  {"id":21, "title":"Gaming LAN Party","description":"CS:GO, FIFA, Minecraft on campus LAN. 12 hours non-stop. Bring your laptop.","category":"gaming","venue":"Computer Lab 2","lat":22.581,"lng":88.429,"datetime":"2025-12-05 18:00","rsvp_count":93,"image_url":"https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400","why_it_matters":"Community + fun"},
  {"id":22, "title":"Robotics Demo Day","description":"Robotics club presents line followers, robotic arms, and an autonomous rover.","category":"tech","venue":"Workshop Hall","lat":22.577,"lng":88.435,"datetime":"2025-12-06 11:00","rsvp_count":77,"image_url":"https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400","why_it_matters":"See real engineering in action"},
  {"id":23, "title":"Stand-Up Comedy Night","description":"Three professional comedians + two student openers. Campus-specific material.","category":"cultural","venue":"Amphitheatre","lat":22.577,"lng":88.434,"datetime":"2025-12-07 20:00","rsvp_count":167,"image_url":"https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400","why_it_matters":"Stress relief + fun"},
  {"id":24, "title":"App Dev Workshop","description":"Build and deploy a full-stack app using React and Supabase in one day.","category":"tech","venue":"CR-202","lat":22.580,"lng":88.431,"datetime":"2025-12-12 09:00","rsvp_count":83,"image_url":"https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400","why_it_matters":"Deployable project for portfolio"},
]

def seed():
    init_db()
    db = get_db()

    # Clear existing data
    db.events.drop()
    db.users.drop()
    db.rsvps.drop()
    db.bookmarks.drop()
    db.chat_sessions.drop()

    # Insert organizer
    db.users.insert_one({
        "id":         "org-001",
        "name":       "Campus Admin",
        "email":      "admin@rccit.edu",
        "interests":  ["tech","cultural"],
        "department": "Admin",
        "role":       "organizer",
        "points":     0,
        "created_at": datetime.now().isoformat(),
    })

    # Insert events
    for ev in events:
        if "agenda" not in ev:
            ev["agenda"] = [
                {"time": "09:00 AM", "session": "Opening Ceremony", "speaker": "Organizers"},
                {"time": "10:00 AM", "session": "Main Event Starts", "speaker": "Various"},
                {"time": "06:00 PM", "session": "Closing & Networking", "speaker": ""}
            ]
        if "sponsors" not in ev:
            ev["sponsors"] = [
                {"name": "GitHub", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg", "tier": "Platform Partner"}
            ]
    db.events.insert_many(events)
    print(f"Seeded {len(events)} events into MongoDB")

if __name__ == "__main__":
    seed()
