// ═══════════════════════════════════════════════════
// THE SECTOR DEBRIEF · Data Layer
// Episodes pulled from YouTube playlist:
// PLOGUm1NuLP3RWdEXeMca2w3aU6tMoEI7L
// ═══════════════════════════════════════════════════

const PLATFORMS = {
  youtube:  'https://www.youtube.com/@TheSectorDebrief',
  playlist: 'https://youtube.com/playlist?list=PLOGUm1NuLP3RWdEXeMca2w3aU6tMoEI7L',
  spotify:  'https://open.spotify.com/show/1igMsRaLcEY9DN64GBDKbW',
  apple:    'https://podcasts.apple.com/podcast/id1861790994',
  rss:      'https://www.youtube.com/feeds/videos.xml?playlist_id=PLOGUm1NuLP3RWdEXeMca2w3aU6tMoEI7L'
};

// All 7 episodes from the playlist (newest first)
const EPISODES = [
  {
    n: 7,
    id: 'vPJAWTb2dPI',
    title: 'Donations, Collaboration, and AI in the Room',
    guest: null,
    date: '2026-05-27',
    duration: '54 min',
    description: 'Ali Al Mokdad opens with a Sunday morning at his door. A family with two children, collecting donations for an NGO, and his trained brain immediately runs through overhead, restricted funds, disallowed costs. Then it stops. Kim Kucinskas, Thomas Jepson-Lay, and Ali sit with what just happened: this is not only a funding problem, it is a social contract problem. The conversation widens into AI in the workplace (productivity gains that get clawed back, atrophy, agents that do not collaborate with each other) and collaboration as a discipline rather than a slogan.',
    themes: ['Donations', 'Collaboration', 'AI']
  },
  {
    n: 6,
    id: '7w_FXEcBzs4',
    title: 'The Sector Is Changing. How Do You Make Sense Of It?',
    guest: null,
    date: '2026-05-07',
    duration: '51 min',
    description: 'Kim Kucinskas returns from a month on the road and needs to think out loud. Ali Al Mokdad, Kim, and Thomas Jepson-Lay work through what it means to make sense of a sector in transition. What is civil society for, and why are people no longer experiencing it as a public good? Not just a funding problem. A social contract problem.',
    themes: ['Civil Society', 'Transition', 'Sense-Making']
  },
  {
    n: 5,
    id: 'bv47XLE50hw',
    title: 'Who Are You in the Room, Identity vs Positionality, and Leadership in Times of Disruption',
    guest: 'Aisha Tambajang',
    date: '2026-03-29',
    duration: '52 min',
    description: 'A conversation with humanitarian leader Aisha Tambajang on identity and positionality, and how individuals present themselves in different spaces across geography and power structures. The hosts examine ancestral responsibility, values-based leadership, and the distinction between "rushing to fix" versus "curiosity to solve." Reflections on institutional tensions between headquarters and field operations, and what unscripted, honest dialogue about sector challenges actually looks like.',
    themes: ['Identity', 'Leadership', 'Power']
  },
  {
    n: 4,
    id: 'qNM0NWeZ4fA',
    title: 'The CEO Perspective, Urgent Patience, and Why Idealism Is Not Naivety',
    guest: 'Sofia Sprechmann Sineiro',
    date: '2026-03-07',
    duration: '58 min',
    description: 'Featuring Sofia Sprechmann Sineiro, former Secretary General of CARE International and locally led development advocate. Three decades of conversation on balancing authenticity with institutional survival. Topics include pragmatic optimism, values integrity during crises, and what locally led development truly means beyond terminology. Ali Al Mokdad shares personal crisis management techniques.',
    themes: ['CEO Insight', 'Localization', 'Idealism']
  },
  {
    n: 3,
    id: 'nQpnWvOoEio',
    title: 'Humanitarian Leadership Under Pressure, Identity vs Strategy, and What Comes Next',
    guest: null,
    date: '2026-02-07',
    duration: '46 min',
    description: 'Leadership within pressurized humanitarian systems. The hosts contrast grassroots innovation with large institutional survival modes. Discussion addresses values under stress, reputational risks, and organizational sustainability during transformation. A focus on systems breaking down and emerging alternatives, and the uncomfortable but necessary changes the sector keeps deferring.',
    themes: ['Pressure', 'Strategy', 'Transformation']
  },
  {
    n: 2,
    id: 'VVe2TM2z5UI',
    title: 'What Does Sector Mean, Leadership Tension, and Change',
    guest: null,
    date: '2026-01-19',
    duration: '49 min',
    description: 'Responding to listener feedback by examining what "sector" terminology actually encompasses and whether it still holds relevance. Addresses humanitarian diplomacy, escalating leadership friction, and reputational challenges. A discussion of systemic breakdown and emerging alternatives, considering transition damages and the necessity of abandoning outdated approaches.',
    themes: ['Terminology', 'Diplomacy', 'Change']
  },
  {
    n: 1,
    id: 'FqxeBin5bbQ',
    title: 'What This Space Is About, Leadership and Reflections',
    guest: null,
    date: '2025-12-13',
    duration: '38 min',
    description: 'The inaugural episode introduces the program\'s purpose. Hosts Kim Kucinskas, Thomas Jepson-Lay, and Ali Al Mokdad introduce their leadership perspectives and the personal reflection methodologies they use to think systematically about sector challenges. The opening note: this won\'t be a polished podcast. It will be honest.',
    themes: ['Origins', 'Reflection', 'Leadership']
  }
];

// Quotes · pulled directly from the show's "Sector Debrief Shorts" playlist.
// Each one is a real moment from a real episode, attributed to the person
// who said it on camera.
const QUOTES = [
  { text: "When this crisis is over, there will just be a new one. The leaders who will navigate that are the ones committed to being authentically themselves.", source: "Kim Kucinskas",                color: "q-cobalt" },
  { text: "I spent my time explaining HQ to the field, and the field to HQ.",                                                              source: "Ali Al Mokdad",               color: "q-crimson" },
  { text: "The positionality of too many humanitarian leaders right now is based on an identity built for a world that ended in 2025.",    source: "Thomas Jepson-Lay",           color: "q-mustard" },
  { text: "Humanity does not live inside an institution. It never did. You don't need a job title to be a humanitarian. You just need to show up.", source: "Thomas Jepson-Lay",  color: "q-forest" },
  { text: "We all know what is wrong. The harder question is: what are you going to do about it?",                                          source: "Kim Kucinskas",               color: "q-rust" },
  { text: "This too shall pass. The real message is what you do in the middle of it. Standing by your values. Holding your principles.",   source: "Ali Al Mokdad",               color: "q-cream" },
  { text: "When the funding disappeared, locals kept working anyway. The work was never about the institution. It was always about the values.", source: "Aisha Tambajang",         color: "q-cobalt" },
  { text: "Some people have never left the cave. Some have gone out, seen the light, and come back to share what they found. Some spend their lives doing both.", source: "Aisha Tambajang",  color: "q-crimson" },
  { text: "It is easy to live your values when everything is going well. The real test is when you have to choose.",                       source: "Kim Kucinskas",               color: "q-mustard" },
  { text: "We need allies. We need solidarity. We need all hands on deck. Not survival mode. Not urgency dressed up as strategy.",         source: "Sofia Sprechmann Sineiro",    color: "q-rust" },
  { text: "The future will not be one thing. It will be multiple. Small. Organic. And the old structures will have to earn their place in it.", source: "Thomas Jepson-Lay",     color: "q-forest" },
  { text: "Living your values under pressure, openly and visibly, is one of the most powerful ways to build trust in this moment.",        source: "Kim Kucinskas",               color: "q-cobalt" },
  { text: "Past you who already survived hard things. Present you dealing with what is in front of you. Future you, looking back asking: what would you do?", source: "Ali Al Mokdad",  color: "q-crimson" },
  { text: "Humanitarian comes from humanity. It belongs to everyone. Not just NGOs or the UN. The public should claim it back.",            source: "Thomas Jepson-Lay",           color: "q-mustard" },
  { text: "The pressure isn't only coming from the public. The way many organisations approach transformation is creating toxic cultures from within.", source: "Ali Al Mokdad",     color: "q-rust" },
  { text: "Real systems change starts with people. We cannot begin changing systems without first recognising the humans inside them.",     source: "Kim Kucinskas",               color: "q-forest" },
  { text: "If I had to choose one word for the most powerful tool I saw leaders using this year, it would be reflection.",                  source: "Ali Al Mokdad",               color: "q-cream" },
  { text: "Across every sector, people are asking for the same thing. Realness. Vulnerability. Real humans behind the calls and the panels.", source: "Kim Kucinskas",             color: "q-cobalt" },
  { text: "Humanitarianism is a principle and a value. Not something defined by working for an organisation. Humanity belongs to people.",   source: "Ali Al Mokdad",               color: "q-crimson" },
  { text: "If we do not take time to reflect, we risk snapping back to old ways. Stay with the discomfort. That is how we build something new.", source: "Kim Kucinskas",            color: "q-mustard" },
  { text: "Networks of networks. Connected communities and shared platforms can create momentum that no single organisation can achieve alone.", source: "Kim Kucinskas",           color: "q-forest" },
  { text: "Many people are going through identity-based trauma. Uncomfortable, but necessary. The inner work is where ecosystem thinking begins.", source: "Thomas Jepson-Lay",     color: "q-rust" },
  { text: "If you want to create the future, you have to live in it long enough before it happens. Pause. Imagine. Sit with it until it feels real.", source: "Ali Al Mokdad",      color: "q-cobalt" },
  { text: "System is people. If people can change, systems can change. Our problems are human-made, which means they can be human-solved.",  source: "Ali Al Mokdad",               color: "q-crimson" },
  { text: "Leadership is not just about bringing in new people. It is about investing in the leaders we already have.",                     source: "Thomas Jepson-Lay",           color: "q-mustard" },
  { text: "The system, the process, and the personal side are not separate. They shape each other.",                                        source: "Kim Kucinskas",               color: "q-cobalt" },
  { text: "We need more humanity in leadership. Better decisions start with reflection, not urgency.",                                      source: "Thomas Jepson-Lay",           color: "q-rust" },
  { text: "Creativity is not limited to artists. It shows up in how you solve problems, how you lead, how you approach your work.",         source: "Thomas Jepson-Lay",           color: "q-forest" },
  { text: "Challenges plus reflection equals success. Not difficulty alone. Not reflection alone. The combination.",                        source: "Ali Al Mokdad",               color: "q-cream" },
  { text: "In 1994 I knocked on the doors of NGOs in Cambodia. The notebook I started that year documented what I saw long before the sector had language for it.", source: "Sofia Sprechmann Sineiro", color: "q-cobalt" },
  { text: "The answer isn't more busyness. The answer is to slow down. Stop. Pause. Reflect.",                                              source: "Thomas Jepson-Lay",           color: "q-mustard" },
  { text: "The pause. The discernment. The moment of honest reflection before jumping back into what has always been done. That is exactly what leadership requires right now.", source: "Thomas Jepson-Lay", color: "q-crimson" },
  { text: "This is not only a funding problem. It is also a social contract problem.",                                                                                            source: "Kim Kucinskas",               color: "q-forest" },
  { text: "One side is using AI to request things, and the other side is using AI to respond to those requests. We were building an alternative reality.",                       source: "Ali Al Mokdad",               color: "q-cream" }
];

// AI-generated long-form blog posts · one per episode + one pinned editorial
const BLOG_POSTS = [
  {
    epId: 'vPJAWTb2dPI',
    epN: 7,
    slug: 'sunday-knock',
    title: 'Not Just a Funding Problem: A Sunday Knock and What Came After',
    excerpt: 'Ali opened the door on a Sunday morning. A family with two children, holding an NGO flyer. His trained brain went straight to overhead and disallowed costs. Then it stopped.',
    readTime: '6 min',
    reflections: [
      "What was the last moment in your work when the systems view obscured the human view standing in front of you? What do you remember about the pause?",
      "Pick one cause your organisation claims as its work. Are you in social contract with the people you serve, or in a transaction with the funders who pay you? Which one would they say?",
      "Where in your week is AI helping you do more, and where is the time it saved getting quietly clawed back into more workload, not more humanity?",
      "Name a skill you used to have that you now reach for AI to perform. If you were forced to do it without AI tomorrow, how much of it would still work?",
      "Identify someone in your organisation who quietly holds collaboration together. If they left next month, what would actually fall apart? What does that tell you about how the work is really structured?"
    ],
    body: `<p>It was a Sunday. Ali was at home with coffee. There was a knock at the door.</p>

<p>A family was standing there, a mother and two children, holding a small flyer. The pitch started right away. The campaign was familiar; Ali recognised the NGO and the format immediately. He had been on the other side of campaigns just like it not long ago.</p>

<p>He reached for his phone to send the money. While the transfer was processing, his brain was already doing the thing trained operators' brains do. Where will this actually land. How much will get absorbed at headquarters before it leaves the building. Is this going to cover a loss account. Is this going to a summit. He had spent years inside the machinery that turns donations into restricted and unrestricted lines, and the machinery does not stop running just because there is a family at your door.</p>

<p>Then he stopped.</p>

<h2>What He Actually Saw</h2>

<p>The family on the step had no idea about loss accounts. They did not need to. They had chosen to spend their Sunday going door to door, building to building, repeating the same short pitch about why people here should give money to people elsewhere. The children were tired. They had clearly knocked on a lot of doors already.</p>

<p>The campaign collected over a million dollars that weekend. Ali learned that later in a thank-you message on his phone. By then he had spent two days thinking less about where the million dollars would actually go and more about what those families had been doing that day. Practicing values. Showing their children what solidarity looks like outside the slide deck. Stepping into the institution from the public side.</p>

<blockquote>For a few hours on a Sunday, the sector's most powerful resource was not its grants office. It was a family standing on a step.</blockquote>

<h2>Not Just a Funding Problem</h2>

<p>Kim has been carrying around a framing that became the spine of this episode. <em>The problem in the sector is not only a funding problem. It is also a social contract problem.</em></p>

<p>The distinction matters. A funding problem has a funding solution. Find new donors. Diversify revenue. Cut costs. Pivot. The sector is very good at framing everything as a funding problem because funding problems are, in theory, solvable.</p>

<p>Social contract problems are harder. They ask whether the people the work is supposed to serve still believe the arrangement is working. Whether the implicit bargain between civil society and the public still holds. Whether anyone is in the contract on the other side at all.</p>

<p>When a family knocks on your door on a Sunday, they are not waiting for the strategic review. They are renewing the contract in person. The funding crisis you read about in the board paper is the signal that the contract was already in trouble. The Sunday knock is one of the few places it is still being practiced.</p>

<h2>The Alternative Reality</h2>

<p>The conversation shifted to AI, and Ali brought a different story. He had been supporting a local NGO through a proposal cycle. The international NGO that was the prime applicant requested twenty-two annexes from the local partner two days before deadline. Policies. Processes. Frameworks. Most of them were not applicable in the country office's context. The executive director did not have the capacity to write twenty-two annexes that would, in any case, never be implemented. So Ali generated them with AI.</p>

<p>One side using AI to request things that will never be implemented. The other side using AI to produce things that will never be implemented. Documents flowing in both directions, none of them attached to the real work.</p>

<blockquote>It felt like something was broken. We were building an alternative reality.</blockquote>

<p>This is the part of the AI conversation the sector keeps not having. Not whether AI will steal jobs. Not whether it will lift productivity. Whether it is being used to absorb the cost of bureaucracy that nobody believes in, on both sides of a relationship that used to be about something else.</p>

<h2>The Productivity Trap</h2>

<p>About three years ago, Ali ran a small experiment inside an international NGO. He was using AI tools and automation in his grants role and his workload had measurably dropped. He went to his line manager with a documented case. He had about thirty percent of his time back. He proposed reinvesting half of it in HR work on diversity and inclusion, and the other half on raising organisational awareness about AI.</p>

<p>HR said yes. IT said yes. The line manager said yes. Everyone was excited.</p>

<p>Then NGO culture did what NGO culture does. Within months, the freed time had been filled with three additional roles. Compliance work here. Document review there. The thirty percent that was supposed to go into thoughtful new work was repurposed into "we need someone to cover this." The productivity gain showed up on the org chart as more responsibilities for the same person, not as space.</p>

<p>If AI helps the sector do more with less, the honest question is what happens to the savings. So far, the answer in too many places is the same: the savings get clawed back into workload, and the original case for AI quietly dissolves.</p>

<h2>Collaboration as a Discipline</h2>

<p>Then Kim turned the conversation toward something she has been working on. Collaboration as a word is becoming what trust and equity already became, a term that means everything and nothing. Nobody is against it. Nobody agrees what it actually requires. Most strategies invoke it and most workshops list it as a value.</p>

<p>The reframe Kim brought from an article she had read recently: <em>collaboration is a discipline, not just a value.</em></p>

<p>That is a different proposition. A value is something you affirm. A discipline is something you train. Collaboration as a value sits in the principles document and waits to be cited. Collaboration as a discipline shows up in how meetings are designed, who gets to decide, when to push someone and when to give them space, how to hold competing motivations in the same room without papering over them.</p>

<p>The sector is full of platforms named after collaboration. Clusters. Working groups. NGO forums. Coordination meetings. Whether any of them are actually building collaboration is a question for the people who have sat in those rooms. The honest answer is usually: sometimes, mostly no, and almost never in the way the strategy document claims.</p>

<h2>What This Episode Was Actually About</h2>

<p>Donations, AI, collaboration. The three threads ended up in the same conversation because they are all asking the same underlying question. <em>What is the relational infrastructure of this sector, and who is still maintaining it?</em></p>

<p>A family on a step on a Sunday is maintaining it from the outside. A local NGO handed twenty-two annexes two days before deadline is being asked to maintain it on terms that do not match its reality. A hybrid leader trying to lead an organisation she can no longer see in person is trying to maintain it with half the instrumentation gone.</p>

<p>Civil society for most of the last two decades has assumed the relational infrastructure was a background condition. It was something everyone shared. It did not need explaining. The work of the sector could focus on programmes, results, reporting, scale.</p>

<p>That background condition no longer holds. The publics have noticed. The local partners have noticed. The frontline staff have noticed. The infrastructure is the work now. Anything else done on top of it is borrowed time.</p>

<p>The Sunday knock was not nostalgia. It was a reminder. There are still people doing the work that everyone else takes for granted. The question is whether the rest of the sector is going to learn from them, or keep building alternative realities that pretend they are not there.</p>`
  },
  {
    epId: '7w_FXEcBzs4',
    epN: 6,
    slug: 'sector-is-changing',
    title: 'The Sector Is Changing. How Do You Make Sense Of It?',
    excerpt: 'Kim Kucinskas came back from a month on the road, Buenos Aires then Oxford, and needed to think out loud. This episode is that conversation. About civil society, public goods, and what it actually means to make sense of a sector in transition.',
    readTime: '6 min',
    reflections: [
      "What does 'civil society' mean to the people you serve? Not to your org's theory of change. To the actual humans. When did you last check?",
      "Pick one thing your sector does that the public experiences as a burden rather than a benefit. What would it take to change that?",
      "Kim says this isn't just a funding problem. It's a social contract problem. Which contracts in your work have quietly expired without anyone saying so?",
      "If your organisation disappeared tomorrow, what gap would the public actually notice? What wouldn't they notice?",
      "What's the difference between making sense of something and making peace with it? Are you doing the first, or just the second?"
    ],
    body: `<p>There's a particular kind of conversation that only happens when someone has just come back from somewhere. The ideas are still loud. The context hasn't settled yet. The person hasn't had time to translate the experience into the version they'll give at the next panel.</p>

<p>Kim Kucinskas had just come back from two back-to-back trips. A gathering of bridge builders and network weavers in Buenos Aires, and the Skoll World Forum in Oxford. She came into this conversation needing to think out loud. What happened became one of the most honest episodes we've recorded.</p>

<h2>It's Not a Funding Problem</h2>

<p>The framing Kim introduces early in the conversation is one the hosts return to throughout: <em>this is not just a funding problem. It's a social contract problem.</em></p>

<p>That distinction matters. A funding problem has a funding solution. You find different donors, build new revenue streams, cut costs, restructure. The sector is very good at treating everything as a funding problem, because funding problems are, in theory, solvable.</p>

<p>Social contract problems are harder. They ask whether the people you're supposed to serve still believe the arrangement is working for them. Whether the implicit bargain (we provide services, you grant us legitimacy) still holds. Whether the public experiences civil society as a public good, or as a specialist industry operating on their behalf without their meaningful involvement.</p>

<blockquote>When people stop experiencing civil society as theirs, the social contract starts to break. The funding crisis is often just the signal that the contract was already in trouble.</blockquote>

<h2>What Civil Society Is Actually For</h2>

<p>The Buenos Aires gathering gave Kim something specific to think with: a room full of people who were building bridges between sectors, between communities, between formal and informal power. People who didn't fit cleanly into the old categories of donor, implementer, beneficiary.</p>

<p>The question that kept surfacing: <em>what is civil society actually for?</em> Not in the theory of change sense. In the lived-experience-of-the-public sense.</p>

<p>In too many places, the answer has quietly become: civil society is for civil society. It advocates, convenes, documents, reports, and coordinates, increasingly with itself. The people nominally at the centre of the work feel this. They've been feeling it for a while. The funding contraction is forcing the conversation that should have happened years ago.</p>

<h2>Skoll and the Question of Scale</h2>

<p>Oxford had a different energy. The Skoll World Forum still carries the weight of the sector's optimism about social enterprise and systems change. Kim came away with a complicated feeling.</p>

<p>The ideas were good. The people were thoughtful. The problem is the gap between the quality of the thinking in the room and the pace of change outside it. The sector has never been better at analysing itself. It has rarely been slower at acting on the analysis.</p>

<p>Thomas names the thing nobody wants to say: <em>the sector has gotten very comfortable with being in transition.</em> Transition is a safe state. It implies change is coming. It excuses the present. The harder question is what happens when transition becomes the permanent condition. When the work of preparing for change substitutes for change itself.</p>

<h2>Making Sense vs. Making Peace</h2>

<p>One of the most useful distinctions in this episode is the difference between <em>making sense</em> of what's happening and <em>making peace</em> with it.</p>

<p>Making sense is active. It requires taking in information that challenges your framework and updating your mental model. It's uncomfortable. It usually means admitting that something you believed no longer holds.</p>

<p>Making peace is passive. It's what happens when you're too tired to make sense. When you absorb the reality and decide not to fight it. When the strategy document quietly shifts from "here's how we change things" to "here's how we survive things."</p>

<p>The sector is doing a lot of making peace right now and calling it strategic adaptation. Kim, Thomas, and Ali don't pretend there's a clean answer. But they name the distinction. That's a start.</p>

<h2>What the Conversation Was Actually About</h2>

<p>By the end of the episode, it's clear this conversation was really about one question: <em>who is civil society accountable to?</em></p>

<p>Not theoretically. Not in the annual report. In practice, in the decisions, in the rooms where the choices get made.</p>

<p>If the answer is primarily donors, funders, peer organisations, and internal governance structures, the social contract is already broken, and the funding crisis is just the invoice arriving. If the answer is genuinely the people the work is for, then there's still something worth building from.</p>

<p>Most organisations are somewhere in the middle, drifting toward the first and hoping nobody notices.</p>

<p>This episode is for the people who noticed.</p>`
  },

  {
    epId: null,
    epN: 0,
    pinned: true,
    slug: 'notes-from-the-editing-room',
    title: 'Notes from the Editing Room: How This Podcast Actually Works',
    excerpt: 'How we choose guests. Why we publish irregularly. What we are listening for in 2026. The editorial logic behind the conversations.',
    readTime: '6 min',
    reflections: [
      "Pick one room you sit in this month. Are the people there the ones who can actually answer the question, or just the ones who happened to be available?",
      "What's a conversation you're having privately with colleagues that you'd never have in public? What would it cost to put it on the record?",
      "If your work was only allowed to publish when there was something worth saying, not when the calendar said so, what would you stop doing?",
      "Name something you've said publicly this year that you didn't fully believe. What pulled you to say it?",
      "What part of your work would stop working the moment it became a brand?"
    ],
    body: `<p>The Sector Debrief is not a content strategy. It is three friends with microphones and a strong shared instinct that the most useful thinking in our world rarely makes it into the official record.</p>

<p>This essay is about how we actually do this. Not the brand version. The real one.</p>

<h2>How We Choose Guests</h2>

<p>We do not have a guest pipeline. We do not have a sponsor pitching us names. We do not have a producer with a roster. We have a short list of people we deeply respect, a longer list of people we want to learn from, and a third list of people we keep being told we should talk to but probably will not.</p>

<p>The criteria we actually use: Has this person said something we could not get from a panel? Are they willing to be wrong on the record? Will the conversation be different than the version they have already given on every other podcast in the sector?</p>

<blockquote>When the answer to all three is yes, we record. When the answer is no, we do not. The episodes you do not hear are part of the editorial decision too.</blockquote>

<h2>Why We Publish Irregularly</h2>

<p>The sector publishes on calendar logic. Quarterly reports. Annual reviews. Pegged to summits and donor cycles. We publish when there is something worth saying. Sometimes that is twice in a month. Sometimes it is not for six weeks.</p>

<p>This is intentional. The fastest way to get bad on a podcast is to feel obligated to publish.</p>

<h2>What We Are Listening For</h2>

<p>The questions we keep coming back to in 2026:</p>

<p>What does the next decade of humanitarian response actually look like, when the institutional architecture of the last twenty years is contracting faster than the alternative is forming?</p>

<p>What does locally led work look like once the slides are turned off and someone has to choose?</p>

<p>How do leaders in this work hold their values when the cost of holding them is no longer abstract?</p>

<p>What is the sector's relationship with risk now that reputation has quietly become its dominant currency?</p>

<p>If you have ideas on any of these, write to us.</p>

<h2>What Is Coming</h2>

<p>A few episodes are already in the calendar. We are not announcing them. The kinds of guests we are trying to land take longer to land. We would rather record a real conversation in three months than a polished one next week.</p>

<p>We will publish when it is ready. The conversations do not expire.</p>

<h2>What We Are Trying Not to Become</h2>

<p>A brand. A panel circuit. A think tank. A platform for our own consultancies.</p>

<p>The day this stops being three friends having the conversation we would be having anyway is the day the show stops working. We know that. We have seen what happens to other projects in this sector that mistook attention for purpose.</p>

<p>If you are listening: thank you. The show works because the people who listen are the people we would want to be talking to. That is not a marketing line. It is literally why this exists.</p>

<p>The microphones are on. Pull up a chair.</p>`
  },
  {
    epId: 'bv47XLE50hw',
    epN: 5,
    slug: 'who-are-you-in-the-room',
    title: 'Who Are You in the Room? Identity, Positionality, and the Quiet Politics of Showing Up',
    excerpt: 'When Aisha Tambajang sat down with us, she didn\'t reach for talking points. She reached for a question. One most of the sector keeps avoiding.',
    readTime: '7 min',
    reflections: [
      "Think about a room you'll be in this week. Who decided you'd be there, and what would change if you brought your full identity into it instead?",
      "Identify someone in your work whose positionality is doing more talking than their identity. What would it take for that to flip?",
      "Where in your work are you rushing to fix versus curious enough to solve? Be honest about which mode is louder.",
      "Whose names live in your inheritance? What do they expect of the work you're choosing to do this week?",
      "Who in your immediate team has a stronger identity than their positionality currently permits? What part of that is your job to fix?"
    ],
    body: `<p>There's a particular silence that happens when someone in the humanitarian sector is asked who they are in the room. Not what they do. Not which agency they represent. Who they <em>are</em>.</p>

<p>It's an uncomfortable question because the sector trained most of us to lead with title. Country Director. Programme Coordinator. Senior Advisor for the Something-or-Other Cluster. The vocabulary is professional armour. The minute you take it off, things get political and personal, fast.</p>

<p>Aisha Tambajang came to this conversation prepared to take it off.</p>

<h2>Identity vs. Positionality</h2>

<p>The distinction that anchors this episode is one the sector talks around but rarely talks <em>about</em>. Identity is what you bring into the room. Your background, your history, the people whose names live in your inheritance. Positionality is what the room does with you. Where it places you. What it permits you to say. What it expects you to be.</p>

<blockquote>You can have a strong identity and a weak positionality. You can have a weak identity and a strong positionality. Most of the harm in this sector comes from people pretending those two are the same thing.</blockquote>

<p>Aisha is clear: this isn't an academic distinction. It shows up in coordination meetings, in donor calls, in the quiet moment when a national staff member is asked to validate a decision that was already made in another time zone. The room knows where everyone sits. Pretending it doesn't is its own kind of violence.</p>

<h2>Ancestral Responsibility</h2>

<p>One of the most striking ideas in this episode is what Aisha calls ancestral responsibility. The sense that her work isn't only accountable to the present moment but to the people who made her possible, and to the people her decisions will make possible (or impossible) tomorrow.</p>

<p>It's a framing that cuts against the sector's usual time horizon. Logframes work in twelve-month cycles. Strategic plans cap out at five years. Donors want results before the next grant window. Ancestral responsibility says: <em>none of those timelines are mine</em>.</p>

<p>That's not a rejection of accountability. It's a deeper one.</p>

<h2>Rushing to Fix vs. Curiosity to Solve</h2>

<p>The sector loves a fix. A pilot. A pivot. A new framework. The annual report is full of them. But Aisha draws a line between rushing to fix something and being curious enough to actually solve it. She argues most of what we call innovation is the former.</p>

<p>Rushing to fix is reactive. It's anxious. It treats the problem as the obstacle to the work. Curiosity to solve is patient. It treats the problem as the work. The difference, she suggests, is whether you trust the people closest to the problem to be part of the answer, or whether you've already decided they're not.</p>

<h2>Leadership in Times of Disruption</h2>

<p>And then the conversation turns, as conversations on this podcast tend to, to leadership. Specifically, leadership when the ground is moving.</p>

<p>The sector is in a disruption phase that nobody wanted and nobody planned for. Funding contraction. Donor consolidation. Geopolitical realignment. The infrastructure of the last twenty years is shedding faster than the infrastructure of the next twenty is forming. People in leadership positions are trying to hold organisations together while the organisations themselves are quietly asking whether they should.</p>

<p>Aisha doesn't offer a recipe. She offers a question: <em>what does it mean to lead with values when the values cost something?</em></p>

<p>If your values only show up when it's safe, when the funding is there, when the politics align, when the cost is borne by someone else, they're not values. They're preferences.</p>

<h2>The Uncomfortable Bottom Line</h2>

<p>This episode doesn't end with action items. It ends with a recognition. The room you walk into matters. The room you build matters more. And the people you bring into both, and the people you leave outside, say more about your leadership than any framework ever will.</p>

<p>Who are you in the room?</p>

<p>It might be the only question worth asking before any of the others.</p>`
  },
  {
    epId: 'qNM0NWeZ4fA',
    epN: 4,
    slug: 'urgent-patience',
    title: 'Urgent Patience: Why Idealism Is Not Naivety, and Other Lessons from a CEO Who Lasted',
    excerpt: 'Sofia Sprechmann Sineiro spent thirty years inside one of the largest humanitarian organisations in the world. She left with her values intact. That alone is worth a podcast episode.',
    readTime: '8 min',
    reflections: [
      "What does it cost you to keep your values in your work right now? If the answer is nothing, you probably haven't tested them yet.",
      "Name a decision you made fast this quarter that needed slowness, and one you slow-walked that people are paying for. Which one would you defend in public?",
      "Pick a decision your team made last quarter. Was it idealism, pragmatism, or cynicism dressed up as maturity?",
      "If your work is locally led, who actually decides? Not who consults. Not who is consulted. Who decides.",
      "What's a value of yours that someone else in your organisation pays the cost for, while you don't?"
    ],
    body: `<p>It's rare to interview someone who has spent three decades in this sector and still talks about it with conviction. The math usually doesn't work. The cynicism accumulates. The compromises stack. The original reason you came in becomes a story you tell new hires at the welcome drinks.</p>

<p>Sofia Sprechmann Sineiro is the rare exception, and this episode is essentially a long-form attempt to figure out why.</p>

<h2>The CEO Job Nobody Talks About</h2>

<p>Most conversations about sector leadership focus on the symbolic side of the role. The keynotes, the panels, the strategic positioning. Sofia is more interested in the part nobody films. The board management. The donor renegotiations. The internal communications when 400 people are about to lose their jobs and you have to be the face of why.</p>

<blockquote>You don't run a humanitarian organisation. You run the contradiction between what it's supposed to be and what it actually has to be to survive next year.</blockquote>

<p>That contradiction is where almost every CEO in this sector lives. The mission is universal. The funding is conditional. The promise is solidarity. The structure is hierarchical. You can either pretend those tensions don't exist, or you can lead through them. There is no third option, even though the sector keeps trying to invent one.</p>

<h2>Pragmatic Optimism</h2>

<p>Sofia uses the phrase "pragmatic optimism" early in the conversation, and it deserves to be unpacked. It's not optimism as denial. It's not optimism as marketing. It's optimism as a discipline. The choice, made daily, to assume there is still a path forward, even when the evidence is mixed.</p>

<p>The pragmatic part matters. Optimism without pragmatism is naivety. Pragmatism without optimism is bureaucracy. The sector tends to oscillate between the two and call the oscillation maturity. Sofia argues the actual maturity is holding both at once.</p>

<h2>Idealism as Strategy</h2>

<p>One of the most quotable lines from this episode is also one of the most contested: <em>idealism is not naivety</em>. The sector treats them as synonyms, especially when budgets are tight. The idealists get nudged toward communications. The pragmatists get the operational roles. The cynics get the leadership roles.</p>

<p>Sofia pushes back. Idealism, she argues, is the only sustainable energy source in a sector that pays poorly, asks too much, and rarely delivers a clean win. Take the idealism out and you're left with a transactional NGO industry, which, she notes, is what some donors quietly want.</p>

<h2>Locally Led, Or Locally Said?</h2>

<p>The conversation turns inevitably to localization. It always does. Sofia spent a significant part of her career trying to make CARE genuinely locally led, and she's honest about how hard it was, how slow it remains, and how much of the public discourse is performative.</p>

<p>Locally led development isn't a programme model. It's a power transfer. And power, she reminds us, is rarely transferred voluntarily, even by the people who write the strategy documents calling for it.</p>

<p>The honest test is simple: who decides? Not who consults. Not who is consulted. Who decides. If the answer hasn't moved in a decade, the strategy hasn't moved either, no matter how many frameworks you've drafted.</p>

<h2>Urgent Patience</h2>

<p>The phrase that titles this episode came organically. Ali was asking how she stayed in the role for so long without burning out. Sofia paused, then said: <em>urgent patience</em>.</p>

<p>The urgency is non-negotiable. People are dying. Systems are failing. The cost of slow is high. But patience is also non-negotiable, because the changes worth making are the ones that take longer than a single tenure, a single grant cycle, a single news cycle. If you are only urgent, you burn out. If you are only patient, you become part of the problem.</p>

<p>The sector keeps choosing one and forgetting the other.</p>

<h2>The Question She Left Us With</h2>

<p>Near the end of the conversation, Sofia turned the question back: <em>what does it cost you to keep your values?</em></p>

<p>Not "do you have values." Everyone says yes. The harder question. The cost. Because if there is no cost, you haven't tested them. And if you can't name the cost, they probably aren't there.</p>

<p>Three decades in, she could name it. Most people can't.</p>

<p>That, more than the title or the tenure, is what makes her worth listening to.</p>`
  },
  {
    epId: 'nQpnWvOoEio',
    epN: 3,
    slug: 'leadership-under-pressure',
    title: 'Leadership Under Pressure: When the System Stops Working and No One Wants to Say It',
    excerpt: 'There\'s a moment in every sector reform conversation when someone says "we need to be honest." Then everyone leans in. Then no one is.',
    readTime: '6 min',
    reflections: [
      "Is your organisation in survival mode or build mode? Be honest about which one is driving the decisions you're making this week.",
      "When was the last time your organisation took a position that carried real reputational cost? What did it actually cost?",
      "Where is the gap widest in your work between stated identity and working strategy? Who in your team is paying the cost of that gap?",
      "When did your organisation last refuse a funder requirement on principle? If you can't remember, what does that tell you about who's actually steering?",
      "If you knew the system you're maintaining wouldn't exist in five years, what would you do differently next Monday?"
    ],
    body: `<p>The humanitarian sector has been talking about leadership under pressure for so long that the phrase has lost most of its useful meaning. Every workshop has a panel on it. Every strategy document mentions it. Every leadership programme promises to teach it.</p>

<p>And yet, when the pressure actually arrives, like it has, like it is, the response from the sector's institutional leadership has been remarkably similar to the responses of every previous decade. More frameworks. More convenings. More language about transformation that quietly assumes the institutions doing the transforming will still exist on the other side.</p>

<p>This episode tries to sit with the discomfort of that.</p>

<h2>Two Different Sectors</h2>

<p>One of the framings the hosts return to throughout the conversation is that there are now effectively two sectors operating in parallel.</p>

<p>The first is the institutional sector. The large UN agencies, the international NGOs, the legacy networks. This sector is in survival mode. Its leaders are spending most of their cognitive energy on cash flow, restructuring, and political positioning. The work is real. The constraints are also real. And the leadership culture inside these organisations is shaped less by mission and more by the slow defensive logic of trying to preserve as much as possible while losing as little as possible.</p>

<p>The second is what Ali calls the grassroots sector. Smaller, mostly national, often newer, frequently informal. This sector is in a different mode entirely. The leaders aren't asking how to preserve. They're asking how to build. The constraints are different. The cost structure is different. The relationship with risk is different.</p>

<blockquote>The institutional sector keeps writing the future of the humanitarian system. The grassroots sector keeps building it. These are no longer the same conversation.</blockquote>

<h2>Reputational Risk Is Doing Most of the Talking</h2>

<p>One thing this episode names that few others do: in many large organisations, reputational risk has quietly become the dominant decision-making logic.</p>

<p>What looks like strategy is often risk management. What looks like principles are often legal. What looks like cautious leadership is often communications worried about the next news cycle. None of this is unreasonable on its own. Together, it produces a kind of paralysis that nobody chose but everyone enacts.</p>

<p>The most interesting question in this episode is whether the sector still has space for leaders who are willing to take principled positions that carry reputational cost. The honest answer the hosts arrive at is: yes, but mostly in organisations small enough that the cost stays containable.</p>

<h2>Identity vs. Strategy</h2>

<p>Another thread runs through the conversation: the distinction between identity and strategy.</p>

<p>Most large organisations have a stated identity (mission, values, principles) and a working strategy (how they actually operate). When those two are aligned, the organisation makes sense. When they drift apart, the organisation becomes politically interesting, because internal staff start to notice the gap, and external partners start to design around it.</p>

<p>The sector is in a moment where many of these gaps are widening. The principles documents say one thing. The decisions on the ground show another. Leaders are spending increasing amounts of time managing the gap rather than closing it.</p>

<h2>What Comes Next</h2>

<p>The episode resists the temptation to end with a clean prescription. The honest answer to "what comes next" is: nobody knows, and the people who pretend they know are usually selling something.</p>

<p>What the hosts do offer is a frame. The systems that are breaking down were not designed to be permanent. The systems that emerge will not look like better versions of the old ones. They will look different. Some will be smaller. Some will be more local. Some will be more federated. Some will not call themselves humanitarian at all.</p>

<p>The leaders who are most useful in this transition are not the ones with the loudest answers. They're the ones with the most useful questions, and the willingness to ask them out loud.</p>

<p>This episode is mostly questions. We think that's the right register for the moment.</p>`
  },
  {
    epId: 'VVe2TM2z5UI',
    epN: 2,
    slug: 'what-does-sector-mean',
    title: 'What Does "Sector" Even Mean Anymore?',
    excerpt: 'A listener wrote in. They wanted to know if we actually believed in the word in our own podcast title. It was the right question.',
    readTime: '5 min',
    reflections: [
      "Are you in the sector, or are you in an industry trying to hold its identity together? What's your honest answer?",
      "If the word sector fragments tomorrow, which conversation would you most want to keep being part of?",
      "Who's invited into your strategy meetings but excluded from your decisions? What would it take to flip that?",
      "Pick someone your organisation calls a partner. Where do they sit in your decisions: deciding, consulting, or just being consulted? Where would they say they sit?",
      "What part of your professional identity is built on a word that may not survive the decade? What would you build it on instead?"
    ],
    body: `<p>It's the kind of email that sits in your inbox a little longer than the rest. A listener, a national staff member at an INGO, asked with a generosity that felt sharper than most criticism: <em>what do you mean when you say "sector"? Because I'm not sure I'm in it.</em></p>

<p>This episode is essentially the long answer to that email.</p>

<h2>The Word Was Never Neutral</h2>

<p>The first thing worth saying: "sector" was never a neutral word. It came out of a specific moment, from a specific kind of institutional self-understanding. The humanitarian sector. The development sector. The aid sector. The non-profit sector. Each of these labels did political work. They drew lines. They claimed legitimacy. They sorted people into who belonged and who was being served.</p>

<p>For a long time, that taxonomy was invisible to most of the people inside it. The people outside noticed sooner.</p>

<h2>What "Sector" Used to Mean</h2>

<p>The hosts walk through what the word used to imply: a coherent professional space with shared standards, shared language, shared institutions, shared career pathways. International staff moved between organisations. Donor frameworks were broadly compatible. The Sphere standards. The IASC. The cluster system. There was a "we." Not a perfect one. But a recognisable one.</p>

<p>That coherence was always partial. It left out a lot of people, particularly local actors. But it was real enough to organise around.</p>

<h2>What "Sector" Means Now</h2>

<p>Today, the coherence is fraying in obvious ways and in subtle ones.</p>

<p>The obvious: funding consolidation, the contraction of major donors, the political decoupling of aid from humanitarian principles in several large markets. The subtle: the divergence between what big institutions still call themselves and what their actual operating logic now is.</p>

<blockquote>If you have to keep insisting you're part of the sector, you're not really part of it anymore. You're part of an industry trying to hold its identity together.</blockquote>

<h2>The Listener's Real Question</h2>

<p>The listener wasn't asking for a definition. They were pointing at a tension. The "sector" they were told they belonged to does not, in their experience, treat them as belonging. Their voice is invited; their decisions are not. Their context is consulted; their authority is not.</p>

<p>If sector means anything coherent, it has to include them in a way that's structurally real, not rhetorically real. Most of the institutional architecture is still designed around the older meaning of the word.</p>

<h2>Three Possible Futures for the Word</h2>

<p>The hosts sketch three possible futures, none of which is endorsed.</p>

<p><strong>One:</strong> The word holds, but its centre of gravity moves. The "sector" survives, but the legitimate actors inside it shift dramatically. More local, more federated, less London-Geneva-New York. The institutional language stays; the institutional power moves.</p>

<p><strong>Two:</strong> The word fragments. We stop talking about "the sector" because there is no longer one. We get a humanitarian field, a development field, a localisation field, a climate-adjacent field, each with its own identity, donor base, and professional logic. The cluster model dies quietly. New coordination forms emerge.</p>

<p><strong>Three:</strong> The word becomes a brand. "The sector" becomes shorthand for the legacy institutions that survived consolidation. Everyone outside that label does similar work but doesn't claim the title. The word narrows. So does its political weight.</p>

<h2>Why This Matters</h2>

<p>This isn't a vocabulary debate. The words we use shape the rooms we build, the strategies we draft, the people we hire, the ones we don't, and the conversations we have when we say "we." The listener was right to push us.</p>

<p>If you're reading this and you're working on humanitarian or development response, wherever you sit, whatever your title, you probably have a personal answer to whether you're "in the sector." That answer matters more than the institutional one.</p>

<p>The episode doesn't conclude with a definition. It concludes with an invitation: stop letting the legacy of the word do the political work the present moment requires you to do yourself.</p>`
  },
  {
    epId: 'FqxeBin5bbQ',
    epN: 1,
    slug: 'what-this-space-is-about',
    title: 'What This Space Is About: Why We Started The Sector Debrief',
    excerpt: 'There are enough polished podcasts in this sector. There are enough panels. There are enough frameworks. We started this for the conversations that don\'t fit those formats.',
    readTime: '5 min',
    reflections: [
      "What's the conversation you'd be having anyway, the one that would happen without a microphone? Have you ever made it visible to anyone outside the room?",
      "Where in your week is the official version of the conversation furthest from the real one? What's the smallest move that closes 10% of that gap?",
      "If balance wasn't the goal of your work and clarity was, what would you say next that you currently soften?",
      "Who in your sector doesn't get invited to the panels? What's their actual answer to the question you're trying to solve?",
      "What's a position you held three years ago that you've quietly changed your mind on? Who knows, and who doesn't?"
    ],
    body: `<p>The first episode of any podcast carries a particular kind of weight. You're explaining why you exist before you've earned the right to. You're claiming a space you haven't yet shown you can hold. You're hoping the people you most want to listen are still listening by minute fifteen.</p>

<p>So we'll keep this short.</p>

<h2>What This Is</h2>

<p>The Sector Debrief is a conversation between three people who have spent a long time inside humanitarian and development work, and who have collectively run out of patience with the official version of what that work is.</p>

<p>Kim Kucinskas. Thomas Jepson-Lay. Ali Al Mokdad. Three different vantage points. Three different relationships to the institutions. One shared instinct: the conversations that actually shape this sector, the honest ones, the unguarded ones, the ones where someone admits they don't have the answer, happen when the microphones are off.</p>

<blockquote>We turned the microphones back on.</blockquote>

<h2>What This Isn't</h2>

<p>This isn't a media training exercise. It isn't a personal-brand vehicle. It isn't a place where we agree with each other in expensive ways. It isn't a panel. It isn't a launch. It isn't a podcast you put on at 1.5x while you do email, though we won't stop you.</p>

<p>It's also not balanced in the way the sector usually means balanced. We are not pretending to represent every position equally. We have positions. We say them. When we change our minds, we say that too.</p>

<h2>What We're Going to Talk About</h2>

<p>Political shifts. Shrinking budgets. Power dynamics. Localisation. Operational pressure. Leadership that survives versus leadership that lasts. The future of crisis response. The futures, plural. There isn't one.</p>

<p>We'll bring guests on. Some of them you'll know. Some you won't. The rule is the same for all of them: come honest, or don't come.</p>

<h2>Why Now</h2>

<p>The sector is in a moment that doesn't reward unprepared honesty. Funding is contracting. Donors are consolidating. Reputational risk has become a dominant decision-making logic. The official language of the sector is increasingly designed not to say things.</p>

<p>That gap, between what people in this work talk about with their colleagues at the end of a long day, and what they're permitted to say in public, has become large enough to be politically interesting. We think filling some of it might be useful.</p>

<h2>How We're Going to Do This</h2>

<p>We're going to publish irregularly, when there's something worth saying. We're going to keep the production light. We're not going to over-rehearse. We're going to be okay with episodes that don't end neatly. We're going to disagree on the show. We're going to be wrong sometimes, and try to say so when we are.</p>

<p>And we're going to listen. To listeners, to guests, to the part of the sector that doesn't get invited to most of the panels. If you're one of those people, write to us. We mean it.</p>

<h2>The Last Thing</h2>

<p>This episode ends without a clean takeaway. That's intentional. The work this podcast wants to do isn't to give you another framework. It's to be one of the spaces where the harder conversations can actually happen.</p>

<p>If that sounds useful, stay with us. If it doesn't, no hard feelings.</p>

<p>Either way, welcome to The Sector Debrief.</p>`
  }
];

// Translations placeholder · for true production, would auto-translate via Claude API
const TRANSLATIONS = {
  en: { name: 'English', dir: 'ltr' },
  fr: { name: 'Français', dir: 'ltr' },
  ar: { name: 'العربية', dir: 'rtl' }
};

const HOSTS = [
  {
    photo: 'assets/host-ali.jpg',
    initial: 'A',
    name: 'Ali Al Mokdad',
    role: 'Co-Host',
    bio: 'Builds and unbuilds operations for a living. Spent the last decade inside the humanitarian response, moving between field offices and headquarters in some of the hardest displacement contexts of the era. Writes openly about the operational pressure most leaders feel but rarely say out loud, and about the distance between what the sector announces and what it actually does.',
    linkedin: 'https://www.linkedin.com/in/ali-al-mokdad/',
    accent: 'cobalt'
  },
  {
    photo: 'assets/host-kim.jpg',
    initial: 'K',
    name: 'Kim Kucinskas',
    role: 'Co-Host',
    bio: 'Spends her time in the messy middle of organisational change. Interested in the difference between strategy on paper and strategy that actually moves a building. Cares about what equitable, locally-led work looks like once the slides are turned off and someone has to choose. A systems thinker who keeps asking who the system is currently designed for.',
    linkedin: 'https://www.linkedin.com/in/kim-kucinskas/',
    accent: 'crimson'
  },
  {
    photo: 'assets/host-thomas.jpg',
    initial: 'T',
    name: 'Thomas Jepson-Lay',
    role: 'Co-Host',
    bio: 'Eighteen years of senior leadership across some of the most demanding humanitarian environments on earth. Now coaches the people who carry that kind of weight. Brings a calm, irreverent, and structural read on what leadership under pressure actually costs, and what it can still do when most of the certainty has left the room.',
    linkedin: 'https://www.linkedin.com/in/thomas-jepson-lay-1588211b4/',
    accent: 'mustard'
  }
];

// Real channel stats · updated from the YouTube channel
// Total Views as of latest sync (2026-05-27): 76,760
const STATS = {
  episodes: EPISODES.length,
  views: '76,760'
};

// ─── Node export shim ────────────────────────────────────────
// In browsers, this block is silently a no-op (module is undefined).
// In Node (sync script + tests), this lets `require('./data.js')`
// pull the live data. Doesn't affect runtime behaviour at all.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORMS, EPISODES, QUOTES, BLOG_POSTS, TRANSLATIONS, HOSTS, STATS };
}
