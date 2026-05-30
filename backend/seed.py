from database import get_db, init_db
import json
from datetime import datetime

events = [
  {"title":"HackIIIT 2025","description":"48-hour hackathon open to all branches. Build real products, win prizes worth ₹2 lakhs. Mentors from Google and Microsoft on site.","category":"tech","venue":"Main Auditorium","lat":22.578,"lng":88.432,"datetime":"2025-11-15 09:00","rsvp_count":142,"image_url":"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400","why_it_matters":"Boosts your resume + MAR points"},
  {"title":"TEDx Campus","description":"Student speakers on innovation, mental health, climate action and entrepreneurship.","category":"cultural","venue":"Open Air Theatre","lat":22.579,"lng":88.431,"datetime":"2025-11-18 17:00","rsvp_count":89,"image_url":"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400","why_it_matters":"Expand your worldview"},
  {"title":"IPL Watch Party","description":"Live screening of the final match with giant screen, food stalls, and live commentary desk.","category":"sports","venue":"Sports Complex","lat":22.576,"lng":88.433,"datetime":"2025-11-20 19:30","rsvp_count":210,"image_url":"https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400","why_it_matters":"Unwind + socialize"},
  {"title":"Resume Workshop","description":"Google HR reviews your resume live in front of the room. Limited to 30 seats.","category":"career","venue":"Seminar Hall B","lat":22.580,"lng":88.430,"datetime":"2025-11-16 14:00","rsvp_count":67,"image_url":"https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400","why_it_matters":"Direct placement prep"},
  {"title":"Classical Fusion Night","description":"Carnatic meets jazz. Student ensemble Raagam performs their debut fusion set under the stars.","category":"music","venue":"Amphitheatre","lat":22.577,"lng":88.434,"datetime":"2025-11-22 19:00","rsvp_count":95,"image_url":"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400","why_it_matters":"Cultural enrichment"},
  {"title":"ML Paper Reading Club","description":"This week: Attention Is All You Need. We break it down line by line.","category":"tech","venue":"CR-204","lat":22.578,"lng":88.429,"datetime":"2025-11-17 16:00","rsvp_count":28,"image_url":"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400","why_it_matters":"Core AI knowledge for placements"},
  {"title":"Yoga & Mindfulness","description":"Morning session with certified instructor on the campus lawn. Mats provided.","category":"wellness","venue":"Lawn Area C","lat":22.575,"lng":88.431,"datetime":"2025-11-19 06:30","rsvp_count":44,"image_url":"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400","why_it_matters":"Mental health matters"},
  {"title":"Valorant Tournament","description":"5v5 tournament across 16 teams. Register your squad before Nov 11. Prize pool ₹15,000.","category":"gaming","venue":"Computer Lab 3","lat":22.581,"lng":88.428,"datetime":"2025-11-23 13:00","rsvp_count":78,"image_url":"https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400","why_it_matters":"Team-building + fun"},
  {"title":"Startup Pitch Night","description":"6 student startups pitch to a panel of VCs and angel investors. Open audience.","category":"career","venue":"Innovation Hub","lat":22.579,"lng":88.435,"datetime":"2025-11-21 18:00","rsvp_count":112,"image_url":"https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400","why_it_matters":"Network with investors"},
  {"title":"Photography Walk","description":"Guided campus photography walk with a DSLR instructor.","category":"cultural","venue":"Campus Gate","lat":22.574,"lng":88.432,"datetime":"2025-11-24 07:00","rsvp_count":33,"image_url":"https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400","why_it_matters":"Creative portfolio builder"},
  {"title":"Inter-College Debate","description":"Motion: AI will replace creativity. Four colleges, eight speakers, one winner.","category":"cultural","venue":"Seminar Hall A","lat":22.580,"lng":88.433,"datetime":"2025-11-25 10:00","rsvp_count":156,"image_url":"https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400","why_it_matters":"Communication skills + MAR"},
  {"title":"Data Science Bootcamp","description":"Full-day hands-on bootcamp covering pandas, sklearn, and model deployment.","category":"tech","venue":"Computer Lab 1","lat":22.581,"lng":88.430,"datetime":"2025-11-26 09:00","rsvp_count":55,"image_url":"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400","why_it_matters":"Hands-on industry skills"},
  {"title":"Badminton Open","description":"Singles and doubles categories. Register individually or as a pair.","category":"sports","venue":"Indoor Stadium","lat":22.576,"lng":88.436,"datetime":"2025-11-27 08:00","rsvp_count":88,"image_url":"https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400","why_it_matters":"Sports certificate + MAR points"},
  {"title":"Open Mic Night","description":"Comedy, poetry, music, spoken word — all welcome. 5-minute slots.","category":"music","venue":"Student Lounge","lat":22.577,"lng":88.430,"datetime":"2025-11-28 20:00","rsvp_count":134,"image_url":"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400","why_it_matters":"Confidence + expression"},
  {"title":"Mental Health Seminar","description":"Panel of psychologists and counsellors discuss exam anxiety, burnout, and seeking help.","category":"wellness","venue":"Lecture Hall 2","lat":22.579,"lng":88.432,"datetime":"2025-11-29 15:00","rsvp_count":71,"image_url":"https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400","why_it_matters":"Awareness + wellbeing"},
  {"title":"Blockchain Workshop","description":"Build your first smart contract on Ethereum. Solidity basics from scratch.","category":"tech","venue":"CR-301","lat":22.580,"lng":88.428,"datetime":"2025-11-30 10:00","rsvp_count":42,"image_url":"https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400","why_it_matters":"Web3 skills in demand"},
  {"title":"Cricket Finals","description":"Semester championship final. Department of CS vs Mechanical.","category":"sports","venue":"Cricket Ground","lat":22.574,"lng":88.434,"datetime":"2025-12-01 09:00","rsvp_count":198,"image_url":"https://images.unsplash.com/photo-1540747913346-19212a729db0?w=400","why_it_matters":"College spirit + MAR"},
  {"title":"UI/UX Design Sprint","description":"48-hour design challenge. Teams of 3 redesign a real campus app.","category":"tech","venue":"Design Lab","lat":22.578,"lng":88.431,"datetime":"2025-12-02 10:00","rsvp_count":61,"image_url":"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400","why_it_matters":"Portfolio project ready"},
  {"title":"Diwali Cultural Fest","description":"Dance, food stalls, rangoli competition, and fireworks.","category":"cultural","venue":"Main Ground","lat":22.576,"lng":88.432,"datetime":"2025-12-03 17:00","rsvp_count":312,"image_url":"https://images.unsplash.com/photo-1574972865587-5c0b3c24f19a?w=400","why_it_matters":"Cultural participation certificate"},
  {"title":"Career Fair 2025","description":"42 companies on campus. On-the-spot interviews for internships and full-time roles.","category":"career","venue":"Exhibition Hall","lat":22.578,"lng":88.430,"datetime":"2025-12-09 10:00","rsvp_count":445,"image_url":"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400","why_it_matters":"Direct placement opportunity"},
  {"title":"Gaming LAN Party","description":"Bring your laptop. CS:GO, FIFA, and Minecraft servers set up on campus LAN.","category":"gaming","venue":"Computer Lab 2","lat":22.581,"lng":88.429,"datetime":"2025-12-05 18:00","rsvp_count":93,"image_url":"https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400","why_it_matters":"Community + fun"},
  {"title":"Robotics Demo Day","description":"Robotics club presents semester projects: line followers, robotic arms, and a rover.","category":"tech","venue":"Workshop Hall","lat":22.577,"lng":88.435,"datetime":"2025-12-06 11:00","rsvp_count":77,"image_url":"https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400","why_it_matters":"See real engineering in action"},
  {"title":"Stand-Up Comedy Night","description":"Three professional comedians + two student openers.","category":"cultural","venue":"Amphitheatre","lat":22.577,"lng":88.434,"datetime":"2025-12-07 20:00","rsvp_count":167,"image_url":"https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400","why_it_matters":"Stress relief + fun"},
  {"title":"App Dev Workshop","description":"Build and deploy a full-stack app in one day using React and Supabase.","category":"tech","venue":"CR-202","lat":22.580,"lng":88.431,"datetime":"2025-12-12 09:00","rsvp_count":83,"image_url":"https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400","why_it_matters":"Deployable project for portfolio"},
]

def seed():
    init_db()
    conn = get_db()
    # Use the DBWrapper's execute method directly
    conn.execute("DELETE FROM rsvps")
    conn.execute("DELETE FROM bookmarks")
    conn.execute("DELETE FROM points_log")
    conn.execute("DELETE FROM chat_sessions")
    conn.execute("DELETE FROM events")
    conn.execute("DELETE FROM users")

    conn.execute(
        "INSERT INTO users (id,name,email,interests,department,role,points,created_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        ("org-001","Campus Admin","admin@rccit.edu",
         json.dumps(["tech","cultural"]),"Admin","organizer",0,
         datetime.now().isoformat())
    )

    for e in events:
        conn.execute(
            """INSERT INTO events
            (title,description,category,venue,lat,lng,datetime,
             rsvp_count,organizer_id,image_url,why_it_matters)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (e["title"],e["description"],e["category"],e["venue"],
             e["lat"],e["lng"],e["datetime"],e["rsvp_count"],
             "org-001",e["image_url"],e["why_it_matters"])
        )

    conn.close()
    print(f"✅ Seeded {len(events)} events into PostgreSQL")

if __name__ == "__main__":
    seed()
