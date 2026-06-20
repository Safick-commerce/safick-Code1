# safick — Business Strategy & Market Analysis

## Business Model: Social Commerce Marketplace

safick is a **social commerce marketplace** — a hybrid of TikTok-style product discovery and Facebook Marketplace's "message the seller" model, designed specifically for the African market starting with Cameroon.

### How It Works

1. Sellers upload product videos/images and create listings
2. Buyers discover products through the feed (Discover, For You, Following)
3. Buyer either taps **Buy Now / Add to Cart** to check out on-platform (with escrow), or **Message Seller** for questions and negotiation
4. For on-platform checkout: buyer pays SAFICK via MTN MoMo / Orange Money / Express Union / card via Maviance S3P; funds escrowed; an order card is auto-posted into the buyer-seller chat
5. Seller marks item delivered; buyer confirms (or 7-day auto-release fires); SAFICK pays out to seller's stored MoMo / bank destination
6. After completion, both parties can leave a review tied to the confirmed deal

### Why On-Platform Escrow at Launch

- Eliminates the trust gap that kills WhatsApp commerce — buyers no longer pre-pay a stranger directly
- Pricing is locked at checkout — no transport-gouge or last-minute changes at handoff
- Maviance S3P provides the licensed rail (MTN MoMo, Orange Money, Express Union, card) so SAFICK does not have to negotiate directly with each telco
- Off-platform arrangement (via Message Seller) is still available for edge cases — buyers see an explicit risk-warning tap-through if they choose it

### Revenue Model

- **Commission on each completed on-platform transaction** (primary, from launch)
- Featured / promoted listings (Phase 2)
- Seller verification subscription tiers (Phase 2)
- Running advertisements for bigger firms (Phase 2+)

---

## Why This Model Works for Africa

### It matches how people already buy and sell

- In Cameroon (and most of West/Central Africa), buying is already conversational. People negotiate, ask questions, build relationships. The chat-based model mirrors this natural behavior.
- WhatsApp commerce is huge — safick is essentially a better version of what millions already do daily.
- Mobile money is already the dominant payment habit in Cameroon. SAFICK's checkout uses the same MTN MoMo and Orange Money rails buyers already use daily — the only thing that changes is *who* the buyer pays first (SAFICK, who then holds and releases) instead of the seller directly.

### Low friction

- Sellers don't need to set up payment accounts or learn complex dashboards
- Buyers don't need to trust a new payment system — they use what they already know (Orange Money, MTN MoMo)
- Data-light video discovery beats scrolling through WhatsApp statuses that disspear in 24 hours which makes it so stressfull for a seller to have to put everyday with limited views but with safick you can have reach allover the place without having to bother anybody to share your product everyday on his/her whatsapp status.

---

## Key Risks & How to Counter Them

### 1. The WhatsApp Migration Problem

**Risk:** People discover products on safick, then move the conversation to WhatsApp because it's familiar. Once they're on WhatsApp, safick loses them.

**Counter with:**
- Make in-app chat better than WhatsApp for buying (product cards, deal tracking, review prompts)
- Add features WhatsApp can't offer (seller ratings, verified badges, product history)
- Don't fight WhatsApp — add a "Share to WhatsApp" button so sellers can drive their WhatsApp audience *into* safick

### 2. Data Costs Matter

**Risk:** In Cameroon, data is expensive. A video-heavy app will scare users if it eats their data bundle.

**Counter with:**
- Aggressive video compression
- Low-data mode option (thumbnail previews instead of autoplay)
- Show data usage estimates ("This video: ~2MB")
- Offline-capable features (saved items, cached product info)

### 3. Trust Is Everything

**Risk:** In markets without strong consumer protection, people get scammed. If early users have bad experiences, word spreads fast.

**Counter with:**
- Prioritize the verified seller badge (even just phone verification)
- Make reviews visible and prominent — social proof is the #1 trust driver
- Fast response to reports/complaints
- Consider a "safick Guaranteed" seller tier eventually

### 4. The Chicken-and-Egg Problem

**Risk:** You need sellers to attract buyers, and buyers to attract sellers.

**Counter with:**
- Start with 20–30 active sellers in one city (Douala or Yaounde)
- Help them upload their first products (hands-on onboarding)
- Let them share their safick profiles on WhatsApp/Instagram to pull in their existing customers
- Focus on one niche first (fashion works well) before expanding

---

## Suggestions to Strengthen the Model

### Make the Chat the Star, Not Just a Feature

The chat isn't just a messaging tool — it's the entire transaction layer. Invest heavily in making it excellent:

- **Voice messages** — very popular in Africa
- **Image sharing** — buyer sends screenshot of what they want
- **Quick reply templates** for sellers ("Still available!", "Price is...", "Delivery in...")
- **Product catalog within chat** — seller can share other products mid-conversation

### Add a "Seen Nearby" or Location Feature

Delivery logistics are seller-managed, so proximity matters. Let buyers filter products by city/area. A seller in Douala can't easily deliver to Bamenda.

### Consider WhatsApp as a Channel, Not Competition

- Let sellers link their WhatsApp number
- But make safick the *better* place to browse and discover
- Tagline idea: **"Discover on safick, buy how you want"**

### Social Proof Is the Growth Engine

In African markets, recommendations from friends/community are the strongest purchase driver:

- "Your friend Sarah also follows this seller"
- "Popular in Douala this week"
- Share buttons everywhere (WhatsApp, Facebook, Instagram)

---

## Comparable Platforms in Africa

| Platform    | Country      | Model              | What safick Can Learn                          |
|-------------|-------------|--------------------|-------------------------------------------------|
| **Jiji**    | Nigeria/Ghana | Classifieds + chat | Simple works. Message-to-buy is proven.         |
| **Tonaton** | Ghana        | Classifieds + chat | Location-based filtering is essential           |
| **Afrikrea**| Pan-African  | Fashion marketplace| Niche focus (fashion) builds strong community   |
| **Jumia**   | Pan-African  | Full e-commerce    | Started with payments, but logistics was the real challenge |

---

## Key Differentiator

**The TikTok-style discovery feed.** Nobody else is doing video-first product discovery for African markets. That's safick's moat. Make the discovery experience addictive, make the chat experience smooth, and the transactions will follow naturally.

---

## Priority Focus Order

```
1. Discovery feed        — make browsing addictive
2. Chat experience       — make buyer-seller communication seamless
3. Trust features        — ratings, verified sellers, deal tracking
4. On-platform checkout  — cart + Maviance escrow (Phase 1 promotion)
5. Everything else       — live streaming, AI, etc.
```

---

## Trust Architecture (Escrow-Backed)

### Product-Linked Chats

When a buyer taps "Message Seller" from a product page, the chat automatically attaches a product card at the top of the conversation:

```
┌─────────────────────────────────┐
│ [Product Image]  Workout Set    │
│ 15,000 XAF                     │
│ Status: Inquired                │
├─────────────────────────────────┤
│ Buyer: Hi, is this available?   │
│ Seller: Yes! Delivery is...     │
└─────────────────────────────────┘
```

### Deal Status Tracking (Lightweight)

A simple status system that either party can update inside the chat:

```
Inquired → Negotiating → Agreed → Delivered → Completed
                                        ↘ Disputed
```

### Confirm & Review Flow

```
Seller marks "Delivered"
     ↓
Buyer gets prompt: "Did you receive your order?"
     ├── "Yes" → Leave a review → Status: Completed
     └── "No / Issue" → Status: Disputed → Support flag
```

### Trust Features Breakdown

| Feature                  | What It Does                                     | Trust Impact       |
|--------------------------|--------------------------------------------------|--------------------|
| **Verified Sellers**     | Sellers verify phone/ID to get a badge           | Buyers feel safer  |
| **Seller Ratings**       | Tied to confirmed deals (not just anyone)        | Accountability     |
| **Product-Linked Chats** | Every chat tied to a specific product            | Trackable activity |
| **Deal Status**          | Both parties confirm the transaction happened    | Proof of delivery  |
| **Report / Block**       | Users can flag bad actors                        | Safety net         |
| **Response Time Badge**  | "Usually responds within 1 hour"                 | Sets expectations  |
| **Seller Activity**      | "Last active 2 hours ago" / "Joined 3 months ago" | Signals reliability |

### Implementation Phases

**Phase 1 (MVP — build now):**
- Product-linked chats (attach product to conversation)
- Seller profiles with follower count and join date
- Report / block functionality
- **On-platform checkout with cart and escrow** via Maviance S3P (MTN MoMo, Orange Money, Express Union, card)
- **Order-card chat messages** auto-posted into per-seller conversations on payment
- **Commission** taken on each completed on-platform transaction
- **Structured dispute form** routed to on-call moderator

**Phase 2 (once we have users):**
- Deal status tracking in chat (Inquired → Completed) layered onto the order state machine
- Buyer reviews after confirmed delivery
- Response time badges
- Verified seller program (phone confirmed at signup; ID verification unlocks the badge)
- Featured / promoted listings
- Structured in-app dispute admin tool (replaces manual triage)

**Phase 3 (growth):**
- User wallet / balance / top-up (deferred from MVP — needs e-money licensing or partner-hosted setup)
- AI recommendations, semantic search, visual search
- Group buying, price alerts
- Multi-currency / cross-border support
