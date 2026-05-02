# Picify — Complete Feature List & Database Schemas

> **Stack:** Next.js 15 (App Router) · MongoDB (Mongoose) · Cloudinary · Stripe · Google Gemini AI

---

## 🚀 Feature List

### 🔐 Authentication & Accounts
| Feature | Detail |
|---|---|
| Email/Password Auth | bcrypt-hashed passwords, JWT session cookie |
| Google OAuth | One-click sign-in via Google |
| Guest accounts | Browse without signing in |
| Password reset | Token-based email reset flow |
| Email verification | Verify account via token link |
| Two-Factor Authentication | TOTP-based 2FA (toggle in settings) |
| Role-based access | `user` / `admin` roles with middleware guards |
| Profile customization | Display name, bio, avatar, cover image, portfolio URL |
| Account deletion | Soft-delete (frees up email/username immediately) |

---

### 📌 Pins (Core Content)
| Feature | Detail |
|---|---|
| Image upload | Multi-image upload via Cloudinary |
| AI Generation | Google Gemini 2.5 Flash auto-generates title, description, hashtags, caption |
| Color palette extraction | Auto-extracts dominant colors from uploaded image |
| Image hash | Duplicate detection via perceptual hash |
| Carousel pins | Multiple images in a single pin |
| Source link | External "Get it here" link |
| Categories | Up to 3 categories per pin |
| Tags | Unlimited hashtag-style tags |
| Affiliate link | Monetizable external link |
| Visibility toggle | Public / Private |
| Draft mode | Save without publishing |
| Scheduled publishing | Set a future date/time to auto-publish |
| NSFW detection | `isNSFW` flag + confidence score |
| Orientation | Portrait / Landscape / Square |
| Like / Unlike | Heart button with count |
| Save / Unsave | Bookmark to a board |
| Comments | Add/delete, nested replies, mentions, likes on comments |
| Collaborators | Add multiple co-authors to a pin |
| View tracking | Track unique views per pin |
| Download | One-click image download |
| Share | Copy link to clipboard |
| Edit pin | Full edit: title, description, board, categories, privacy, draft, collaborators |
| Delete pin | Soft-delete with confirmation |

---

### 📋 Boards & Organisation
| Feature | Detail |
|---|---|
| Create boards | Custom name, description, cover image |
| Board privacy | Public / Private toggle |
| Collaborative boards | Add collaborators as editor or viewer |
| Board folders | Nest boards into folder groups |
| Board followers | Other users can follow a board |
| Save pins to boards | Assign saved pin to any board |
| Pin count | Auto-tracked `pinsCount` |

---

### 👥 Social & Collaboration
| Feature | Detail |
|---|---|
| Follow / Unfollow | Subscribe to creators |
| Followers page | See who follows a user (respects privacy) |
| Following page | See who a user follows (respects privacy) |
| Block / Unblock | Prevent a user from seeing your content |
| Report | Report pins, users, comments, or boards |
| Pin collaborators | Multi-author pins with contributor profiles |
| User mentions | @-mention support in comments |

---

### 🔔 Notifications
| Feature | Detail |
|---|---|
| Notification types | `like`, `comment`, `follow`, `save`, `mention`, `collab_invite`, `system` |
| Read / Unread state | Mark all or individual as read |
| Unread badge | Live count in Navbar/Sidebar |
| Notification preferences | Toggle likes, comments, follows, saves, weekly digest |
| Auto-expiry | Notifications deleted after **90 days** (MongoDB TTL) |

---

### 🔍 Search & Discovery
| Feature | Detail |
|---|---|
| Global search | Full-text search across pins, users, and boards |
| Search history | Per-user query history (90-day TTL) |
| Category explore | Browse by category tag |
| Trending | Scored & ranked pins by hourly / daily / weekly engagement |
| Watch history | Recently viewed pins (30-day TTL) |

---

### 💸 Monetization & Creator Economy
| Feature | Detail |
|---|---|
| Creator Tips | Stripe Checkout — users send real money tips |
| 90/10 revenue split | Creator gets 90%, platform keeps 10% |
| Stripe Connect | Creator connects their Stripe account to receive payouts |
| Tip success page | Animated success screen with auto-redirect |
| Tip failed page | Clear cancelled/error messaging with retry button |
| Tip history | Full list of all tips sent with creator, pin, amount, and date |
| Creator Dashboard | Earnings overview: total, pending, recent tip history |
| Brand Collaborations | "Request Brand Deal" button on creator profile |
| Creator Subscriptions | Monthly subscription with configurable price |
| Affiliate links | Monetisable "Get it here" links on pins |
| Analytics export | CSV export of pin performance data |

---

### 🛡️ Privacy & Safety
| Feature | Detail |
|---|---|
| Public profile toggle | Make entire profile visible / private |
| Show followers toggle | Hide/show followers count and list |
| Show saved pins toggle | Hide/show saved pins tab from public |
| Block users | Block removes user from your content feed |
| Report system | Reason-based reporting (spam, harassment, NSFW, copyright) |
| Admin moderation | Admins can review, resolve, or dismiss reports |

---

### ⚙️ Settings
| Tab | Features |
|---|---|
| **Profile** | Display name, username, bio, portfolio URL, avatar, cover image |
| **Account** | Change password, delete account, email display |
| **Privacy** | Public profile, show followers, show saved pins, creator mode |
| **Notifications** | Toggle per-notification-type preferences (auto-saves on toggle) |
| **Appearance** | Light / Dark / System theme |
| **Monetization** | Tips, brand collabs, subscriptions toggle + tip history quick-link |

---

### 🎛️ Admin Panel
| Feature | Detail |
|---|---|
| Role guard | Only `admin` role can access `/admin` |
| Platform analytics | Total users, pins, boards, active users |
| User management | View all users, verify creators, ban users |
| Report queue | Pending reports with review/dismiss actions |
| Admin logs | Audit trail of admin actions |
| Announcements | Post platform-wide announcements |
| Feature flags | Toggle features on/off platform-wide |
| System settings | Global configuration key-value store |

---

### 🎨 UI / UX
| Feature | Detail |
|---|---|
| Masonry grid | Responsive Pinterest-style infinite-scroll layout |
| Infinite scroll | Paginated loading with `react-infinite-scroll-component` |
| Dark/light mode | System-aware with manual override, persisted per user |
| Skeleton loaders | Content placeholder animations |
| Toast notifications | `react-hot-toast`-style non-intrusive feedback |
| Glassmorphism UI | `backdrop-blur`, translucent cards, gradient accents |
| Responsive layout | Desktop: sidebar nav · Mobile: top navbar + dropdown |
| Smooth animations | Hover, scale, fade, and slide transitions |
| Google Fonts | Modern typography (Inter / system font stack) |

---

---

## 🗄️ Database Schemas (MongoDB / Mongoose)

### 1. `User`
```
email             String   unique, sparse, lowercase
password          String   (hashed)
username          String   unique, required, lowercase
displayName       String
bio               String   max 500
portfolioUrl      String
profileImage      String   (Cloudinary URL)
coverImage        String   (Cloudinary URL)
isVerified        Boolean  default: false
isCreator         Boolean  default: true
stripeConnectedAccountId  String
stripeCustomerId          String
tipsEnabled               Boolean  default: false
brandCollabsEnabled       Boolean  default: false
creatorSubscriptionsEnabled Boolean default: false
subscriptionPrice         Number   default: 499 (cents)
role              String   enum: [user, admin]
accountType       String   enum: [email, google, guest]
googleId          String   unique, sparse
twoFactorEnabled  Boolean  default: false
twoFactorSecret   String
emailVerified     Boolean  default: false
emailVerifyToken  String
resetPasswordToken String
resetPasswordExpires Date
privacy {
  isPublic        Boolean  default: true
  showSavedPins   Boolean  default: true
  showFollowers   Boolean  default: true
}
notificationPreferences {
  likes           Boolean  default: true
  comments        Boolean  default: true
  follows         Boolean  default: true
  saves           Boolean  default: true
  weeklyDigest    Boolean  default: false
}
themePreference   String   enum: [light, dark, auto]
followers         [ObjectId → User]
following         [ObjectId → User]
followersCount    Number   default: 0
followingCount    Number   default: 0
lastLogin         Date
isActive          Boolean  default: true
isDeleted         Boolean  default: false
createdAt / updatedAt (auto)
```
**Indexes:** `email`, `username`, `googleId`

---

### 2. `Pin`
```
userId            ObjectId → User   required
title             String   max 200, required
description       String   max 2000
images [{
  url             String   required
  publicId        String   (Cloudinary)
  width, height, size, format  Number/String
  isCompressed    Boolean
}]
isPrimaryCarousel Boolean  default: false
sourceLink        String
tags              [String] lowercase
categories        [String] max 3
colorPalette      [String] hex colors
aiCaption         String
aiDescription     String
aiTitle           String
aiHashtags        [String]
imageHash         String
isPublic          Boolean  default: true
isDraft           Boolean  default: false
isNSFW            Boolean  default: false
nsfwScore         Number
orientation       String   enum: [portrait, landscape, square]
boardId           ObjectId → Board
collaborators     [ObjectId → User]
affiliateLink     String
isSponsored       Boolean  default: false
scheduledFor      Date
publishedAt       Date
likes             [ObjectId → User]
likesCount        Number   default: 0
saves             [ObjectId → User]
savesCount        Number   default: 0
commentsCount     Number   default: 0
views             Number   default: 0
viewedBy          [ObjectId → User]
isDeleted         Boolean  default: false
createdAt / updatedAt (auto)
```
**Indexes:** `userId`, `boardId`, `tags`, `categories`, `createdAt`, composite `{isPublic, isDeleted, publishedAt}`, full-text `{title, description, tags}`

---

### 3. `Board`
```
userId            ObjectId → User   required
name              String   max 100, required
description       String   max 500
coverImage        String
slug              String
isPublic          Boolean  default: true
isCollaborative   Boolean  default: false
collaborators [{
  userId          ObjectId → User
  role            String   enum: [editor, viewer]
  addedAt         Date
}]
parentFolderId    ObjectId → BoardFolder
pinsCount         Number   default: 0
followersCount    Number   default: 0
followers         [ObjectId → User]
isDeleted         Boolean  default: false
createdAt / updatedAt (auto)
```
**Indexes:** `userId`, `parentFolderId`, `{userId, isDeleted}`

---

### 4. `Comment`
```
pinId             ObjectId → Pin    required
userId            ObjectId → User   required
text              String   max 1000, required
parentCommentId   ObjectId → Comment  (null = top-level)
mentions          [ObjectId → User]
isPinned          Boolean  default: false
likesCount        Number   default: 0
likes             [ObjectId → User]
repliesCount      Number   default: 0
isDeleted         Boolean  default: false
createdAt / updatedAt (auto)
```
**Indexes:** `{pinId, createdAt}`, `userId`, `parentCommentId`

---

### 5. `SavedPin`
```
userId            ObjectId → User   required
pinId             ObjectId → Pin    required
boardId           ObjectId → Board  (nullable)
savedAt           Date   default: now
```
**Indexes:** `{userId, pinId}` unique, `boardId`, `{userId, savedAt}`

---

### 6. `Notification`
```
userId            ObjectId → User   (recipient)
actorId           ObjectId → User   (who triggered it)
type              String   enum: [like, comment, follow, save, mention, collab_invite, pin_saved, system]
entityId          ObjectId
entityType        String   enum: [pin, board, comment, user]
message           String
isRead            Boolean  default: false
createdAt         Date   default: now
```
**Indexes:** `{userId, isRead, createdAt}` · **TTL: 90 days**

---

### 7. `Earnings`
```
userId            ObjectId → User   required  (creator/recipient)
type              String   enum: [tip, subscription, sponsored_pin, affiliate, brand_deal]
amount            Number   required (cents)
currency          String   default: USD
status            String   enum: [pending, completed, refunded, failed]
fromUserId        ObjectId → User   (who sent the tip)
pinId             ObjectId → Pin    (related pin)
note              String   max 500
stripePaymentIntentId  String  (unique idempotency key)
paidOutAt         Date
createdAt / updatedAt (auto)
```
**Indexes:** `{userId, createdAt}`, `{userId, type}`

---

### 8. `Report`
```
reporterId        ObjectId → User   required
entityId          ObjectId          required
entityType        String   enum: [pin, user, comment, board]
reason            String   enum: [spam, inappropriate, copyright, harassment, other]
description       String   max 500
status            String   enum: [pending, reviewed, resolved, dismissed]
reviewedBy        ObjectId → User
reviewNotes       String
createdAt / updatedAt (auto)
```
**Indexes:** `{status, createdAt}`, `entityId`

---

### 9. `BlockedUser`
```
userId            ObjectId → User   required  (who blocked)
blockedUserId     ObjectId → User   required  (who was blocked)
blockedAt         Date   default: now
```
**Indexes:** `{userId, blockedUserId}` unique, `userId`

---

### 10. `Activity`
```
userId            ObjectId → User   required
type              String   enum: [pin_created, board_created, follow, save, like, comment]
entityId          ObjectId
entityType        String   enum: [pin, board, user, comment]
metadata          Mixed
createdAt         Date   default: now
```
**Indexes:** `{userId, createdAt}` · **TTL: 90 days**

---

### 11. `Analytics`
```
userId            ObjectId → User   required
pinId             ObjectId → Pin    (nullable)
boardId           ObjectId → Board  (nullable)
date              Date   required
views             Number   default: 0
saves             Number   default: 0
likes             Number   default: 0
comments          Number   default: 0
shares            Number   default: 0
profileViews      Number   default: 0
newFollowers      Number   default: 0
engagement        Number   default: 0
createdAt         Date
```
**Indexes:** `{userId, date}`, `{pinId, date}` · **TTL: 365 days**

---

### 12. `TrendingPin`
```
pinId             ObjectId → Pin   required
category          String   default: all
score             Number   default: 0
rank              Number
period            String   enum: [hourly, daily, weekly]
calculatedAt      Date   default: now
```
**Indexes:** `{period, rank}`, `{period, category, rank}` · **TTL: 8 days**

---

### 13. `WatchHistory`
```
userId            ObjectId → User   required
pinId             ObjectId → Pin    required
viewedAt          Date   default: now
```
**Indexes:** `{userId, viewedAt}`, `{userId, pinId}` · **TTL: 30 days**

---

### 14. `SearchHistory`
```
userId            ObjectId → User   (nullable for guests)
query             String   required, trimmed
type              String   enum: [keyword, tag, category, visual]
filters           Mixed
resultsCount      Number   default: 0
searchedAt        Date   default: now
```
**Indexes:** `{userId, searchedAt}` · **TTL: 90 days**

---

### 15. `AdminLog`
```
adminId           ObjectId → User   required
action            String   required
targetId          ObjectId          (optional entity)
targetType        String
details           Mixed
createdAt         Date
```

---

### 16. `Announcement`
```
title             String   required
message           String   required
type              String   enum: [info, warning, maintenance]
isActive          Boolean  default: true
expiresAt         Date
createdBy         ObjectId → User
createdAt / updatedAt (auto)
```

---

### 17. `BoardFolder`
```
userId            ObjectId → User   required
name              String   required
createdAt / updatedAt (auto)
```

---

### 18. `CategoryTag`
```
name              String   required, unique
slug              String   unique
icon              String
color             String
pinsCount         Number   default: 0
isActive          Boolean  default: true
createdAt / updatedAt (auto)
```

---

### 19. `FeatureFlag`
```
key               String   unique, required
enabled           Boolean  default: false
description       String
updatedBy         ObjectId → User
createdAt / updatedAt (auto)
```

---

### 20. `SystemSettings`
```
key               String   unique, required
value             Mixed    required
description       String
updatedBy         ObjectId → User
createdAt / updatedAt (auto)
```

---

## 🗂️ TTL Summary

| Collection | TTL |
|---|---|
| `Notification` | 90 days |
| `Activity` | 90 days |
| `SearchHistory` | 90 days |
| `Analytics` | 365 days |
| `TrendingPin` | 8 days |
| `WatchHistory` | 30 days |

All other collections have **no automatic expiry** and persist indefinitely (soft-deleted via `isDeleted: true`).
