import cv2
import mediapipe as mp
import numpy as np
import time

# =========================
# MEDIAPIPE SETUP
# =========================
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# =========================
# CAMERA
# =========================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# =========================
# COLORS (BGR)
# =========================
CYAN = (255, 255, 0)
ORANGE = (0, 180, 255)
WHITE = (255, 255, 255)
RED = (0, 0, 255)
GREEN = (0, 255, 120)
CORE = (0, 255, 180)
BLACK = (18, 20, 28)
PANEL = (28, 31, 44)
PURPLE = (170, 90, 255)

# =========================
# EVENT + GAME STATE
# =========================
events = [
    {
        "id": 1,
        "title": "Hackathon 2026",
        "venue": "Main Auditorium",
        "time": "10:00 AM",
        "date": "2026-06-05",
        "mar": 10,
        "rsvps": 240,
        "why": "Builds resume + networking.",
    },
    {
        "id": 2,
        "title": "Robotics Demo Day",
        "venue": "Innovation Lab",
        "time": "2:00 PM",
        "date": "2026-06-12",
        "mar": 8,
        "rsvps": 149,
        "why": "Try live rover demos.",
    },
    {
        "id": 3,
        "title": "Career Fair 2026",
        "venue": "Convention Hall",
        "time": "11:00 AM",
        "date": "2026-06-20",
        "mar": 12,
        "rsvps": 920,
        "why": "Meet recruiters directly.",
    },
]

event_index = 0
leaderboard_points = 5
mar_points = 0
rsvp_count = 0
combo = 1
portfolio_events = []
chat_open = False
chat_messages = [
    "CampusBot: Ask me about venue, timing, or rewards.",
    "Tip: Open hand toggles this chat panel.",
]

gesture_text = "Waiting for hand..."
last_action_time = 0

# =========================
# DRAW HELPERS
# =========================
def put_text(img, text, org, scale=0.65, color=WHITE, thickness=2):
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_DUPLEX, scale, color, thickness)

def draw_glow_circle(img, center, radius, color, thickness=2, glow=15):
    for g in range(glow, 0, -3):
        alpha = 0.08 + 0.12 * (g / glow)
        overlay = img.copy()
        cv2.circle(overlay, center, radius + g, color, thickness)
        cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)
    cv2.circle(img, center, radius, color, thickness)

def draw_radial_ticks(img, center, radius, color, num_ticks=24, length=22, thickness=3):
    for i in range(num_ticks):
        angle = np.deg2rad(i * (360 / num_ticks))
        x1 = int(center[0] + (radius - length) * np.cos(angle))
        y1 = int(center[1] + (radius - length) * np.sin(angle))
        x2 = int(center[0] + radius * np.cos(angle))
        y2 = int(center[1] + radius * np.sin(angle))
        cv2.line(img, (x1, y1), (x2, y2), color, thickness)

def draw_core_pattern(img, center, radius):
    for t in np.linspace(0, 2 * np.pi, 40):
        r = radius * (0.7 + 0.3 * np.sin(6 * t))
        x = int(center[0] + r * np.cos(t))
        y = int(center[1] + r * np.sin(t))
        cv2.circle(img, (x, y), 3, ORANGE, -1)
    cv2.circle(img, center, int(radius * 0.6), CYAN, 2)
    cv2.circle(img, center, int(radius * 0.4), ORANGE, 2)

def draw_hud_details(img, center):
    for i in range(8):
        angle = np.deg2rad(210 + i * 10)
        x1 = int(center[0] + 140 * np.cos(angle))
        y1 = int(center[1] + 140 * np.sin(angle))
        x2 = int(center[0] + 170 * np.cos(angle))
        y2 = int(center[1] + 170 * np.sin(angle))
        cv2.line(img, (x1, y1), (x2, y2), CYAN, 4)
    for i in range(4):
        angle = np.deg2rad(270 + i * 15)
        x = int(center[0] + 120 * np.cos(angle))
        y = int(center[1] + 120 * np.sin(angle))
        cv2.rectangle(img, (x - 10, y - 10), (x + 10, y + 10), CYAN, 2)

def draw_arc_segments(img, center):
    cv2.ellipse(img, center, (110, 110), 0, -30, 210, CYAN, 3)
    cv2.ellipse(img, center, (100, 100), 0, -30, 210, ORANGE, 2)
    cv2.ellipse(img, center, (80, 80), 0, 0, 360, CYAN, 1)

def draw_panel(img, x1, y1, x2, y2, title, accent=CYAN):
    overlay = img.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), PANEL, -1)
    cv2.addWeighted(overlay, 0.82, img, 0.18, 0, img)
    cv2.rectangle(img, (x1, y1), (x2, y2), accent, 2)
    cv2.line(img, (x1, y1 + 38), (x2, y1 + 38), accent, 1)
    put_text(img, title, (x1 + 16, y1 + 27), 0.7, accent, 2)

def draw_chatbox(img, center):
    draw_glow_circle(img, center, 72, PURPLE, 3, glow=25)
    x = max(20, center[0] - 220)
    y = max(95, center[1] - 175)
    draw_panel(img, x, y, x + 455, y + 220, "CAMPUSBOT CHAT", PURPLE)
    status = "OPEN" if chat_open else "STANDBY"
    put_text(img, f"Status: {status}", (x + 18, y + 72), 0.65, GREEN if chat_open else ORANGE, 2)
    visible = chat_messages[-4:] if chat_open else ["Show an open hand again to open chat."]
    for i, line in enumerate(visible):
        put_text(img, line, (x + 18, y + 110 + i * 30), 0.56, WHITE, 1)

def draw_top_bar(img):
    h, w, _ = img.shape
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (w, 78), BLACK, -1)
    cv2.addWeighted(overlay, 0.88, img, 0.12, 0, img)
    put_text(img, f"Gesture: {gesture_text}", (22, 47), 0.85, WHITE, 2)

    xp_width = 250
    xp = min(1.0, leaderboard_points / 250)
    cv2.rectangle(img, (w - xp_width - 24, 16), (w - 24, 34), (70, 70, 85), -1)
    cv2.rectangle(img, (w - xp_width - 24, 16), (w - 24 - int(xp_width * (1 - xp)), 34), GREEN, -1)
    put_text(img, f"XP {leaderboard_points}  Combo x{combo}", (w - xp_width - 24, 62), 0.55, WHITE, 1)

def draw_side_panels(img):
    h, w, _ = img.shape
    event = events[event_index]

    draw_panel(img, 12, 100, 310, 390, "GESTURE QUESTS", CYAN)
    guides = [
        "Fist             -> RSVP",
        "Open hand        -> Chatbox",
        "Two fingers up   -> Interested",
        "Two fingers down -> Dismiss",
    ]
    for i, guide in enumerate(guides):
        put_text(img, guide, (30, 150 + i * 34), 0.54, WHITE, 1)

    draw_panel(img, 12, h - 225, 370, h - 20, "PLAYER CARD", GREEN)
    stats = [
        f"Current: {event['title']}",
        f"MAR Points: {mar_points}",
        f"RSVP Count: {rsvp_count}",
        f"Portfolio Events: {len(portfolio_events)}",
    ]
    for i, stat in enumerate(stats):
        put_text(img, stat, (30, h - 170 + i * 30), 0.55, WHITE if i else ORANGE, 1)

# =========================
# GESTURE HELPERS
# =========================
def fingers_up(hand_landmarks):
    lm = hand_landmarks.landmark
    tips = [4, 8, 12, 16, 20]
    fingers = []

    thumb_tip = np.array([lm[4].x, lm[4].y])
    thumb_joint = np.array([lm[3].x, lm[3].y])
    wrist = np.array([lm[0].x, lm[0].y])
    fingers.append(np.linalg.norm(thumb_tip - wrist) > np.linalg.norm(thumb_joint - wrist) + 0.025)

    for tip in tips[1:]:
        fingers.append(lm[tip].y < lm[tip - 2].y)

    return fingers

def add_action_points(base_points):
    global leaderboard_points, combo
    leaderboard_points += base_points * combo
    combo = min(combo + 1, 5)

# =========================
# MAIN LOOP
# =========================
while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)
    h, w, _ = frame.shape
    current_time = time.time()
    event = events[event_index]

    draw_top_bar(frame)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            lm = [(int(l.x * w), int(l.y * h)) for l in hand_landmarks.landmark]
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            palm = lm[9]
            tips = [lm[i] for i in [4, 8, 12, 16, 20]]
            dists = [np.linalg.norm(np.array(tip) - np.array(palm)) for tip in tips]
            avg_dist = np.mean(dists)
            finger_state = fingers_up(hand_landmarks)

            is_open_hand = sum(finger_state) >= 4
            is_fist = (not finger_state[1] and not finger_state[2] and not finger_state[3] and not finger_state[4])
            is_two_fingers_up = (not finger_state[0] and finger_state[1] and finger_state[2] and not finger_state[3] and not finger_state[4])
            is_two_fingers_down = (
                not finger_state[1]
                and not finger_state[2]
                and finger_state[3]
                and finger_state[4]
            )

            if is_fist:
                gesture_text = "RSVP"
                draw_glow_circle(frame, palm, 78, GREEN, 3, glow=24)
                put_text(frame, "RSVP LOCKED", (palm[0] - 90, palm[1] - 90), 0.8, GREEN, 2)
                if current_time - last_action_time > 2:
                    leaderboard_points += 20 * combo
                    mar_points += event["mar"]
                    rsvp_count += 1
                    event["rsvps"] += 1
                    combo = min(combo + 1, 5)
                    portfolio_events.append({"event": event["title"], "points": event["mar"]})
                    last_action_time = current_time

            elif is_open_hand:
                gesture_text = "Chatbox"
                draw_chatbox(frame, palm)
                if current_time - last_action_time > 1.8:
                    chat_open = not chat_open
                    chat_messages.append(
                        "CampusBot: I can suggest similar events or explain rewards."
                        if chat_open else
                        "CampusBot: Chat closed. Show an open hand to reopen."
                    )
                    add_action_points(3)
                    last_action_time = current_time

            elif is_two_fingers_up:
                gesture_text = "Interested"
                draw_glow_circle(frame, palm, 72, ORANGE, 3, glow=18)
                put_text(frame, "INTERESTED", (palm[0] - 95, palm[1] - 90), 0.8, ORANGE, 2)
                if current_time - last_action_time > 1.8:
                    add_action_points(5)
                    last_action_time = current_time

            elif is_two_fingers_down:
                gesture_text = "Dismiss"
                draw_glow_circle(frame, palm, 72, RED, 3, glow=18)
                put_text(frame, "DISMISSED", (palm[0] - 85, palm[1] - 90), 0.8, RED, 2)
                if current_time - last_action_time > 1.8:
                    event_index = min(len(events) - 1, event_index + 1)
                    combo = 1
                    last_action_time = current_time

            else:
                gesture_text = "Tracking..."
                draw_glow_circle(frame, palm, 58, CYAN, 2, glow=14)
                put_text(frame, "Track hand", (palm[0] - 60, palm[1] - 75), 0.6, WHITE, 1)

            index_x, index_y = lm[8]
            cv2.circle(frame, (index_x, index_y), 12, CORE, -1)
    else:
        combo = 1
        gesture_text = "Waiting for hand..."

    draw_side_panels(frame)

    cv2.imshow("EventSync Gesture Quest", frame)
    key = cv2.waitKey(1)
    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
