import React from 'react';

export default function OrganizerPortal() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Organizer Dashboard Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Control live feed, metrics, attendance and verification approvals</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2 text-sm font-semibold text-slate-700">
            <span className="text-slate-400">🛡️</span> Event Organizer
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* ACTIVE EVENTS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32 transition hover:shadow-md">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Events</div>
            <div className="flex justify-between items-end">
              <div className="text-4xl font-black text-slate-800">3</div>
              <div className="text-2xl text-orange-500">⚡</div>
            </div>
          </div>
          {/* TOTAL RSVPS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32 transition hover:shadow-md">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total RSVPs</div>
            <div className="flex justify-between items-end">
              <div className="text-4xl font-black text-slate-800">842</div>
              <div className="text-2xl text-indigo-700">👥</div>
            </div>
          </div>
          {/* VEG ORDERS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32 transition hover:shadow-md">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Veg Orders</div>
            <div className="flex justify-between items-end">
              <div className="text-4xl font-black text-slate-800">181</div>
              <div className="text-2xl">🥗</div>
            </div>
          </div>
          {/* AVG SUCCESS SCORE */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32 transition hover:shadow-md">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Avg Success Score</div>
            <div className="flex justify-between items-end">
              <div className="text-4xl font-black text-slate-800">8.4 <span className="text-lg text-slate-400 font-bold">/ 10</span></div>
              <div className="text-2xl text-amber-400">⭐</div>
            </div>
          </div>
        </div>

        {/* Middle Row: Food & Venue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FOOD MANAGEMENT */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="text-indigo-600 text-base">🍴</span> FOOD MANAGEMENT (LIVE COUNTS)
            </h3>
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-indigo-100 transition cursor-default">
                <div className="flex items-center gap-4">
                  <span className="text-xl">🥗</span>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Vegetarian</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Selected by attendees at registration</div>
                  </div>
                </div>
                <div className="text-lg font-black text-indigo-700">181</div>
              </div>
              {/* Item 2 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-indigo-100 transition cursor-default">
                <div className="flex items-center gap-4">
                  <span className="text-xl">🍗</span>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Non-vegetarian</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Chicken / Egg options selected</div>
                  </div>
                </div>
                <div className="text-lg font-black text-indigo-700">88</div>
              </div>
              {/* Item 3 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex justify-between items-center bg-white shadow-sm hover:border-indigo-100 transition cursor-default">
                <div className="flex items-center gap-4">
                  <span className="text-xl">🥛</span>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Special Dietary Requirements</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Jain (12) + Gluten-free (10)</div>
                  </div>
                </div>
                <div className="text-lg font-black text-indigo-700">22</div>
              </div>
            </div>
          </div>

          {/* VENUE MANAGEMENT */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="text-indigo-600 text-base">🏢</span> VENUE MANAGEMENT (MULTI-VENUE)
            </h3>
            <div className="space-y-6 mt-6">
              {/* Item 1 */}
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-4 items-start">
                  <span className="text-xl">🏫</span>
                  <div>
                    <div className="font-bold text-sm text-slate-800">On-campus venues</div>
                    <div className="text-[10px] text-slate-400 mt-1">Main Auditorium, Seminar hall, CS Labs</div>
                  </div>
                </div>
                <div className="text-xs font-black text-emerald-600">Available</div>
              </div>
              {/* Item 2 */}
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-4 items-start">
                  <span className="text-xl">🏢</span>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Off-campus venues</div>
                    <div className="text-[10px] text-slate-400 mt-1">Local Hotels, Partner Co-working hubs</div>
                  </div>
                </div>
                <div className="text-xs font-black text-orange-600">Bookable</div>
              </div>
              {/* Item 3 */}
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-4 items-start">
                  <span className="text-xl">🌐</span>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Virtual / hybrid spaces</div>
                    <div className="text-[10px] text-slate-400 mt-1">Google Meet, Zoom API integrations</div>
                  </div>
                </div>
                <div className="text-xs font-black text-indigo-700">Online API</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* QR CHECK-IN */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="text-indigo-600 text-base">📷</span> QR CHECK-IN & ATTENDANCE SCANNER
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 mb-5">Auto-generated QR per attendee. Simulates scanning entries to mark live attendance and award points.</p>
            
            {/* Camera block */}
            <div className="bg-white border-2 border-slate-100 rounded-3xl h-64 flex items-center justify-center relative overflow-hidden mb-6 shadow-inner">
              <div className="text-center">
                <div className="text-4xl mb-2 text-slate-300 font-mono tracking-[0.3em] font-black">O:O</div>
                <div className="text-xs font-black tracking-[0.2em] text-emerald-500 uppercase">Simulating Web Cam</div>
                <div className="text-4xl mt-2 text-slate-300 font-mono tracking-[0.3em] font-black">O:C</div>
              </div>
              {/* Green scan line */}
              <div className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.8)] top-1/2 animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">Simulate Check-in Quick Actions</div>
            <div className="space-y-2">
              {/* Item 1 */}
              <div className="flex justify-between items-center py-1">
                <div className="text-xs font-bold text-slate-700">HackIndia 2026 — Build with AI</div>
                <button className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">Simulate Scan Check-in</button>
              </div>
              {/* Item 2 */}
              <div className="flex justify-between items-center py-1">
                <div className="text-xs font-bold text-slate-700">Diwali Cultural Fest</div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">✓ Checked-In</div>
              </div>
              {/* Item 3 */}
              <div className="flex justify-between items-center py-1">
                <div className="text-xs font-bold text-slate-700">GDG Cloud Study Jam</div>
                <button className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">Simulate Scan Check-in</button>
              </div>
              {/* Item 4 */}
              <div className="flex justify-between items-center py-1">
                <div className="text-xs font-bold text-slate-700">Devfolio Open Hack</div>
                <button className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">Simulate Scan Check-in</button>
              </div>
              {/* Item 5 */}
              <div className="flex justify-between items-center py-1">
                <div className="text-xs font-bold text-slate-700">AI/ML Workshop — Generative AI Fundamentals</div>
                <button className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">Simulate Scan Check-in</button>
              </div>
              {/* Item 6 */}
              <div className="flex justify-between items-center py-1">
                <div className="text-xs font-bold text-slate-700">Career Fair 2026 — Top 50 Companies</div>
                <button className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">Simulate Scan Check-in</button>
              </div>
            </div>
          </div>

          {/* CERTIFICATE APPROVAL */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="text-indigo-600 text-base">🏅</span> CERTIFICATE APPROVAL QUEUE
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 mb-6">Review and approve certificates for checked-in event attendees and external uploads.</p>
              
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">Event Attendance Certificates</div>
              <div className="space-y-4 mb-8">
                {[
                  { title: 'HackIndia 2026 — Build with AI', checked: false, primary: false },
                  { title: 'Diwali Cultural Fest', checked: true, primary: true },
                  { title: 'GDG Cloud Study Jam', checked: false, primary: false },
                  { title: 'Devfolio Open Hack', checked: false, primary: false },
                  { title: 'AI/ML Workshop — Generative AI Fundamentals', checked: false, primary: false },
                  { title: 'Career Fair 2026 — Top 50 Companies', checked: false, primary: false },
                ].map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-slate-700">{c.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Checked-in: {c.checked ? 'Yes' : 'No'}</div>
                    </div>
                    <button className={`text-[10px] font-bold px-4 py-2 rounded-lg transition ${
                      c.primary ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}>
                      Approve Issuance
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">External Proof Links</div>
              <div className="border border-yellow-200 bg-yellow-50/50 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-[10px] font-black px-3 py-1.5 rounded-bl-xl tracking-wider">PENDING</div>
                <div className="text-xs font-black text-slate-800 mb-1.5">React Advanced Placement</div>
                <div className="text-[10px] text-slate-500 mb-3">Student: Rahul Sen (Information Technology)</div>
                <div className="flex justify-between items-center">
                  <a href="#" className="text-[10px] font-semibold text-indigo-600 hover:underline">Verify Link →</a>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2">Reject</button>
                    <button className="bg-emerald-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 transition">Approve</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row (Smart Notifications + Analytics) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SMART NOTIFICATIONS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-1">
              <span className="text-indigo-600 text-base">🔔</span> SMART NOTIFICATIONS (ORGANIZER BROADCASTS)
            </h3>
            <p className="text-[10px] text-slate-400 mb-5">Type and send notifications. These will automatically appear at the top of students' feeds as pulsing alerts.</p>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input type="text" placeholder="e.g. Venue changed to Hall B — only people who RSVP'd" className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition" />
              <button className="bg-indigo-600 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 whitespace-nowrap">
                <span>🚀</span> Broadcast
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">Recent Broadcasts</div>
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex justify-between items-start">
              <div className="flex gap-3">
                <span className="text-lg mt-0.5">📢</span>
                <div>
                  <div className="text-xs font-bold text-slate-700 leading-relaxed">Notice: Venue changed to Seminar Hall B for all tech workshops.</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 whitespace-nowrap pt-1 font-medium">Just now</div>
            </div>
          </div>

          {/* ANALYTICS DASHBOARD DETAILS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-6">
              <span className="text-indigo-600 text-base">📊</span> ANALYTICS DASHBOARD DETAILS
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 lg:gap-6">
              {/* Registration Funnel */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-4 h-6 flex items-end">Registration Funnel</div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Views</span> <span>1,200</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-[100%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Saves</span> <span>842</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-[70%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>RSVPs</span> <span>268</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-[30%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Attended</span> <span>192</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[20%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-4 h-6 flex items-end">Department Breakdown</div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 leading-tight">
                      <span>Computer Science (CSE)</span> <span className="ml-2">32%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-[32%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 leading-tight">
                      <span>Information Tech (IT)</span> <span className="ml-2">22%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-300 w-[22%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 leading-tight">
                      <span>Electronics (ECE)</span> <span className="ml-2">18%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-300 w-[18%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 leading-tight">
                      <span>Other departments</span> <span className="ml-2">28%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-200 w-[28%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post-Event Ratings */}
              <div className="flex flex-col">
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-4 h-6 flex items-end">Post-Event Ratings</div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Speaker</span> <span>★ 4.8 / 5</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Food</span> <span>★ 4.2 / 5</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Services</span> <span>★ 4.5 / 5</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Venue</span> <span>★ 4.6 / 5</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-800 pt-3 border-t border-slate-100 mt-1">
                    <span>Overall Score</span> <span>★ 4.6 / 5</span>
                  </div>
                </div>
                
                <button className="w-full mt-5 bg-white border border-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-50 transition">
                  Export Analytics Data
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Custom styles for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 15%; }
          50% { top: 85%; }
          100% { top: 15%; }
        }
      `}} />
    </div>
  );
}
