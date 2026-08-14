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

// All 8 episodes from the playlist (newest first)
const EPISODES = [
  {
    n: 9,
    id: 'KPgZ2FhQpb4',
    slug: 'what-do-you-tell-the-next-generation',
    transcript: true,
    title: 'What Do You Tell the Next Generation?',
    guest: null,
    date: '2026-07-10',
    duration: '50 min',
    description: 'Kim Kucinskas, Thomas Jepson-Lay, and Ali Al Mokdad work through a question all three keep getting asked, from students, emerging leaders, and colleagues who lost their jobs: what do you tell someone about a career in humanitarian and development work now that the old pathway in has broken? The conversation moves from motivation versus identity, the job is only the vehicle for the values you enact, to Ali Al Mokdad\'s distinction between purpose and task, the task is disappearing into AI while the purpose of a role, building judgement and learning how an organisation actually works, must not. Kim Kucinskas presses on where the next generation earns hard-won judgement if the entry-level work is automated away. It gets honest about private truths and public lies, the sector fracturing, and humanitarian diplomacy as the work of keeping the door open, and closes on the strange advantage emerging leaders have: they do not need to unlearn a version of leadership built for a world that no longer exists.',
    themes: ['Next Generation', 'AI', 'Leadership']
  },
  {
    n: 8,
    id: 'm8wvagMeDQs',
    slug: 'rethinking-risk-management',
    transcript: true,
    title: 'Rethinking Risk Management in the Humanitarian and Development Sector',
    guest: 'Sabrina Segal',
    date: '2026-06-09',
    duration: '55 min',
    description: 'A conversation with Sabrina Segal, Director of The Risk Collaborative, on what risk actually is once you stop treating it as compliance. Sabrina, Kim Kucinskas, Thomas Jepson-Lay, and Ali Al Mokdad work through risk as the effect of uncertainty on objectives, which means threats and opportunities, not a register of bad things that gets dusted off once a quarter for the trustees. The conversation moves from why so much of the sector still does risk as a tick-box exercise, to risk sharing instead of risk transfer (a woven rope, not a chain where the weakest, least-resourced link is the one expected to break), to using the language of risk as a Trojan horse to get localization and power-balancing into the rooms where funders actually sit. It closes on what Ali Al Mokdad calls the generational fight: clearing out the outdated governance and process so the sector can focus on the problems that matter.',
    themes: ['Risk', 'Risk Sharing', 'Localization']
  },
  {
    n: 7,
    id: 'vPJAWTb2dPI',
    slug: 'donations-collaboration-and-ai',
    transcript: true,
    title: 'Donations, Collaboration, and AI in the Room',
    guest: null,
    date: '2026-05-27',
    duration: '54 min',
    description: 'Ali Al Mokdad opens with a Sunday morning at his door. A family with two children, collecting donations for an NGO, and his trained brain immediately runs through overhead, restricted funds, disallowed costs. Then it stops. Kim Kucinskas, Thomas Jepson-Lay, and Ali Al Mokdad sit with what just happened: this is not only a funding problem, it is a social contract problem. The conversation widens into AI in the workplace (productivity gains that get clawed back, atrophy, agents that do not collaborate with each other) and collaboration as a discipline rather than a slogan.',
    themes: ['Donations', 'Collaboration', 'AI']
  },
  {
    n: 6,
    id: '7w_FXEcBzs4',
    slug: 'making-sense-of-the-sector',
    transcript: true,
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
    slug: 'identity-and-positionality',
    transcript: true,
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
    slug: 'ceo-perspective-urgent-patience',
    transcript: true,
    title: 'The CEO Perspective, Urgent Patience, and Why Idealism Is Not Naivety',
    guest: 'Sofia Sprechmann Sineiro',
    date: '2026-03-07',
    duration: '58 min',
    description: 'Featuring Sofia Sprechmann Sineiro, former Secretary General of CARE International and locally led development advocate. Three decades of experience distilled into a conversation on balancing authenticity with institutional survival. Topics include pragmatic optimism, values integrity during crises, and what locally led development truly means beyond terminology. Ali Al Mokdad shares personal crisis management techniques.',
    themes: ['CEO Insight', 'Localization', 'Idealism']
  },
  {
    n: 3,
    id: 'nQpnWvOoEio',
    slug: 'leadership-under-pressure',
    transcript: true,
    title: 'Humanitarian Leadership Under Pressure, Identity vs Strategy, and What Comes Next',
    guest: null,
    date: '2026-02-07',
    duration: '46 min',
    description: 'Leadership within pressurised humanitarian systems. The hosts contrast grassroots innovation with large institutional survival modes. Discussion addresses values under stress, reputational risks, and organisational sustainability during transformation. A focus on systems breaking down and emerging alternatives, and the uncomfortable but necessary changes the sector keeps deferring.',
    themes: ['Pressure', 'Strategy', 'Transformation']
  },
  {
    n: 2,
    id: 'VVe2TM2z5UI',
    slug: 'what-does-sector-mean',
    transcript: true,
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
    slug: 'what-this-space-is-about',
    transcript: true,
    title: 'What This Space Is About, Leadership and Reflections',
    guest: null,
    date: '2025-12-13',
    duration: '38 min',
    description: 'The inaugural episode introduces the programme\'s purpose. Hosts Kim Kucinskas, Thomas Jepson-Lay, and Ali Al Mokdad introduce their leadership perspectives and the personal reflection methodologies they use to think systematically about sector challenges. The opening note: this won\'t be a polished podcast. It will be honest.',
    themes: ['Origins', 'Reflection', 'Leadership']
  }
];

// Quotes · pulled directly from the show's "Sector Debrief Shorts" playlist.
// Each one is a real moment from a real episode, attributed to the person
// who said it on camera.
const QUOTES = [
  { text: "When this crisis is over, there will just be a new one. The leaders who will navigate that are the ones committed to being authentically themselves.", source: "Kim Kucinskas",                color: "q-cobalt" },
  { text: "I spent three years explaining HQ to the field, and the field to HQ. That was my job.",                                                              source: "Ali Al Mokdad",               color: "q-crimson" },
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
  { text: "More people are seeing examples of people who managed to break those glass ceilings, and those people are telling their stories. Storytelling is becoming one of the most powerful tools right now.",                  source: "Ali Al Mokdad",               color: "q-cream" },
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
  { text: "One side is using AI to request things, and the other side is using AI to respond to those requests. We were building an alternative reality.",                       source: "Ali Al Mokdad",               color: "q-cream" },
  { text: "Shift the power is a great slogan. I don't think it happens in reality. But balancing the power, that we can actually do.",                                          source: "Sabrina Segal",              color: "q-cobalt" },
  { text: "Those who came before us set the foundation. Our job is to clear out the outdated governance and the nonsense, so the people who come after us can focus on the real problems. This is our generational fight.", source: "Ali Al Mokdad",   color: "q-crimson" },
  { text: "We need to distinguish between purpose and task. The role should not disappear. The purpose should remain. Some tasks, yes, they have to disappear.",                                                                     source: "Ali Al Mokdad",               color: "q-mustard" },
  { text: "I'd much rather someone who asks a good question, or admits they don't know what they're doing, than someone who arrives with a five-point plan.", source: "Kim Kucinskas",           color: "q-forest" },
  { text: "The guise of familiarity gets put forward as certainty, and that's just managed decline.",                            source: "Thomas Jepson-Lay",           color: "q-rust" }
];

// AI-generated long-form blog posts · one per episode + two pinned editorials
const BLOG_POSTS = [
  {
    epId: null,
    epN: 90,
    pinned: true,
    slug: 'pause-button-and-ai',
    title: 'Notes on the Pause Button: How AI Plays Its Role Without Doing the Reflecting',
    excerpt: 'Every essay on this site ends with five reflection prompts. They rotate through the Pause & Reflect tile on the blog page. Here is the honest answer to where they come from and what AI does and does not do.',
    readTime: '6 min',
    reflections: [
      "What is one tool in your work that you use because it saves time, and one you use because it changes how you think? How do you keep the two from collapsing into each other?",
      "When was the last time you reached for AI to do a task, and the answer it gave was technically correct but ended a conversation you needed to keep having?",
      "Pick a reflection prompt you have asked someone else to sit with this year. Have you sat with it yourself?",
      "What part of your thinking would you not outsource to a tool, even one you trust? Why that part specifically?",
      "If you removed every AI assistant from your workflow for a week, which decisions would still be just as good, and which would suddenly take longer? What does that tell you about where you were really using it?"
    ],
    body: `<p>There is a quiet button on this site. Open the Blog page and the first thing you see, above the essays, is a tile that says Pause &amp; Reflect. It rotates through questions. Click "Ask me another" and the question changes. There is no algorithm guessing what to show you. The questions came from the essays. Each essay ends with five of them. The tile cycles through all of them.</p>

<p>This essay is about how those questions get there, and where AI fits.</p>

<h2>Where the Prompts Come From</h2>

<p>Every episode of The Sector Debrief is a conversation between Ali Al Mokdad, Kim Kucinskas, and Thomas Jepson-Lay, sometimes with a guest. We record. We talk. The talk gets transcribed. Then someone has to figure out what is actually worth taking from the conversation into the rest of the work.</p>

<p>For each essay on this site, we ask one simple thing: what are the five questions a listener could sit with this week and find different ground under their feet?</p>

<p>That is a hard thing to do well. Most of the sector's "key takeaways" sections produce takeaways nobody takes. They produce summaries that close conversations rather than open them. They turn the messiness of a real conversation into a checklist.</p>

<p>We try not to do that. The prompts are designed to leave you slightly less settled than when you started. That is the work.</p>

<h2>Where AI Fits</h2>

<p>The essays on this site are AI-assisted. So are the prompts. We do not hide that. The note at the top of the data file literally says "AI-generated long-form blog posts." It would be strange not to acknowledge it.</p>

<p>What AI is doing: helping turn a fifty-minute conversation into structured long-form text, extracting the underlying questions, suggesting a frame, drafting the prose. It is fast at this. It is a useful tool.</p>

<p>What AI is not doing: the conversation, the listening, the choosing of what matters, the willingness to be wrong on the record, the personal stake the three of us carry into each recording. None of that is generated. None of that can be.</p>

<blockquote>The AI is a tool. The thinking is ours. We are not embarrassed about either part.</blockquote>

<p>There is a temptation in this moment, especially in the humanitarian sector, to either dismiss AI as a corner-cutting trick or to embrace it as a replacement for thinking. We think both moves are wrong. The first is nostalgia. The second is the thing Thomas Jepson-Lay warned about in Episode 7 when he talked about pilots and the autopilot. If you outsource the part of the work that builds the skill, the skill atrophies. You do not notice until the autopilot fails.</p>

<p>So we use AI as a tool. The prompts are not generated live every time someone clicks "Ask me another." They are written, reviewed, and committed to the site once. The button is a rotation through pre-written questions. The AI helped write them. The AI is not asking them. We are asking them. The button is just a way of putting one of them in front of you at a moment when you might let it land.</p>

<h2>What the Tool Is Actually For</h2>

<p>The Pause Button is not a feature. It is not a content strategy. It is a small invitation, repeated.</p>

<p>Most of the things in this sector that ask for your attention assume you are going to read them, nod, and move on. The whole architecture of the work is built on volume: more updates, more reports, more meetings, more decks. The Pause Button is the opposite move. It asks you to slow down on one question.</p>

<p>If you click the button five times in a row, you will see five different prompts. That is fine. It is also fine to click it once and stay with the question for ten minutes. The tool does not care. The tool is on your side either way.</p>

<h2>The Sector's AI Problem in Miniature</h2>

<p>Ali Al Mokdad keeps coming back to a story from Episode 7. He generated twenty-two annexes for a local partner using AI, because the prime applicant requested twenty-two annexes that would never be implemented. AI request, AI response. Documents flowing in both directions. None of them attached to the real work. He called it building an alternative reality.</p>

<p>That is what AI as a default tool looks like in this sector right now. It is not the AI's fault. It is what you get when you point a tool that produces content at a system that demands content for its own sake.</p>

<p>The Pause Button is a small attempt to point the same tool in the other direction. Less content. More questions. Slower. Not because the question takes more time to read, but because the question takes more time to honestly answer.</p>

<h2>What This Is Not</h2>

<p>It is not a wellness moment. It is not a "take a deep breath" intervention. It is not coaching. The prompts are not nice. Some of them are intentionally uncomfortable. If you find one that does not bother you at all, that is information. Maybe you have done the work on it already. Maybe you have not let it land yet.</p>

<p>It is also not the only thing the AI on this site does. The essays themselves are AI-assisted long-form. The episode summaries are AI-assisted. The blog covers are generated by a small JavaScript function rather than by a designer. There is a layer of structural assistance running underneath the whole site. We are not pretending otherwise.</p>

<p>The thing the AI is not doing is the conversation, the choice of which question matters, or the work of actually sitting with the answer. That is yours.</p>

<h2>The Last Thing</h2>

<p>If you got this far and you have not clicked the Pause Button yet, scroll back up and try it. Read the question that comes up. Sit with it for one minute before you do anything else.</p>

<p>That minute is the actual product on this site. Everything else is wrapping.</p>`
  },
  {
    epId: 'KPgZ2FhQpb4',
    epN: 9,
    slug: 'what-do-you-tell-the-next-generation',
    title: 'Purpose and Task: What Do You Tell the Next Generation?',
    excerpt: 'Hosts-only. The question all three keep getting asked, from students, emerging leaders, and colleagues who lost their jobs. What survives when the old pathway breaks, when AI takes the task, and when the sector cannot agree what it stands for?',
    readTime: '8 min',
    reflections: [
      "Look at one entry-level role you influence. If AI can now do its tasks, what is the purpose that role still exists to build, and are you protecting that purpose or quietly cutting it along with the tasks?",
      "Separate motivation from identity in your own case. What values first drew you to this work, and how much of what you now call your identity is really the job title, the organisation, and the architecture around it? Which part would survive if the vehicle disappeared tomorrow?",
      "Find the place in your team where someone junior needs to make a real decision, and be allowed to get it wrong, to build judgement. Is that still happening, or has efficiency quietly removed the room to practise?",
      "Name one private truth you hold in the corridor but would not say in the public session. What would it cost you to close the gap between the two by even one sentence?",
      "Think of the most junior person in your last big meeting. Were they there to take notes, or to build judgement, and which did your own behaviour actually invite? What would you change in the next one?"
    ],
    body: `<p>Three people who have spent their careers in this sector keep getting the same question, from three different directions. Students who have just spent thousands on a degree. Emerging leaders who signed up for one kind of impact and are no longer sure it exists. Colleagues who came home from country operations, or lost the assignment, and are working out what a normal life is supposed to feel like. Underneath all of them sits the same question. What do you tell someone about a career in humanitarian and development work now that the old way in has broken?</p>

<p>This episode is the three of us sitting with that question without pretending to have a clean answer. Kim Kucinskas put the honest frame on it early. Getting into this work never had a clear trajectory, but the old pathways are broken now, and even people with established careers are struggling. To say anything useful to a newcomer, you have to make a bet about where the sector is going. So we made a few.</p>

<h2>Motivation Is Not Identity</h2>

<p>The first bet is that people have been confusing two things that were never the same. Kim named it as motivation versus identity. Most of us say I work in this, and this is who I am, and when the job goes, the identity goes with it. The people struggling most right now, the ones who came back from the field and the ones who were made redundant, are wrestling with identity in both directions.</p>

<p>Thomas Jepson-Lay pushed it further with a story about a colleague, Gareth Owen, being interviewed after a response. He introduces himself as having been a humanitarian for the last twenty years, and the reporter asks, what were you before, a bastard? The joke lands because it exposes the trick. The identity gets so wrapped up in the job title and the architecture around it that it strips out the thing underneath. Thomas put the challenge plainly.</p>

<blockquote>Isn't identity associated with the values you enact, and the job is just the vehicle for exercising that identity?</blockquote>

<p>If that is true, the honest advice to a newcomer is not here is how you get the job. It is go back to first principles: what impact do you actually want, and what values are you trying to enact? The demand for people who want to exercise humanity is not going away. It is going to increase. The jobs will still exist. They will just look different, sit in different places, and be more competitive. The scaffolding moved. The reason to do the work did not.</p>

<h2>Purpose and Task</h2>

<p>The second bet is the sharpest idea in the episode, and it is where AI comes in. Ali Al Mokdad told a small story that stayed with all three of us. He was assigned an assistant on a project, started collaborating, and then realised he preferred not having one. A friend had reached the same conclusion independently. The reason was uncomfortable. The effort it takes to orient, train, engage, coordinate and supervise an assistant is now greater than the effort it takes to prompt an AI agent to do the same tasks, faster.</p>

<p>That could be read as a case for cutting entry-level roles. Ali argued the opposite, and the distinction is the one to hold onto.</p>

<blockquote>We need to distinguish between purpose and task.</blockquote>

<p>The task, taking the minutes, drafting the email, setting up the calendar invite, following up, is changing, and he is in favour of it changing. The purpose, overseeing the flow of a project cycle, learning while engaging with different people, building judgement about how an organisation actually works, should remain and be built on further. The role should not disappear. The reason the role exists should get stronger. The busywork that used to fill it can go.</p>

<p>Kim Kucinskas put the hard question to that optimism. The old logic said the value of an intern taking notes was being in the room, absorbing the culture and the language, getting inducted into the work just by being present. If AI takes the note-taking, was that presence ever really valuable, or was it a story we told ourselves? And even if the seat survives, are they just being taught the same power structures everyone says need to change? The answer the three of us landed on was not to remove the seat. It was to change what the person in it spends their time on. Keep them in the room. Point their hours at judgement, not administration.</p>

<h2>The Pipeline Problem</h2>

<p>Underneath the optimism sits a real risk, and Kim named it most clearly. If the lower-level work is handed to AI for the sake of efficiency, where does a young workforce get the hard-won judgement that a manager or a leader actually needs? If they never get to exercise judgement and make mistakes, what happens to the pipeline five, ten, fifteen years out?</p>

<p>Thomas Jepson-Lay called the danger by its name: short-termism. The leaders who get this right will make a decision that looks less efficient today, investing in people, and more effective later, because those people will have gone through the slower, harder journey that builds judgement. The glass-half-full version is that this happens partly by accident, because leaders are not ready to hand full control to AI and keep people around out of caution. Either way, the honest part remains. There will be fewer formal jobs, and a smaller structured architecture, than the sector used to offer. Pretending otherwise does the next generation no favours.</p>

<h2>Private Truths and Public Lies</h2>

<p>Then the conversation turned, and it got more personal than we usually get. Ali said something he does not often say in public. He is worried the sector is fracturing into movements that no longer sit under the same idea of humanity, some drifting in directions he cannot quite name, some tearing at each other in public while the whole sector gets branded as one thing from the outside. He gets pressure to use his platform for specific positions he does not always agree with, and he has made a deliberate choice to stay measured, because the role he tries to play depends on it.</p>

<p>He calls that role humanitarian diplomacy. Some people keep the door open, some are fine closing it. Keeping it open means engaging with people who are not fans of the sector, and with armed groups and de facto authorities, on questions like access and participation, even without full agreement on principles, because someone has to. You cannot build a bridge while going in on full attack. And he named the quieter cost of the sector's caution directly.</p>

<blockquote>There are private truths and public lies.</blockquote>

<p>The corridor conversations at headquarters and country level, on localisation, on effectiveness, on what is really working, are often not the ones held in public. Kim Kucinskas offered the constructive version. We do not all have to agree in order to coordinate and reinforce each other. You can disagree on the how and still hold the same underlying belief that civil society is a public good. What undermines everyone is tripping over each other in the same rooms, contradicting each other, and calling it principle.</p>

<h2>The Truck That Beat Us to It</h2>

<p>Thomas told the story that made the point impossible to dodge. Mozambique, 2019, after Cyclone Idai. His team got into a flooded settlement and did what the sector does. They walked around, talked to community leaders, gathered an understanding of the needs, waited for permission, waited to raise the money for helicopters. While they were doing that, a truck arrived. By the time they had finished their conversations, the people from the truck had set up a health facility, started treating patients, put a drone in the air and had a comms team filming. On the side of the truck it said China Aid.</p>

<p>Thomas was careful, and so are we. He cannot speak to the motivations, and this is not a verdict on any government. His point was about us. If the outcome is saving lives, and the standard of the response is good, where does the sector get to hold a moral high ground that says you cannot be in the club? He named the alternative for what it is.</p>

<blockquote>The guise of familiarity gets put forward as certainty, and that's just managed decline.</blockquote>

<h2>The Advantage of Not Having to Unlearn</h2>

<p>The episode ends somewhere hopeful, which surprised us given where it travelled. Thomas ran the same leadership programme for two groups in parallel, one of chief executives, one of emerging leaders. He rewrote the manual for the younger cohort and showed the new introduction to his wife, a senior leader at a large international NGO. She read it and said she was jealous. The emerging leaders, she said, do not need to unlearn anything. They get to learn it straight off the bat.</p>

<p>That is the advantage. The leaders currently at the top built their identity around an environment that no longer exists. The people coming in do not carry that weight. What they need is not a five-point plan. Kim said it best.</p>

<blockquote>I'd much rather someone who asks a good question, or admits they don't know what they're doing, than someone who arrives with a five-point plan.</blockquote>

<p>Which puts the responsibility back on the people already inside. The task is not to keep an intern in the room to learn the old language. It is to hold space for them to bring the new and uncomfortable ideas, and to be secure enough not to treat that as a threat. Ali put the generational frame on it. Maybe the emerging leaders are the ones who get to define what it even means to be a humanitarian now. The job of everyone already here is to clear the space for them to do it.</p>

<p>A note on these notes, because this page promises honesty about how it is made. This essay is our reading of the conversation, drafted from the episode transcript. The quoted passages are as spoken on camera. Everything else is interpretation, and the episode itself is the place to hear the three of us think it through in full.</p>`
  },
  {
    epId: 'm8wvagMeDQs',
    epN: 8,
    slug: 'risk-in-the-round',
    title: 'Risk in the Round: From Compliance to Strategy, and the Generational Fight',
    excerpt: 'Notes from our conversation with Sabrina Segal, Director of The Risk Collaborative. Once risk is the effect of uncertainty on objectives, the tick-box register stops making sense, and the question becomes who carries the power.',
    readTime: '7 min',
    reflections: [
      "Pull up your organisation's risk register. Is it only a list of things that might go wrong, or does it also name the opportunities you would lose by playing it safe? What does the imbalance tell you about how the place actually thinks?",
      "On the episode, Sabrina points to the ISO 31000 definition: risk is the effect of uncertainty on objectives. Pick one objective your team is chasing right now. Did anyone do the risk thinking while you were setting it, or only afterwards, when the register was due?",
      "Where in your work does risk get transferred down to the partner with the least power to carry it, and called due diligence? If you named that out loud in the next meeting, what would happen?",
      "Find the fragile part of your organisation, the one everyone knows about but nobody writes down. Is it fragile because it has to be, or because no one has been willing to redesign it?",
      "Ali calls it the generational fight. Name one piece of outdated process or governance in your own work that you could actually retire this year, instead of waiting for permission to question it."
    ],
    body: `<p>Sabrina Segal told a story on this episode about being accused of being too strategic. A prospective client had decided, in so many words, that her approach to risk was a bit much for what they had in mind. She took it to LinkedIn at the time, the community helped her think it through, and she told it on the episode with a laugh. We keep coming back to that story because of what it accidentally photographs: a sector in which strategic is something a risk person can be accused of.</p>

<p>The default it photographs is risk as compliance. A list of bad things that might happen, scored with some impact-times-likelihood arithmetic, filed in a register the length of a small annex, dusted off once a quarter and handed to the trustees. Sabrina Segal is the Director of The Risk Collaborative, and the work she described on the episode runs almost exactly the other way.</p>

<h2>Six Words</h2>

<p>The definition she pointed to is not hers. It belongs to the International Organization for Standardization, ISO 31000, and it is six words long: <em>the effect of uncertainty on objectives</em>.</p>

<p>Read it slowly, because two things fall out of it that the compliance version hides. The first is that risk starts with an objective, not with a threat. You begin with what the organisation is actually trying to achieve, and you do the analysis outward from there. The second is that uncertainty cuts both ways. Threats on one side, opportunities on the other. A risk process that only ever asks staff what could go wrong is throwing away half of their judgement and half of the actual picture. That reading is ours, but it is hard to sit through the episode and come away with a different one.</p>

<h2>The Tick-Box and the Map</h2>

<p>The conversation kept circling the difference between a register and a map. The traditional register is linear. It lists, it scores, it files. The way Sabrina described her work with organisations, it lands closer to a systems map, though by her own telling she avoids the phrase systems thinking in the room, because it makes people freeze. Colours and a board instead, and start with the objective. What will prevent us from reaching it. What will accelerate it. Who needs to be in the conversation before it is set.</p>

<p>Ali Al Mokdad added a layer from the operational side. Risk means different things depending on where you sit. At field level it is access, safety, security. At country level it becomes compliance and positioning and how you treat your local partners. At headquarters it is enterprise risk, reputational risk, the flashing Excel sheet. Same word, different worlds. He also named the quieter truth: at country level you sometimes brand something as a risk precisely because that is the word that gets headquarters to pay attention. The register is not only a control. It is a political instrument.</p>

<h2>The Chain and the Rope</h2>

<p>Here is where the episode turned from interesting to important. The dominant way the sector handles risk is to transfer it. The highest-power, best-resourced player passes the risk down to the lowest-power, least-resourced one, and calls the paperwork due diligence. Picture delivery as a chain, and the weakest link is the one that breaks.</p>

<p>The image Sabrina set against that is a woven rope. Risk sharing instead of risk transfer. The funder's concerns woven toward the frontline, the frontline's concerns woven back toward the funder, and the risk carried by whoever is actually positioned to carry it rather than dumped on whoever has the least power to refuse it. She was just as plain about what she was not promising:</p>

<blockquote>Shift the power is a great slogan. I don't think it happens in reality. But balancing the power, that we can actually do.</blockquote>

<p>The structure she walked through is her three P framework: Project, Partner, Patron. Everyone agrees on the project objective. Reduce maternal and child mortality, protect the forest, check on the elderly through winter. But the funder, the intermediary, and the local partner each see the risk of that objective differently. So the partner is asked, not whether they are high, medium or low risk against a Western checklist, but what their risk capacity is inside their own operating environment. The example she used has stayed with us: a women's organisation in Sudan that cannot buy insurance, because there is no insurance market to buy it from, is not high risk. It is operating in a context the checklist was never written for. And the patron, the funder, is asked to plot themselves honestly on a line from command-and-control to trust. In her experience, most say trust and land closer to control. Now there is data and a shared language, instead of a power imbalance dressed up as assurance.</p>

<h2>Coffee Without Cream</h2>

<p>Ali Al Mokdad offered a story that reframed the whole thing. A man walks into a cafe and orders a coffee without cream. The waitress says, sorry, we have no cream, but we can do you a coffee without milk. Chemically the cup is identical. Black coffee either way. But the moment you look at what is missing, you stop talking about materials and start talking about ideology, about class, about how a place sees itself.</p>

<p>His point: risk management without the Excel sheet is not the same thing as risk management with it, even when the thinking is identical, because for a large part of the sector the register is not a tool. It is a culture, an ideology about what serious operations are supposed to look like. The first thing people notice about a new approach is not what it delivers. It is what it leaves out. And when you start pulling on what it leaves out, you find the problem was never the tool or the technique. It was the philosophy underneath.</p>

<h2>Don't Predict, Prepare</h2>

<p>On threats, one line from Sabrina stuck: do not predict, prepare. The sector pours enormous effort into predicting the next shock and very little into knowing where it is already fragile. Over-reliance on one large funder sat on risk registers across the sector for years. How much good did the register do when the funding actually disappeared? Most organisations found out where they were fragile in real time, with no luxury to buffer or redesign first.</p>

<p>That is the work now, in the quieter aftermath. Stand back and ask which fragilities are inherent, so they need buffering, and which exist only because nobody has been willing to redesign them. Then have the hard conversation about scope. What is the mission, where did scope creep in, what gets doubled down on. The organisations Sabrina described coming through this in one piece are the ones being honest about that with their boards and their staff, rather than the ones still doing something for the seventh year because they once promised the board they would.</p>

<h2>The Generational Fight</h2>

<p>Near the end, the conversation stopped being about risk at all. Ali Al Mokdad named what he thinks this generation is actually for:</p>

<blockquote>Those who came before us set the foundation. Our job is to clear out the outdated governance and the nonsense, so the people who come after us can focus on the real problems. This is our generational fight.</blockquote>

<p>The annexes nobody will ever implement, the process fetish, the structures that exist because they have always existed. Clear them out, so the next people can spend their energy on climate, on hunger, on health. Sabrina's answer ran tactical: if the language of risk is the Trojan horse that gets risk sharing and localization into the rooms where funders actually sit, use it. People in power lean in when you say risk. They glaze over at psychology and they run from systems change. Use the entry point you actually have. Kim Kucinskas had her own name for the same move: a crack of opportunity.</p>

<p>Thomas Jepson-Lay closed by reducing the whole hour to one shift. Stop managing risk as a compliance strategy. Start managing the risk of not meeting your objectives. Kim called it risk in the round. It is a small reframe with a large door behind it.</p>

<p>A note on these notes, because this page promises honesty about how it is made: this essay is our reading of the conversation, drafted from the episode transcript. The two quoted passages are as spoken on camera. Everything else is interpretation, and the episode itself is the place to hear Sabrina make her case in her own words.</p>`
  },
  {
    epId: 'vPJAWTb2dPI',
    epN: 7,
    slug: 'sunday-knock',
    title: 'Not Just a Funding Problem: A Sunday Knock and What Came After',
    excerpt: 'Ali Al Mokdad opened the door on a Sunday morning. A family with two children, holding an NGO flyer. His trained brain went straight to overhead and disallowed costs. Then it stopped.',
    readTime: '6 min',
    reflections: [
      "What was the last moment in your work when the systems view obscured the human view standing in front of you? What do you remember about the pause?",
      "Pick one cause your organisation claims as its work. Are you in social contract with the people you serve, or in a transaction with the funders who pay you? Which one would they say?",
      "Where in your week is AI helping you do more, and where is the time it saved getting quietly clawed back into more workload, not more humanity?",
      "Name a skill you used to have that you now reach for AI to perform. If you were forced to do it without AI tomorrow, how much of it would still work?",
      "Identify someone in your organisation who quietly holds collaboration together. If they left next month, what would actually fall apart? What does that tell you about how the work is really structured?"
    ],
    body: `<p>It was a Sunday. Ali Al Mokdad was at home with coffee. There was a knock at the door.</p>

<p>A family was standing there, a mother and two children, holding a small flyer. The pitch started right away. The campaign was familiar; Ali Al Mokdad recognised the NGO and the format immediately. He had been on the other side of campaigns just like it not long ago.</p>

<p>He reached for his phone to send the money. While the transfer was processing, his brain was already doing the thing trained operators' brains do. Where will this actually land. How much will get absorbed at headquarters before it leaves the building. Is this going to cover a loss account. Is this going to a summit. He had spent years inside the machinery that turns donations into restricted and unrestricted lines, and the machinery does not stop running just because there is a family at your door.</p>

<p>Then he stopped.</p>

<h2>What He Actually Saw</h2>

<p>The family on the step had no idea about loss accounts. They did not need to. They had chosen to spend their Sunday going door to door, building to building, repeating the same short pitch about why people here should give money to people elsewhere. The children were tired. They had clearly knocked on a lot of doors already.</p>

<p>The campaign collected over a million dollars that weekend. Ali Al Mokdad learned that later in a thank-you message on his phone. By then he had spent two days thinking less about where the million dollars would actually go and more about what those families had been doing that day. Practising values. Showing their children what solidarity looks like outside the slide deck. Stepping into the institution from the public side.</p>

<blockquote>For a few hours on a Sunday, the sector's most powerful resource was not its grants office. It was a family standing on a step.</blockquote>

<h2>Not Just a Funding Problem</h2>

<p>Kim has been carrying around a framing that became the spine of this episode. <em>The problem in the sector is not only a funding problem. It is also a social contract problem.</em></p>

<p>Kim made the full argument after Episode 6: a funding problem has a funding solution, and the sector loves funding problems because they are, in theory, solvable. A social contract problem asks something harder, whether anyone on the other side still believes the arrangement is working. This episode is what that looks like at the door.</p>

<p>When a family knocks on your door on a Sunday, they are not waiting for the strategic review. They are renewing the contract in person. The funding crisis you read about in the board paper is the signal that the contract was already in trouble. The Sunday knock is one of the few places it is still being practised.</p>

<h2>The Alternative Reality</h2>

<p>The conversation shifted to AI, and Ali Al Mokdad brought a different story. He had been supporting a local NGO through a proposal cycle. The international NGO that was the prime applicant requested twenty-two annexes from the local partner two days before deadline. Policies. Processes. Frameworks. Most of them were not applicable in the country office's context. The executive director did not have the capacity to write twenty-two annexes that would, in any case, never be implemented. So Ali Al Mokdad generated them with AI.</p>

<p>One side using AI to request things that will never be implemented. The other side using AI to produce things that will never be implemented. Documents flowing in both directions, none of them attached to the real work.</p>

<blockquote>It felt like something was broken. We were building an alternative reality.</blockquote>

<p>This is the part of the AI conversation the sector keeps not having. Not whether AI will steal jobs. Not whether it will lift productivity. Whether it is being used to absorb the cost of bureaucracy that nobody believes in, on both sides of a relationship that used to be about something else.</p>

<h2>The Productivity Trap</h2>

<p>About three years ago, Ali Al Mokdad ran a small experiment inside an international NGO. He was using AI tools and automation in his grants role and his workload had measurably dropped. He went to his line manager with a documented case. He had about thirty percent of his time back. He proposed reinvesting half of it in HR work on diversity and inclusion, and the other half in raising organisational awareness about AI.</p>

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

<p>A family on a step on a Sunday is maintaining it from the outside. A local NGO that was handed twenty-two annexes two days before deadline is being asked to maintain it on terms that do not match its reality.</p>

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
    readTime: '4 min',
    reflections: [
      "What does \"civil society\" mean to the people you serve? Not to your org's theory of change. To the actual humans. When did you last check?",
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

<h2>Making Sense vs Making Peace</h2>

<p>One of the most useful distinctions in this episode is the difference between <em>making sense</em> of what's happening and <em>making peace</em> with it.</p>

<p>Making sense is active. It requires taking in information that challenges your framework and updating your mental model. It's uncomfortable. It usually means admitting that something you believed no longer holds.</p>

<p>Making peace is passive. It's what happens when you're too tired to make sense. When you absorb the reality and decide not to fight it. When the strategy document quietly shifts from "here's how we change things" to "here's how we survive things."</p>

<p>The sector is doing a lot of making peace right now and calling it strategic adaptation. The three hosts don't pretend there's a clean answer. But they name the distinction. That's a start.</p>

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
    readTime: '3 min',
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

<p>The criteria we actually use: Has this person said something we could not get from a panel? Are they willing to be wrong on the record? Will the conversation be different from the version they have already given on every other podcast in the sector?</p>

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
    readTime: '4 min',
    reflections: [
      "Think about a room you'll be in this week. Who decided you'd be there, and what would change if you brought your full identity into it instead?",
      "Identify someone in your work whose positionality is doing more talking than their identity. What would it take for that to flip?",
      "Where in your work are you rushing to fix versus curious enough to solve? Be honest about which mode is louder.",
      "Whose names live in your inheritance? What do they expect of the work you're choosing to do this week?",
      "Think of the last room where you softened your answer to fit the power in it. What would the unsoftened version have cost, and who pays for the softened one?"
    ],
    body: `<p>There's a particular silence that happens when someone in the humanitarian sector is asked who they are in the room. Not what they do. Not which agency they represent. Who they <em>are</em>.</p>

<p>It's an uncomfortable question because the sector trained most of us to lead with title. Country Director. Programme Coordinator. Senior Advisor for the Something-or-Other Cluster. The vocabulary is professional armour. The minute you take it off, things get political and personal, fast.</p>

<p>Aisha Tambajang came to this conversation prepared to take it off.</p>

<h2>Identity vs Positionality</h2>

<p>The distinction that anchors this episode is one the sector talks around but rarely talks <em>about</em>. Identity is what you bring into the room. Your background, your history, the people whose names live in your inheritance. Positionality is what the room does with you. Where it places you. What it permits you to say. What it expects you to be.</p>

<blockquote>You can have a strong identity and a weak positionality. You can have a weak identity and a strong positionality. Most of the harm in this sector comes from people pretending those two are the same thing.</blockquote>

<p>Aisha is clear: this isn't an academic distinction. It shows up in coordination meetings, in donor calls, in the quiet moment when a national staff member is asked to validate a decision that was already made in another time zone. The room knows where everyone sits. Pretending it doesn't is its own kind of violence.</p>

<h2>Ancestral Responsibility</h2>

<p>One of the most striking ideas in this episode is what Aisha calls ancestral responsibility. The sense that her work isn't only accountable to the present moment but to the people who made her possible, and to the people her decisions will make possible (or impossible) tomorrow.</p>

<p>It's a framing that cuts against the sector's usual time horizon. Logframes work in twelve-month cycles. Strategic plans cap out at five years. Donors want results before the next grant window. Ancestral responsibility says: <em>none of those timelines are mine</em>.</p>

<p>That's not a rejection of accountability. It's a deeper one.</p>

<h2>Rushing to Fix vs Curiosity to Solve</h2>

<p>The sector loves a fix. A pilot. A pivot. A new framework. The annual report is full of them. But Aisha draws a line between rushing to fix something and being curious enough to actually solve it. She argues most of what we call innovation is the former.</p>

<p>Rushing to fix is reactive. It's anxious. It treats the problem as the obstacle to the work. Curiosity to solve is patient. It treats the problem as the work. The difference, she suggests, is whether you trust the people closest to the problem to be part of the answer, or whether you've already decided they're not.</p>

<h2>Leadership in Times of Disruption</h2>

<p>And then the conversation turns, as conversations on this podcast tend to, to leadership. Specifically, leadership when the ground is moving.</p>

<p>The sector is in a disruption phase that nobody wanted and nobody planned for. Funding contraction. Donor consolidation. Geopolitical realignment. The infrastructure of the last twenty years is shrinking faster than the infrastructure of the next twenty is forming. People in leadership positions are trying to hold organisations together while the organisations themselves are quietly asking whether they should.</p>

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
    readTime: '4 min',
    reflections: [
      "What does it cost you to keep your values in your work right now? If the answer is nothing, you probably haven't tested them yet.",
      "Name a decision you made fast this quarter that needed slowness, and one you slow-walked that people are paying for. Which one would you defend in public?",
      "Pick a decision your team made last quarter. Was it idealism, pragmatism, or cynicism dressed up as maturity?",
      "If your work is locally led, who actually decides? Not who consults. Not who is consulted. Who decides.",
      "What's a value of yours that someone else in your organisation pays the cost for, while you don't?"
    ],
    body: `<p>It's rare to interview someone who has spent three decades in this sector and still talks about it with conviction. The maths usually doesn't work. The cynicism accumulates. The compromises stack. The original reason you came in becomes a story you tell new hires at the welcome drinks.</p>

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

<p>The phrase that titles this episode came organically. Ali Al Mokdad was asking how she stayed in the role for so long without burning out. Sofia paused, then said: <em>urgent patience</em>.</p>

<p>The urgency is non-negotiable. People are dying. Systems are failing. The cost of slow is high. But patience is also non-negotiable, because the changes worth making are the ones that take longer than a single tenure, a single grant cycle, a single news cycle. If you are only urgent, you burn out. If you are only patient, you become part of the problem.</p>

<p>The sector keeps choosing one and forgetting the other.</p>

<h2>The Question She Left Us With</h2>

<p>Near the end of the conversation, Sofia turned the question back: <em>what does it cost you to keep your values?</em></p>

<p>Not "do you have values?" Everyone says yes. The harder question. The cost. Because if there is no cost, you haven't tested them. And if you can't name the cost, they probably aren't there.</p>

<p>Three decades in, she could name it. Most people can't.</p>

<p>That, more than the title or the tenure, is what makes her worth listening to.</p>`
  },
  {
    epId: 'nQpnWvOoEio',
    epN: 3,
    slug: 'leadership-under-pressure',
    title: 'Leadership Under Pressure: When the System Stops Working and No One Wants to Say It',
    excerpt: 'There\'s a moment in every sector reform conversation when someone says "we need to be honest." Then everyone leans in. Then no one is.',
    readTime: '4 min',
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

<p>The second is what Ali Al Mokdad calls the grassroots sector. Smaller, mostly national, often newer, frequently informal. This sector is in a different mode entirely. The leaders aren't asking how to preserve. They're asking how to build. The constraints are different. The cost structure is different. The relationship with risk is different.</p>

<blockquote>The institutional sector keeps writing the future of the humanitarian system. The grassroots sector keeps building it. These are no longer the same conversation.</blockquote>

<h2>Reputational Risk Is Doing Most of the Talking</h2>

<p>One thing this episode names that few others do: in many large organisations, reputational risk has quietly become the dominant decision-making logic.</p>

<p>What looks like strategy is often risk management. What looks like principles is often legal. What looks like cautious leadership is often communications worried about the next news cycle. None of this is unreasonable on its own. Together, it produces a kind of paralysis that nobody chose but everyone enacts.</p>

<p>The most interesting question in this episode is whether the sector still has space for leaders who are willing to take principled positions that carry reputational cost. The honest answer the hosts arrive at is: yes, but mostly in organisations small enough that the cost stays containable.</p>

<h2>Identity vs Strategy</h2>

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
    readTime: '3 min',
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

<p><strong>Two:</strong> The word fragments. We stop talking about "the sector" because there is no longer one. We get a humanitarian field, a development field, a localization field, a climate-adjacent field, each with its own identity, donor base, and professional logic. The cluster model dies quietly. New coordination forms emerge.</p>

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
    readTime: '3 min',
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

<p>Political shifts. Shrinking budgets. Power dynamics. Localization. Operational pressure. Leadership that survives versus leadership that lasts. The future of crisis response. The futures, plural. There isn't one.</p>

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
    photoW: 600, photoH: 421,
    initial: 'A',
    name: 'Ali Al Mokdad',
    slug: 'ali-al-mokdad',
    role: 'Co-Host',
    bio: 'Senior Strategic Leader in Global Impact Operations, Governance Reform, and Humanitarian Diplomacy. Author of Quantum Humanitarian. Held multiple senior leadership roles in country operations across some of the hardest displacement contexts of the last decade, moving between field offices and headquarters. Writes openly about the operational pressure most leaders feel but rarely say out loud, and about the distance between what the sector announces and what it actually does.',
    linkedin: 'https://www.linkedin.com/in/ali-al-mokdad/',
    accent: 'cobalt'
  },
  {
    photo: 'assets/host-kim.jpg',
    photoW: 469, photoH: 555,
    initial: 'K',
    name: 'Kim Kucinskas',
    slug: 'kim-kucinskas',
    role: 'Co-Host',
    bio: 'Systems thinker connecting strategy and implementation. Based at Humentum in Washington, working on operational change in international development. Spends her time in the messy middle of organisational change. Interested in the difference between strategy on paper and strategy that actually moves a building. Cares about what equitable, locally-led work looks like once the slides are turned off and someone has to choose. A practitioner who keeps asking who the system is currently designed for.',
    linkedin: 'https://www.linkedin.com/in/kim-kucinskas/',
    accent: 'crimson'
  },
  {
    photo: 'assets/host-thomas.jpg',
    photoW: 437, photoH: 472,
    initial: 'T',
    name: 'Thomas Jepson-Lay',
    slug: 'thomas-jepson-lay',
    role: 'Co-Host',
    bio: 'Independent leadership coach for the humanitarian sector. Former senior operational lead across multiple international NGOs. Eighteen years of senior leadership across some of the most demanding humanitarian environments on earth. Now coaches the people who carry that kind of weight. Brings a calm, irreverent, and structural read on what leadership under pressure actually costs, and what it can still do when most of the certainty has left the room.',
    linkedin: 'https://www.linkedin.com/in/thomas-jepson-lay-1588211b4/',
    accent: 'mustard'
  }
];

// Real channel stats · updated from the YouTube channel
// Total Views as of latest sync (2026-08-11): 87,556
const STATS = {
  episodes: EPISODES.length,
  views: '87,556'
};

// ─── Node export shim ────────────────────────────────────────
// In browsers, this block is silently a no-op (module is undefined).
// In Node (sync script + tests), this lets `require('./data.js')`
// pull the live data. Doesn't affect runtime behaviour at all.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORMS, EPISODES, QUOTES, BLOG_POSTS, TRANSLATIONS, HOSTS, STATS };
}
