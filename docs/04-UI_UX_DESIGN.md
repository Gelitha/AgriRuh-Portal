# UI/UX Design & Wireframes

## Design Philosophy

- **Minimalism**: Clean, distraction-free interface
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile-First**: Responsive design for all devices
- **Speed**: Single-page application for instant feedback
- **Intuition**: Obvious navigation and clear CTAs

---

## Color Palette

```
Primary: #0066CC (University Blue)
Secondary: #FF6B6B (Alert Red for deadlines)
Success: #51CF66 (Green for confirmations)
Warning: #FFD93D (Yellow for late submissions)
Neutral: #F5F5F5 (Light backgrounds)
Dark: #333333 (Text)
Light: #FFFFFF (Cards, modals)
```

---

## Typography

- **Headings**: Inter, Segoe UI (sans-serif, 600 weight)
- **Body**: Inter, Segoe UI (sans-serif, 400 weight)
- **Monospace**: Monaco, Courier (for codes, timestamps)
- **Sizes**: H1=32px, H2=24px, H3=20px, Body=16px, Small=14px

---

## Component Library

Standard components used across all interfaces:
- Buttons (Primary, Secondary, Danger)
- Input Fields (Text, Email, Password, Select, Date)
- Cards (Submission status, Session cards)
- Modals (Confirmations, forms)
- Toast Notifications (Success, Error, Info)
- Tables (Sortable, filterable)
- Badges (Status indicators)
- Progress Bars (Submission progress)
- Spinners (Loading states)

---

## 1. Student Interface Wireframes

### Screen 1.1: Student Login Page

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│                     SMARTLAB                          │
│              Lab Submission System                    │
│                                                       │
│              ┌─────────────────────┐                 │
│              │ University Logo      │                 │
│              └─────────────────────┘                 │
│                                                       │
│   University ID / Email: [________________]           │
│   Password:               [________________]           │
│                                                       │
│   [ Remember Me ]                                    │
│                                                       │
│                ┌─────────────────┐                   │
│                │     LOGIN       │                   │
│                └─────────────────┘                   │
│                                                       │
│   Don't have an account? Contact admin              │
│   Forgot password? [Reset]                          │
│                                                       │
└─────────────────────────────────────────────────────┘

Features:
- Single-field login (University ID or Email)
- Password strength indicator
- "Forgot Password" link
- Responsive mobile view
- Remember me checkbox
```

### Screen 1.2: Student Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  SmartLab        [👤 John Doe ▼]    [ Bell 2 ]   [⚙️ Settings]░
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Welcome, John! 👋                                            │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Quick Actions                                           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │  ┌──────────────────┐    ┌──────────────────┐          │ │
│ │  │  📱 Scan QR Code │    │  ✏️  Submit Lab   │          │ │
│ │  │    (14 px taller)│    │  (Manual Select) │          │ │
│ │  └──────────────────┘    └──────────────────┘          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ My Submissions                                          │ │
│ ├──────────┬──────────────┬────────────┬─────────────────┤ │
│ │Subject   │Submitted At  │Status      │Marks            │ │
│ ├──────────┼──────────────┼────────────┼─────────────────┤ │
│ │DS & Algo │Apr 1, 12:30pm│🟢 On-time │18/20 ✓          │ │
│ │OOP       │Pending       │🟡 Open    │---              │ │
│ │Database  │Mar 25, 11:45am│🟢 On-time │19/20 ✓          │ │
│ └──────────┴──────────────┴────────────┴─────────────────┘ │
│  [< Prev]  Page 1 of 2  [Next >]                            │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Key Features:
- Welcome message with student name
- Quick action buttons (Scan QR, Submit manually)
- Submissions table with status badges
- Sortable columns
- Mark visibility control
```

### Screen 1.3: QR Code Scan Interface

```
┌─────────────────────────────────────────┐
│ SmartLab          [Back] [?]            │
├─────────────────────────────────────────┤
│                                          │
│ Scan QR Code                            │
│                                          │
│ Point your camera at the QR code        │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │                                   │  │
│  │     📷 Camera View                │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│ ◇ ◇ ◇ (scanning indicator)              │
│                                          │
│ [Can't scan? Enter manually]            │
│                                          │
└─────────────────────────────────────────┘

Features:
- Real-time camera preview
- Automatic QR detection
- Fallback to manual entry
- Vibration feedback on scan
- Portrait orientation lock
```

### Screen 1.4: Submission Confirmation

```
┌────────────────────────────────────────────────────────┐
│ SmartLab                                    [X Close]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│              ✅ Submission Successful!                 │
│                                                         │
│  Session: Data Structures & Algorithms                 │
│  Lab 1: Introduction to Algorithms                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Submission Details                               │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Submitted at: Apr 1, 2026, 12:30 PM             │  │
│  │ Status:       ✅ On-time                         │  │
│  │ Session ID:   SESS-20260401-001                 │  │
│  │ Receipt ID:   RCP-20260401-123456               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│ 📧 Confirmation email sent to john@university.edu     │
│                                                         │
│ ┌────────────────────────┐  ┌──────────────────────┐  │
│ │ View Dashboard         │  │ Submit Another Lab   │  │
│ └────────────────────────┘  └──────────────────────┘  │
│                                                         │
│ 🔒 This is your submission proof. Save it.            │
│                                                         │
└────────────────────────────────────────────────────────┘

Features:
- Clear success message
- Submission receipt with ID
- Key details (time, status)
- Auto-generated receipt
- Email confirmation
- Next action suggestions
```

### Screen 1.5: View Marks

```
┌────────────────────────────────────────────────────────┐
│ SmartLab                                               │
├────────────────────────────────────────────────────────┤
│                                                         │
│ My Marks                                               │
│                                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │ DS & Algorithms - Lab 1                          │  │
│ ├──────────────────────────────────────────────────┤  │
│ │                                                  │  │
│ │ Obtained: 18/20                                 │  │
│ │ Percentage: 90%                                 │  │
│ │ Grade: A+                                       │  │
│ │                                                  │  │
│ │ Feedback:                                        │  │
│ │ "Excellent solution. Algorithm implementation   │  │
│ │  is efficient and well-documented. Code quality │  │
│ │  is outstanding."                                │  │
│ │                                                  │  │
│ │ Reviewed by: Dr. Smith (CSE Dept)               │  │
│ │ Reviewed on: Apr 2, 2026                        │  │
│ │                                                  │  │
│ │ Breakdown:                                       │  │
│ │ • Correctness: ✓ Full marks                     │  │
│ │ • Algorithm Efficiency: ✓ Good                  │  │
│ │ • Code Quality: ✓ Excellent                     │  │
│ └──────────────────────────────────────────────────┘  │
│                                                         │
│ [Download Feedback]  [Back to Dashboard]              │
│                                                         │
└────────────────────────────────────────────────────────┘

Features:
- Clear marks display (obtained/total)
- Percentage and grade
- Detailed feedback from instructor
- Reviewer information
- Breakdown by criteria
- Downloadable feedback
```

---

## 2. Class Representative Interface Wireframes

### Screen 2.1: Rep Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ SmartLab    CLASS REP VIEW    [👤 Rep Name ▼]   [⚙️ Settings]░
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Welcome Back, Representative! 📊                             │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Quick Stats                                              │ │
│ ├──────────────┬──────────────┬──────────────┬─────────────┤ │
│ │ Active Sess. │ Total Submit►│ On-time %    │ Late Subm.  │ │
│ │      3       │      45      │     98%      │      1      │ │
│ └──────────────┴──────────────┴──────────────┴─────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [ + Create New Session ]                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Active Sessions                                              │
│ ┌────────────┬───────┬──────────┬─────────┬──────────────┐  │
│ │Lab Title   │Subject│DeadLine  │Subm.    │Actions       │  │
│ ├────────────┼───────┼──────────┼─────────┼──────────────┤  │
│ │Lab 1: Algo │DS&A   │Apr 5,1PM │45/50 ✅ │📊 View Details
│ │Lab 2: OOP  │OOP    │Apr 8,1PM │38/50 ⏳ │🔄 Monitor     
│ │Lab 3: DB   │DB     │Apr 12,1PM│12/50 ⚠️ │📱 Refresh     
│ └────────────┴───────┴──────────┴─────────┴──────────────┘  │
│                                                                │
│ [< Prev]  Page 1 of 1  [Next >]                             │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Features:
- At-a-glance statistics
- Quick actions (Create session)
- Active session cards
- Real-time submission counts
- Color-coded status
```

### Screen 2.2: Create Session Form

```
┌────────────────────────────────────────────────────────┐
│ SmartLab        Create Lab Session                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Session Details                                  │  │
│ ├──────────────────────────────────────────────────┤  │
│ │                                                  │  │
│ │ Subject: [Data Structures & Algorithms ▼]       │  │
│ │                                                  │  │
│ │ Lab Title: [Lab 1: Introduction         ]       │  │
│ │                                                  │  │
│ │ Date: [April 1, 2026  ]   Time: [10:00 - 12:00 │  │
│ │                                                  │  │
│ │ Submission Deadline: [April 1, 2026, 1:00 PM ] │  │
│ │                                                  │  │
│ │ ☑️ Allow Late Submissions                       │  │
│ │    Late Submission Window: [60] minutes         │  │
│ │                                                  │  │
│ │ Notes (Optional):                                │  │
│ │ ┌──────────────────────────────────────────────┐│  │
│ │ │ Submit via QR code only. No manual entries.  ││  │
│ │ │                                              ││  │
│ │ └──────────────────────────────────────────────┘│  │
│ │                                                  │  │
│ └──────────────────────────────────────────────────┘  │
│                                                         │
│ ┌────────────┐  ┌──────────────┐  ┌──────────────┐   │
│ │  Preview   │  │  Save Draft  │  │ Create & QR  │   │
│ └────────────┘  └──────────────┘  └──────────────┘   │
│                                                         │
└────────────────────────────────────────────────────────┘

Features:
- Subject selection dropdown
- Date/time picker
- Deadline configuration
- Late submission window toggle
- Optional notes field
- Draft save option
- Create with instant QR generation
```

### Screen 2.3: Session Monitoring Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ SmartLab     Lab 1: Algorithms     [Back] [Regenerate QR]    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Submission Progress                                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Submitted: 45 / 50 (90%)                                 │ │
│ │ ▓▓▓▓▓▓▓▓▓░░░ Progress Bar                                 │ │
│ │                                                            │ │
│ │ ✅ On-time: 44     🟡 Late: 1     ⏳ Pending: 5           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ QR Code                                                │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │  ┌──────────────────────────────────────┐              │  │
│ │  │                                      │              │  │
│ │  │          [QR CODE IMAGE]             │              │  │
│ │  │                                      │              │  │
│ │  │   SESS-20260401-001                  │              │  │
│ │  └──────────────────────────────────────┘              │  │
│ │                                                        │  │
│ │ [Print QR]  [Display on Screen]  [Email QR]  [Copy Link]
│ └────────────────────────────────────────────────────────┘  │
│                                                                │
│ Submissions List (Search: [___________])                     │
│ ┌────────────┬──────────────┬───────────┬──────────────────┐ │
│ │ Student    │ Submitted At │ Status    │ Actions          │ │
│ ├────────────┼──────────────┼───────────┼──────────────────┤ │
│ │John Doe    │Apr 1, 12:30pm│🟢 On-time │👁️ View          │ │
│ │Jane Smith  │Apr 1, 12:45pm│🟢 On-time │👁️ View          │ │
│ │Mike Brown  │Apr 1, 02:30pm│🟡 Late    │👁️ View          │ │
│ │Sarah Jones │-             │⏳ Pending │📧 Remind         │ │
│ └────────────┴──────────────┴───────────┴──────────────────┘ │
│  [< Prev]  Page 1 of 5  [Next >]                              │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Features:
- Progress bar with statistics
- QR code display and sharing options
- Real-time submission table
- Sortable/filterable submissions
- Send reminder emails
- View individual submissions
- Export option
```

---

## 3. Admin/Demonstrator Interface Wireframes

### Screen 3.1: Admin Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ SmartLab    ADMIN PANEL    [👤 Dr. Smith ▼]   [ 🔔 1 ] [⚙️] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ System Overview                                              │
│ ┌──────────────┬──────────────┬──────────────┬─────────────┐ │
│ │Total Sessions│Total Subm.   │Awaitng Marks │Avg Response │ │
│ │      23      │      892     │      47      │   2.3 hrs   │ │
│ └──────────────┴──────────────┴──────────────┴─────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [ 👥 Manage Users ] [ 📚 Manage Sessions ]              │ │
│ │ [ 📊 Analytics ] [ 🗂️ Export Data ]                     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Recent Submissions Awaiting Marks                            │
│ ┌──────────────┬─────────────┬──────────────────────────┐   │
│ │Student       │Session      │Days Awaiting             │   │
│ ├──────────────┼─────────────┼──────────────────────────┤   │
│ │John Doe      │DB Lab 2     │⚠️  3 days            │   │
│ │Sarah Jones   │OOP Lab 1    │🟡  1 day              │   │
│ │Mike Brown    │Algo Lab 3   │🟢  <1 day             │   │
│ └──────────────┴─────────────┴──────────────────────────┘   │
│  [Mark Now] [View All (47 pending)]                          │
│                                                                │
│ Department-wise Submission Stats                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ CSE: 89%  │ ECE: 92%  │ MECH: 85%  │ CIVIL: 88%         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Features:
- System-wide statistics
- Recent activity (pending marks)
- Quick action buttons
- Department-wise analytics
- Alerts for overdue items
```

### Screen 3.2: Marking Interface

```
┌──────────────────────────────────────────────────────────────┐
│ SmartLab     Mark Submission     [< Back]                    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Submission Info                                          │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Student: John Doe (CSE-2021001)                          │ │
│ │ Session: DS & Algorithms - Lab 1                         │ │
│ │ Submitted: Apr 1, 2026, 12:30 PM (On-time) ✅           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Download File] [Open in Browser]                       │ │
│ │ submission_lab1.pdf (2.3 MB)                             │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Marks & Feedback                                         │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │                                                          │ │
│ │ Total Marks: 20                                         │ │
│ │ Obtained:    [18        ]  out of 20                    │ │
│ │ Percentage:  90% (Grade: A+)                            │ │
│ │                                                          │ │
│ │ Rubric Breakdown:                                       │ │
│ │ □ Correctness:       [20/20] ✓                         │ │
│ │ □ Efficiency:        [15/20]                           │ │
│ │ □ Code Quality:      [18/20]                           │ │
│ │                                                          │ │
│ │ Feedback:                                               │ │
│ │ ┌──────────────────────────────────────────────────────┐│ │
│ │ │ Excellent solution. Your algorithm efficiently solves
│ │ │ the problem with good time complexity. The code is   
│ │ │ well-documented and follows best practices.          
│ │ └──────────────────────────────────────────────────────┘│ │
│ │                                                          │ │
│ │ Penalties:                                              │ │
│ │ ☐ Apply Late Penalty: [  0  ]%                         │ │
│ │                                                          │ │
│ │ Visibility: ☑️ Show Marks to Student                   │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ Final Marks: 18/20                                           │
│                                                                │
│ ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│ │ Save & Next    │  │ Save Draft   │  │ Cancel          │  │
│ └────────────────┘  └──────────────┘  └─────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Features:
- Student and submission info
- File preview/download
- Detailed rubric breakdown
- Feedback text editor
- Late penalty calculator
- Visibility toggle
- Mark visibility control
- Navigation to next submission
```

### Screen 3.3: User Management

```
┌──────────────────────────────────────────────────────────────┐
│ SmartLab     User Management     [+ Create User]             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Filters: Role [All ▼] | Dept [All ▼] | Status [All ▼] | 🔍 │
│          Search: [_____________________]                      │
│                                                                │
│ ┌──────────────┬──────────┬──────────────┬─────────────┐    │
│ │ Name         │ ID       │ Role         │ Dept        │    │
│ ├──────────────┼──────────┼──────────────┼─────────────┤    │
│ │John Doe      │CSE-2021001│Student      │ CSE        │    │
│ │Dr. Smith     │ADM-001   │Admin        │ CSE        │    │
│ │Emily Johnson │CSE-2021045│Student      │ CSE        │    │
│ │Sarah Rep     │CSE-2021012│Representative │ CSE      │    │
│ │Mike Brown    │ECE-2021034│Student      │ ECE        │    │
│ └──────────────┴──────────┴──────────────┴─────────────┘    │
│  [< Prev]  Showing 1-10 of 234  [Next >]                     │
│                                                                │
│                                                                │
│ User Actions: [Edit] [Deactivate] [Reset Password] [Delete]  │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Features:
- Filter by role, department, status
- Search functionality
- Pagination
- Bulk actions
- User status indicators
- Quick edit/delete options
```

### Screen 3.4: Analytics & Reporting

```
┌──────────────────────────────────────────────────────────────┐
│ SmartLab     Analytics & Reports                             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Date Range: [Mar 1, 2026 ▼] to [Mar 26, 2026 ▼]  [Update]  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Submission Trends (Line Chart)                           │ │
│ │                    /‾‾\                                  │ │
│ │                    ‾|  |‾‾\                              │ │
│ │                     |  |   \_____                         │ │
│ │  ├─────────────────────────────────────                  │ │
│ │  0 S  M  T  W  T  F  S                                   │ │
│ │    (Daily Submissions)                                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────┬────────────────────────────────┐   │
│ │Submission Rate       │Late Submissions              │   │
│ │ 94.3%                │ 8 (0.9%)                     │   │
│ └──────────────────────┴────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Department-wise Performance (Bar Chart)                 │ │
│ │ CSE: ███████████ 95%                                   │ │
│ │ ECE: ██████████░ 92%                                   │ │
│ │ MECH:██████░░░░░ 85%                                   │ │
│ │ CIVIL:██████████ 90%                                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [ Export as CSV ] [ Export as PDF ] [ Print ]           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
└──────────────────────────────────────────────────────────────┘

Features:
- Date range filtering
- Trend visualization
- Department comparison
- Key metrics display
- Export capabilities
- Interactive charts
```

---

## 4. Mobile Responsive Design

### Mobile Student View

```
┌──────────────────────┐
│ SmartLab      ☰      │
├──────────────────────┤
│                      │
│ 👋 Welcome, John!    │
│                      │
│ [📱 Scan QR  ]       │
│ [✏️  Submit  ]       │
│                      │
│ My Submissions       │
│                      │
│ DS & Algo            │
│ Apr 1, 12:30pm       │
│ 🟢 On-time           │
│ 18/20 ✓              │
│ [View >]             │
│                      │
│ OOP                  │
│ Pending...           │
│ 🟡 Open              │
│ --- marks            │
│ [View >]             │
│                      │
│ [Settings] [Logout]  │
│                      │
└──────────────────────┘

Design considerations:
- Touch-friendly buttons (44×44px minimum)
- Vertical scrolling prioritized
- Collapsed navigation menu
- Optimized for portrait mode
- Reduced table complexity
```

---

## 5. Accessibility & WCAG Compliance

### Implementation Details

- **Keyboard Navigation**: All functions accessible via keyboard
- **Screen Reader Support**: ARIA labels, semantic HTML
- **Color Contrast**: WCAG AA (4.5:1 for text, 3:1 for graphics)
- **Focus Indicators**: Visible focus states on all interactive elements
- **Form Labels**: Associated labels for all input fields
- **Error Messages**: Clear, descriptive error text
- **Loading States**: Proper feedback during async operations

### Example: Form Accessibility

```html
<form>
  <label for="university-id">University ID</label>
  <input 
    id="university-id"
    type="text"
    placeholder="CSE-20210123"
    aria-required="true"
    aria-describedby="id-help"
  />
  <span id="id-help">Format: DEPT-YYYYXXXX</span>
  
  <label for="password">Password</label>
  <input 
    id="password"
    type="password"
    aria-required="true"
  />
  
  <button type="submit" aria-label="Submit login form">
    Login
  </button>
</form>
```

---

## 6. State & Loading Indicators

### Loading States

```
Skeleton Loaders:
[████████] (for table rows)

Spinning indicators:
⟳ Loading submissions...

Progress bars:
▓▓▓▓▓░░░░░ 50% Complete

Toast notifications:
✅ Submission successful!
⚠️  Session deadline approaching
❌ Failed to upload file
```

### Empty States

```
┌──────────────────────────────────────┐
│                                      │
│         📋 No Submissions Yet         │
│                                      │
│    You haven't submitted any labs   │
│                                      │
│   [Start by scanning a QR code]     │
│                                      │
└──────────────────────────────────────┘
```

---

## 7. Notification Design

### Toast Notifications

- Duration: 5 seconds (auto-dismiss)
- Position: Top-right corner
- Stacking: Max 3 visible

### Types

```
✅ Success (Green):
   Submission uploaded successfully

⚠️  Warning (Yellow):
   Deadline is 1 hour away

❌ Error (Red):
   Failed to save marks. Please retry.

ℹ️  Info (Blue):
   New feedback available
```

---

## 8. Dark Mode Support

Future enhancement to increase accessibility and reduce eye strain.

```
Light Mode:
Background: #FFFFFF
Text: #333333
Primary: #0066CC

Dark Mode:
Background: #1a1a1a
Text: #E0E0E0
Primary: #66B2FF
```

