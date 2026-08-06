import re

with open('C:/Users/TAUSHEF/Downloads/int/agency-frontend/src/app/admin/agents/sba/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add calendar state after activeMeeting line
old_state = "const [activeMeeting, setActiveMeeting] = useState(null)  // Meeting companion widget\n  const chatEndRef = useRef(null)"
new_state = """const [activeMeeting, setActiveMeeting] = useState(null)  // Meeting companion widget
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const chatEndRef = useRef(null)"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("✅ Calendar state added")
else:
    print("❌ Could not find activeMeeting state line")
    # Find the line
    for i, line in enumerate(content.split('\n')):
        if 'activeMeeting' in line and 'useState' in line:
            print(f"  Found at line {i+1}: {repr(line[:80])}")

# 2. Replace old renderMeetings with calendar version
old_meetings_section = """  /* ═══════════════════════════════════════════════
     Meetings tab — Calendar from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderMeetings = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading meetings...
      </div>
    )

    // If active meeting, show Meeting Companion
    if (activeMeeting) {
      return <MeetingCompanion meeting={activeMeeting} onClose={() => setActiveMeeting(null)} />
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Meetings</h3>
            <Button size="sm" variant="outline" className="text-[11px] h-7">
              <Plus className="size-3 mr-1" /> Schedule
            </Button>
          </div>
          {meetingsList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Calendar className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>No meetings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {meetingsList.map((m, i) => (
                <div key={m.id || i} className="px-4 py-3 flex items-center gap-3.5">
                  <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Calendar className="size-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.date} at {m.time}
                      {m.lead_name ? ` · ${m.lead_name}` : ''}
                      {m.duration_minutes ? ` · ${m.duration_minutes}min` : ''}
                    </div>
                  </div>
                  <Badge variant={m.status === 'scheduled' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                  {m.status === 'scheduled' && (
                    <button
                      onClick={() => setActiveMeeting(m)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Video className="size-3" /> Join & Notes
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }"""

new_meetings_section = """  /* ═══════════════════════════════════════════════
     Meetings tab — Google Calendar-style view
     ═══════════════════════════════════════════════ */
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const todayStr = new Date().toISOString().split('T')[0]
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  function prevMonth() { setCalendarDate(new Date(year, month - 1, 1)); setSelectedDate(null) }
  function nextMonth() { setCalendarDate(new Date(year, month + 1, 1)); setSelectedDate(null) }

  const meetingsByDate = useMemo(() => {
    const map = {}
    meetingsList.forEach(m => {
      const key = m.date || ''
      if (!map[key]) map[key] = []
      map[key].push(m)
    })
    return map
  }, [meetingsList])

  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] || []) : []

  function fmtDate(y, mo, d) {
    return `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const renderCalendarGrid = () => (
    <>
      <div className="flex items-center justify-between px-1 mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className="size-4 rotate-90" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className="size-4 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map(d => (
          <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-1 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square p-1" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const ds = fmtDate(year, month, day)
          const isToday = ds === todayStr
          const isSel = ds === selectedDate
          const dayMs = meetingsByDate[ds] || []
          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(isSel ? null : ds)}
              className={`aspect-square p-1 rounded-md flex flex-col items-start gap-0.5 transition-colors ${
                isSel ? 'bg-accent/20 ring-1 ring-accent' : isToday ? 'bg-accent/10' : 'hover:bg-accent/5'
              }`}
            >
              <span className={`text-[11px] font-medium ${isToday ? 'text-accent' : 'text-foreground'}`}>{day}</span>
              {dayMs.slice(0, 3).map((m, mi) => (
                <span key={mi} className={`text-[7px] leading-tight truncate w-full px-0.5 rounded ${
                  m.status === 'scheduled' ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground'
                }`}>
                  {m.time?.slice(0, 5)} {m.lead_name?.slice(0, 6) || ''}
                </span>
              ))}
              {dayMs.length > 3 && (
                <span className="text-[7px] text-muted-foreground/60 pl-0.5">+{dayMs.length - 3}</span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  const renderTodayBox = () => {
    const tm = meetingsByDate[todayStr] || []
    return (
      <div className="border border-border/60 rounded-lg p-3">
        <h4 className="text-[11px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Calendar className="size-3 text-accent" /> Aaj ki Meetings
        </h4>
        {tm.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60">No meetings today</p>
        ) : (
          <div className="space-y-1.5">
            {tm.map((m, i) => (
              <div key={m.id || i} className="flex items-center gap-2 text-[11px] text-foreground">
                <span className="text-accent font-medium">{m.time?.slice(0,5)}</span>
                <span className="text-muted-foreground">·</span>
                <span className="flex-1 truncate">{m.title || m.lead_name}</span>
                <Badge variant={m.status==='scheduled'?'default':'secondary'} className="text-[8px] h-4 px-1.5">{m.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderMeetings = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading meetings...
      </div>
    )

    if (activeMeeting) {
      return <MeetingCompanion meeting={activeMeeting} onClose={() => setActiveMeeting(null)} />
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calendar</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-[11px] h-7" onClick={() => { setCalendarDate(new Date()); setSelectedDate(todayStr) }}>
                <Calendar className="size-3 mr-1" /> Today
              </Button>
              <Button size="sm" className="text-[11px] h-7">
                <Plus className="size-3 mr-1" /> Schedule
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                {renderCalendarGrid()}
              </div>

              <div className="w-64 shrink-0 space-y-4">
                {renderTodayBox()}

                {selectedDate && selectedDate !== todayStr && (
                  <div className="border border-border/60 rounded-lg p-3">
                    <h4 className="text-[11px] font-semibold text-foreground mb-2">{selectedDate}</h4>
                    {selectedMeetings.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60">No meetings</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedMeetings.map((m, i) => (
                          <div key={m.id || i} className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => m.status === 'scheduled' && setActiveMeeting(m)}>
                            <div className={`size-2 rounded-full mt-0.5 shrink-0 ${m.status === 'scheduled' ? 'bg-accent' : 'bg-muted-foreground'}`} />
                            <div className="min-w-0">
                              <div className="text-[12px] font-medium text-foreground truncate">{m.title || m.lead_name || 'Meeting'}</div>
                              <div className="text-[10px] text-muted-foreground">{m.time?.slice(0,5)}{m.lead_name ? ` · ${m.lead_name}` : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {meetingsList.length > 0 && (
          <div className="border border-border rounded-lg bg-card mt-4">
            <div className="px-4 py-3 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Meetings</h3>
            </div>
            <div className="divide-y divide-border/60">
              {meetingsList.map((m, i) => (
                <div key={m.id || i} className="px-4 py-3 flex items-center gap-3.5">
                  <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Calendar className="size-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.date} at {m.time}
                      {m.lead_name ? ` · ${m.lead_name}` : ''}
                      {m.duration_minutes ? ` · ${m.duration_minutes}min` : ''}
                    </div>
                  </div>
                  <Badge variant={m.status === 'scheduled' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                  {m.status === 'scheduled' && (
                    <button onClick={() => setActiveMeeting(m)} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                      <Video className="size-3" /> Join & Notes
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }"""

if old_meetings_section in content:
    content = content.replace(old_meetings_section, new_meetings_section)
    print("✅ Meetings section replaced with calendar view")
else:
    print("❌ Could not find old meetings section")
    # Try to find what's there
    idx = content.find('Meetings tab — Calendar from Sales Agent')
    if idx >= 0:
        print(f"  Found at position {idx}")
        print(f"  Context: {repr(content[idx:idx+200])}")

with open('C:/Users/TAUSHEF/Downloads/int/agency-frontend/src/app/admin/agents/sba/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ File saved!")
