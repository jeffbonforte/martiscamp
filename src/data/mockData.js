// Mock data for Martis Camp Families — ported from the design handoff prototype
// (ui_kits/families-app/data.js) to an ES module. This mirrors the intended
// database shape (see design_handoff/BACKEND_SPEC.md); in production it is
// replaced by Supabase queries.
//
// Image paths point at /assets/images/... (served from public/). Where a photo
// file is absent the UI falls back to serif initials / tinted covers by design.

import { buildWeekendDays } from '../lib/calendar.js';

// Offline weather fallback (per day-of-window index). Live weather overlays real
// temps on top of these; they only show when the network is unavailable.
const WEEKEND_WX = [
  { wx: { hi: 74, lo: 41, icon: 'sun', cond: 'Sunny' } },
  { wx: { hi: 71, lo: 39, icon: 'cloud-sun', cond: 'Partly cloudy' } },
  { wx: { hi: 68, lo: 38, icon: 'cloud', cond: 'Overcast' } },
  { wx: { hi: 72, lo: 40, icon: 'sun', cond: 'Sunny' } },
  { wx: { hi: 75, lo: 42, icon: 'sun', cond: 'Sunny' } },
  { wx: { hi: 77, lo: 43, icon: 'sun', cond: 'Clear' } },
  { wx: { hi: 73, lo: 41, icon: 'cloud-sun', cond: 'Partly cloudy' } },
];

export const DATA = {
  me: { name: 'Jeff Bonforte', familyId: 'bonforte' },

  // A rolling 7-day look-ahead generated from today's date (see calendar.js),
  // so day labels/numbers always track the real calendar. Weather is a graceful
  // fallback overlaid by the live feed when available.
  weekendDays: buildWeekendDays(WEEKEND_WX),

  snowReport: { newInches: 8, baseInches: 62, seasonTotal: '312"', lifts: '18 / 20 open', trails: '92% open', condition: 'Packed powder' },

  families: [
    { id: 'bonforte', name: 'Bonforte', address: '18 Creek Estates Dr', hometown: 'San Francisco, CA', cover: 'family/bonfortes.jpg',
      tone: 'var(--lake-600)', interests: ['golf', 'ski', 'tennis', 'pool'],
      presence: { here: true, label: 'Up at the Camp', days: ['thu', 'fri', 'sat', 'sun'] },
      members: [
        { name: 'Jeff Bonforte', role: 'Parent', photo: '/assets/images/family/jeff.jpg', tone: 'var(--lake-600)', phone: '(530) 555-0100', email: 'jeff@bonforte.com', days: ['thu', 'fri', 'sat', 'sun'], interests: ['golf', 'ski'] },
        { name: 'Amy Bonforte', role: 'Parent', photo: '/assets/images/family/amy.jpg', tone: 'var(--cedar-600)', phone: '(530) 555-0101', email: 'amy@bonforte.com', days: ['fri', 'sat', 'sun'], interests: ['tennis', 'hike', 'cafe'] },
        { name: 'Tazio Bonforte', role: 'Kid · 17', photo: '/assets/images/family/tazio.jpg', tone: 'var(--pine-600)', days: ['thu', 'fri', 'sat', 'sun'], interests: ['ski', 'social', 'golf'] },
        { name: 'Tessa Bonforte', role: 'Kid · 14', photo: '/assets/images/family/tessa.jpg', tone: 'var(--act-social)', days: ['fri', 'sat', 'sun'], interests: ['pool', 'tennis', 'beach'] },
        { name: 'Geo Bonforte', role: 'Kid · 11', photo: '/assets/images/family/geo.jpg', tone: 'var(--act-golf)', days: ['fri', 'sat'], interests: ['puttputt', 'pool'] },
      ] },
    { id: 'bell', name: 'Bell', address: '12 Lookout Loop', hometown: 'Palo Alto, CA', cover: 'lodge.jpg',
      tone: 'var(--pine-600)', interests: ['ski', 'golf', 'tennis'],
      presence: { here: true, label: 'Up at the Camp', days: ['fri', 'sat', 'sun'] },
      members: [
        { name: 'Sara Bell', role: 'Parent', photo: null, tone: 'var(--pine-600)', phone: '(530) 555-0111', email: 'sara@bell.family', days: ['fri', 'sat', 'sun'], interests: ['tennis', 'hike'] },
        { name: 'Tom Bell', role: 'Parent', photo: null, tone: 'var(--cedar-600)', phone: '(530) 555-0112', email: 'tom@bell.family', days: ['sat', 'sun'], interests: ['golf'] },
        { name: 'Ada Bell', role: 'Kid · 14', photo: null, tone: 'var(--lake-600)', days: ['fri', 'sat', 'sun'], interests: ['ski', 'pool'] },
        { name: 'Cole Bell', role: 'Kid · 11', photo: null, tone: 'var(--act-hike)', days: ['fri', 'sat'], interests: ['puttputt', 'pool'] },
      ] },
    { id: 'kwan', name: 'Kwan', address: '48 Mystic Ridge', hometown: 'Seattle, WA', cover: 'ski-lodge.jpg',
      tone: 'var(--cedar-600)', interests: ['golf', 'pool', 'hike'],
      presence: { here: true, label: 'Here Fri–Sat', days: ['fri', 'sat'] },
      members: [
        { name: 'Ben Kwan', role: 'Parent', photo: null, tone: 'var(--cedar-600)', phone: '(530) 555-0131', email: 'ben@kwan.family', days: ['fri', 'sat'], interests: ['golf', 'beach'] },
        { name: 'Lily Kwan', role: 'Parent', photo: null, tone: 'var(--lake-600)', phone: '(530) 555-0132', email: 'lily@kwan.family', days: ['fri', 'sat'], interests: ['pool', 'hike'] },
        { name: 'Owen Kwan', role: 'Kid · 9', photo: null, tone: 'var(--act-golf)', days: ['fri', 'sat'], interests: ['puttputt'] },
      ] },
    { id: 'ford', name: 'Ford', address: '7 Camp Cir', hometown: 'Sacramento, CA', cover: 'family-barn.jpg',
      tone: 'var(--act-dining)', interests: ['tennis', 'dining', 'social'],
      presence: { here: false, label: 'Away', days: [] },
      members: [
        { name: 'Mia Ford', role: 'Parent', photo: null, tone: 'var(--act-dining)', phone: '(530) 555-0141', email: 'mia@ford.family', days: [], interests: ['tennis', 'dining'] },
        { name: 'Jake Ford', role: 'Parent', photo: null, tone: 'var(--stone-600)', phone: '(530) 555-0142', email: 'jake@ford.family', days: [], interests: ['golf'] },
      ] },
    { id: 'alvarez', name: 'Alvarez', address: '22 Sabin Way', hometown: 'Reno, NV', cover: 'treehouse-park.jpg',
      tone: 'var(--lake-600)', interests: ['ski', 'hike', 'cafe'],
      presence: { here: true, label: 'Arriving Sat', days: ['sat', 'sun'] },
      members: [
        { name: 'Rosa Alvarez', role: 'Parent', photo: null, tone: 'var(--lake-600)', phone: '(530) 555-0151', email: 'rosa@alvarez.family', days: ['sat', 'sun'], interests: ['cafe', 'hike'] },
        { name: 'Deb Alvarez', role: 'Parent', photo: null, tone: 'var(--pine-600)', phone: '(530) 555-0152', email: 'deb@alvarez.family', days: ['sat', 'sun'], interests: ['ski'] },
        { name: 'Nico Alvarez', role: 'Kid · 12', photo: null, tone: 'var(--cedar-600)', days: ['sat', 'sun'], interests: ['ski', 'puttputt'] },
        { name: 'Elle Alvarez', role: 'Kid · 8', photo: null, tone: 'var(--act-social)', days: ['sat'], interests: ['pool'] },
      ] },
    { id: 'okafor', name: 'Okafor', address: '31 Retreat Rd', hometown: 'Los Angeles, CA', cover: 'camp-lodge-winter-aerial.jpg',
      tone: 'var(--act-pool)', interests: ['pool', 'beach', 'social'],
      presence: { here: false, label: 'Away', days: [] },
      members: [
        { name: 'Chi Okafor', role: 'Parent', photo: null, tone: 'var(--act-pool)', phone: '(530) 555-0161', email: 'chi@okafor.family', days: [], interests: ['hike', 'beach'] },
        { name: 'Ada Okafor', role: 'Kid · 10', photo: null, tone: 'var(--act-social)', days: [], interests: ['pool'] },
      ] },
    { id: 'reyes', name: 'Reyes', address: '5 Aspen Grove', hometown: 'Denver, CO', cover: 'golf-summer.jpg',
      tone: 'var(--act-golf)', interests: ['golf', 'tennis', 'dining'],
      presence: { here: true, label: 'Here all week', days: ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'] },
      members: [
        { name: 'Pat Reyes', role: 'Parent', photo: null, tone: 'var(--act-golf)', phone: '(530) 555-0171', email: 'pat@reyes.family', days: ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'], interests: ['golf', 'dining'] },
        { name: 'Sam Reyes', role: 'Parent', photo: null, tone: 'var(--cedar-600)', phone: '(530) 555-0172', email: 'sam@reyes.family', days: ['fri', 'sat', 'sun'], interests: ['tennis'] },
        { name: 'Jo Reyes', role: 'Kid · 13', photo: null, tone: 'var(--lake-600)', days: ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'], interests: ['tennis', 'pool'] },
      ] },
  ],

  gatherings: [
    { id: 'golf-sat', title: 'Saturday morning 9 holes', amenity: 'golf', host: 'Tom Bell', day: 'sat', when: 'Sat, Jul 12 · 8:30 AM',
      where: 'Golf clubhouse', capacity: 4, myRsvp: null, visibility: 'private', youInvited: true,
      description: "A private foursome before it heats up — grabbing one cart and finishing with lunch at the Bistro. Invited a few of the usual crew.",
      invited: [{ name: 'Tom Bell' }, { name: 'Ben Kwan' }, { name: 'Pat Reyes' }, { name: 'Jeff Bonforte' }],
      going: [{ name: 'Tom Bell' }, { name: 'Ben Kwan' }], maybe: [{ name: 'Pat Reyes' }], declined: [] },
    { id: 'dinner-fri', title: 'Family dinner at the Bistro', amenity: 'dining', host: 'Rosa Alvarez', day: 'fri', when: 'Fri, Jul 11 · 6:30 PM',
      where: 'Camp Lodge Bistro', capacity: 16, myRsvp: 'going', visibility: 'open', youInvited: true,
      description: "Big table on the patio to kick off the trip. Bring the whole crew — highchairs sorted for the little ones.",
      going: [{ name: 'Rosa Alvarez' }, { name: 'Sara Bell' }, { name: 'Pat Reyes' }, { name: 'Mia Ford' }, { name: 'Lily Kwan' }], maybe: [{ name: 'Sam Reyes' }], declined: [] },
    { id: 'paddle-sat', title: 'Sunset paddle at the Beach Club', amenity: 'beach', host: 'Ben Kwan', day: 'sat', when: 'Sat, Jul 12 · 5:00 PM',
      where: 'The Beach Club', capacity: 10, myRsvp: null, visibility: 'open', youInvited: true,
      description: "Paddleboards and kayaks out on the lake for golden hour. Life vests provided; strong swimmers only for the boards.",
      going: [{ name: 'Ben Kwan' }, { name: 'Lily Kwan' }], maybe: [{ name: 'Ada Bell' }, { name: 'Sara Bell' }], declined: [] },
    { id: 'hike-sun', title: 'Morning hike — Lookout loop', amenity: 'hike', host: 'Chi Okafor', day: 'sun', when: 'Sun, Jul 13 · 7:30 AM',
      where: 'Trailhead by Lookout Lodge', capacity: 12, myRsvp: null, visibility: 'open', youInvited: true,
      description: "Easy 3-mile loop with a stop at the overlook. Coffee at Martis Perk after for anyone who wants it.",
      going: [{ name: 'Rosa Alvarez' }], maybe: [{ name: 'Sara Bell' }], declined: [{ name: 'Pat Reyes' }] },
    { id: 'happyhour-fri', title: 'Open house happy hour', amenity: 'social', host: 'Sara Bell', day: 'fri', when: 'Fri, Jul 11 · 5:30 PM',
      where: 'The Bells — 12 Lookout Loop', capacity: null, myRsvp: null, visibility: 'open', youInvited: true,
      description: "Doors open, drinks out on the deck — swing by whenever. No headcount, bring the kids and whoever's up.",
      going: [{ name: 'Sara Bell' }, { name: 'Tom Bell' }, { name: 'Rosa Alvarez' }, { name: 'Mia Ford' }, { name: 'Ben Kwan' }, { name: 'Pat Reyes' }], maybe: [{ name: 'Lily Kwan' }], declined: [] },
  ],

  events: [
    { day: 11, dayKey: 'fri', title: 'Live music at the Barn', place: 'The Family Barn', amenity: 'social', community: true },
    { day: 12, dayKey: 'sat', title: 'Junior tennis clinic', place: 'Tennis Pavilion', amenity: 'tennis', community: true },
    { day: 12, dayKey: 'sat', title: 'Saturday morning 9 holes', place: 'Golf clubhouse', amenity: 'golf' },
    { day: 12, dayKey: 'sat', title: 'Sunset paddle', place: 'The Beach Club', amenity: 'beach' },
    { day: 13, dayKey: 'sun', title: 'Pancake breakfast', place: 'Martis Perk', amenity: 'cafe', community: true },
    { day: 13, dayKey: 'sun', title: 'Lookout loop hike', place: 'Lookout Lodge', amenity: 'hike' },
  ],

  feed: [
    { id: 'f0', kind: 'announcement', who: 'Martis Camp', avatar: null, tone: 'var(--cedar-600)', text: 'Beach Club closed Saturday 8–11am for dock maintenance — pool open as usual.', when: '30m ago', unread: true },
    { id: 'f1', kind: 'invite', who: 'Tom Bell', avatar: null, tone: 'var(--pine-600)', text: 'invited you to a private foursome — Saturday morning 9 holes.', when: '12m ago', unread: true, eventId: 'golf-sat' },
    { id: 'f2', kind: 'arrival', who: 'The Alvarez family', avatar: null, tone: 'var(--lake-600)', text: 'is arriving Saturday.', when: '1h ago', unread: true, familyId: 'alvarez' },
    { id: 'f3', kind: 'gathering', who: 'Sara Bell', avatar: null, tone: 'var(--pine-600)', text: 'is hosting an open house happy hour Friday at 5:30.', when: '2h ago', unread: true, eventId: 'happyhour-fri' },
    { id: 'f4', kind: 'community', who: 'Martis Camp', avatar: null, tone: 'var(--cedar-600)', text: 'Live music at the Family Barn, Friday evening.', when: '3h ago', unread: false },
    { id: 'f5', kind: 'rsvp', who: 'Ben Kwan', avatar: null, tone: 'var(--cedar-600)', text: 'is in for the Saturday paddle at the Beach Club.', when: 'Yesterday', unread: false, eventId: 'paddle-sat' },
    { id: 'f6', kind: 'comment', who: 'Rosa Alvarez', avatar: null, tone: 'var(--lake-600)', text: 'commented on the Bistro dinner: "We’ll grab the big patio table."', when: 'Yesterday', unread: false, eventId: 'dinner-fri' },
  ],
};

export default DATA;
