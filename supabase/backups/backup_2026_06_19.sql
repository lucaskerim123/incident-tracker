-- Incident Tracker Database Backup
-- Date: 2026-06-19
-- Tables: people (14 rows), incidents (43 rows), users (2 rows), app_settings (8 rows)

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO public.users (id,user_code,email,display_name,role,status,created_at) VALUES
  ('ee4f4365-bd07-44df-9c76-85a244f0528b',1005,'retroreview12@gmail.com','Hoh','admin','active','2026-06-19T02:42:27.206662+00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id,user_code,email,display_name,role,status,created_at) VALUES
  ('b1ea7c6d-80ae-41da-b9a0-1e837e4b0f39',1007,'lucaskerim@gmail.com',NULL,'lawyer','active','2026-06-19T07:43:36.394604+00:00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- APP SETTINGS
-- ============================================================
INSERT INTO public.app_settings (key,value) VALUES ('auto_approve_registrations','true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('feature_cases','true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('feature_documents','true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('feature_incidents','true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('feature_people','true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('help_email','kill@yourself.com') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('help_message','For help bye') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.app_settings (key,value) VALUES ('registration_enabled','true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- PEOPLE (14 rows)
-- ============================================================
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('7c7fabe3-d43e-4a62-b571-f13de3ac2904','ee4f4365-bd07-44df-9c76-85a244f0528b','Bronte Rose Jacobson',NULL,'2004-08-30',$$Bronte was one of the only people there for me during last year.
She was around consistently and helped me get through a lot when everything was falling apart.
She saw me at my worst and didn't walk away.
There was support there that I didn't really have anywhere else at the time.

At the same time, it wasn't clean.
She indirectly played a role in me getting hooked on ice.
So there's a mix there — support, connection, but also damage.
It's not something I can look at one way.

There was also the incident where Laura approached her in public and questioned her about me.
That situation wasn't really about Bronte.
It showed that things were never actually separate, and Laura was still involved and reacting to what I was doing.$$,'confirmed','{"Former fling","Best friend"}','{"Support during collapse period"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('373d4737-8367-4cc4-a0e4-23a4e9c26101','ee4f4365-bd07-44df-9c76-85a244f0528b','Christopher Brandon',NULL,NULL,$$Chris is one of the only people who stayed solid.
He's like a brother to me. I'm part of his family and he's part of mine.

He got dragged into things he never should have been part of.
He represents loyalty and something real that didn't collapse.
One of the only people I fully trust.

He's also one of the main people supporting me through the current period of my life.
Not just historically, but actively now.
When everything else became unstable, Chris stayed consistent.
That matters more than most people probably realise.

He represents stability, loyalty, and the few relationships in my life that still feel genuine and real.$$,'confirmed','{"Best mate"}','{"Brother figure","Current support person","Witness"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('d265d0f4-d16c-4f5d-ad6b-20de4efb6141','ee4f4365-bd07-44df-9c76-85a244f0528b','Evelyn Woods',NULL,'2020-03-05',$$Evelyn is the most important person in my life.
She was my daughter in every way that mattered.
She gave my life meaning, direction, and something real to live for.

Losing access to her is the deepest damage I carry.
What I miss isn't just seeing her — it's being her dad.

She represents the best and most real part of my life.
Losing her feels like losing the reason my life held together.$$,'confirmed','{"Daughter of Laura Woods and Luke Kerim"}','{"Core emotional bond","Primary source of purpose"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('603e0e5e-3a6d-4e0e-a0c3-b4855e24619a','ee4f4365-bd07-44df-9c76-85a244f0528b','Jade Greenaway',NULL,'1999-07-15',$$Jade represents the relationship immediately before Laura.
She is tied to grief, family loss, and a version of my life before the Laura chapter began.

Around 2017 we began talking heavily while I was in Tamworth and she was in Sydney.
After a period of talking, Jade came to Tamworth to stay.
At first the connection was more casual, but it developed into a real relationship and emotional bond.

Jade was present during a major grief period when my uncle passed in 2018, which made her part of an important and painful chapter of my life.

During the later stages of the relationship, I was angry, unstable, and not in a good mental state.
The relationship began to deteriorate while I was in what I describe as a weird and difficult part of my life.

Jade later formed a relationship with Sam Peters, who had been my best mate at the time.
I feel that I somehow pushed Jade and Sam together without meaning to, and I accept some responsibility for the way things broke down.

Her relationship with Sam represents the loss of both a partner and a best mate in the same period.
It also creates a painful comparison because Sam and Jade now have a family and two children together while my own life and family structure collapsed.

Jade is not central to the current Laura and Evelyn conflict, but she remains relevant because she sits directly before that chapter and connects to the older emotional damage underneath it.$$,'confirmed','{"Former partner of Luke Kerim","Current partner of Sam Peters"}','{"Mother of two children with Sam Peters","Associated with the 2017–2019 relationship period","Present during the 2018 grief event — Luke''s uncle''s passing","Linked to early emotional instability phase"}','AVO condition 2 (no contact) has been removed',NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('dca85f4f-a01f-44e8-bf25-60ffc6805a53','ee4f4365-bd07-44df-9c76-85a244f0528b','Jayana Mangan',NULL,NULL,$$Jayana isn't a central figure, but she became part of the situation through allegations and conflict.

Her name became tied to the Manilla Show situation and the early escalation that followed.
Laura alleged Jayana had been present, which I denied, and that allegation became part of the confusion and pressure around Evelyn being returned that day.

She represents how quickly things became messy and how other people got pulled into something that should have stayed contained.$$,'confirmed','{"Associated individual"}','{"Indirect involvement","Connected to Manilla Show allegation / early escalation"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('6e72708c-f19f-4532-853c-760b347a0f9f','ee4f4365-bd07-44df-9c76-85a244f0528b','Jesse Kerim',NULL,NULL,$$Jesse is tied to one of the worst moments of my life.

He was there after Evelyn was removed on 15 March 2025 and saw how badly I collapsed.
He physically intervened when I accessed the firearm, and that matters because he was one of the only people directly present when everything went from emotional pain into an acute crisis.

He represents family being pulled into the most dangerous part of the collapse.
He also represents the reality that some people saw how bad it actually got, not just the version that exists on paper.$$,'confirmed','{"Brother"}','{"Witness to March 2025 mental health crisis","Immediate intervention figure"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('d1522f97-6fc6-4fcc-90ea-27951dd63286','ee4f4365-bd07-44df-9c76-85a244f0528b','Laura Woods',NULL,'1997-09-18',$$Laura is one of the main reasons my life collapsed. But it didn't start that way.

When we got together, she was already pregnant.
From the beginning, it wasn't just a relationship — it was stepping straight into a family.
When Evelyn was born, everything felt real. We had something that actually mattered.

2020 into 2021 wasn't all bad. There was stability there. There was a real family.
That's what makes everything after it hit harder.

Over time, things started to change.
Affection dropped off. Closeness faded.
It slowly turned into distance, tension, and confusion.

Then after the separation, everything got worse.
It turned into a cycle:
- pulling me in
- pushing me away
- mixed signals
- keeping me close while also moving on

Shane was there before things were properly over.
I was questioning it and getting made to feel like I was overthinking or crazy.
Then everything I questioned turned out to be real.

What makes it worse is what she confirmed about him — and still choosing him anyway.
From my perspective, that says everything.

She let him sit in the middle of everything, influence things, and be protected, while I got pushed out and blamed.
She held me to one standard while excusing Shane under another.
She made decision after decision that cut me out of my own life.
Access to Evelyn became part of that.

Even after everything, there were periods where contact came back — like May to August 2025 — where she acted normal, like nothing had happened.
Then it was cut off again.
That constant switch — in and out — did more damage than a clean break ever would have.

She represents: betrayal, instability, manipulation, double standards, the collapse of everything.$$,'confirmed','{"Mother of Evelyn Woods","Former partner of Luke Kerim","Former partner of Sam Peters","Currently engaged to Shane Carter"}','{"Central figure in relationship cycle (build → breakdown → conflict)","Connected to early 2019 DV incident with Sam Peters"}','AVO against Laura Woods has been withdrawn and dismissed',NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('f2561948-f927-49ea-93a4-d130ac3dd499','ee4f4365-bd07-44df-9c76-85a244f0528b','Luke Kerim',NULL,'1998-08-07',$$I am the one left carrying everything.
Not just what happened, but what it turned into.
The damage, the anger, the loss of identity, and the feeling that my life got reduced to its worst moments.

When Evelyn was born, everything became real.
I was there. I cut the cord. When she opened her eyes, they opened on me.
From that point on, I wasn't just around — I was her dad in every way that mattered.

That period — 2020 into 2021 — was real.
It wasn't perfect, but it was stable. It was a family.
I had purpose, direction, something solid to build on.
Then everything started breaking down slowly.

I know I wasn't easy to be with.
I was angry, reactive, and I said things I shouldn't have.
I put pressure on the relationship and I played a role in how bad things got.
But at the same time, I stayed because walking away didn't just mean losing Laura — it meant losing Evelyn.
So I held on longer than I should have, even when things were already collapsing.

Losing Evelyn didn't just hurt — it stripped the foundation out from under me.
Everything since then feels like aftermath. Like I'm still here, but not living the life I built.
Mentally, I feel worn down, burnt out, and disconnected from who I used to be.

The truth underneath everything is simple: losing Evelyn destroyed me.$$,'confirmed','{"Father of Evelyn Woods","Former partner of Laura Woods","Former partner of Jade Greenaway"}','{"Primary father figure from birth","Present at Evelyn''s birth and cut the cord","Central subject of collapse","Loss of identity and role"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('2b7f2be8-2dbd-4819-830d-81bf3ac60c40','ee4f4365-bd07-44df-9c76-85a244f0528b','Melanie Kerim',NULL,NULL,$$Melanie represents loyalty.
She also represents how far everything spread beyond just me.
Support is there, but so is the reality others got dragged into it.$$,'confirmed','{"Sister"}','{}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('ac4da57d-febb-42cf-997e-5714642e0850','ee4f4365-bd07-44df-9c76-85a244f0528b','Samuel Peters',NULL,'1997-02-22',$$Samuel Peters was one of my closest friends from Year 7 onward and was someone I considered like a brother for a large portion of my life.

Samuel Peters later entered a relationship with Laura Woods and got her pregnant with Evelyn Woods.
Their relationship later broke down following a reported DV-related incident.

Around the broader surrounding period:
- my relationship with Jade Greenaway ended
- tension developed between me and Sam involving Jade
- me and Sam eventually fought over the situation

Months later:
- Sam entered a relationship with Jade Greenaway
- I later entered a relationship with Laura Woods

This created long-term emotional crossover between friendship, former partners, parenting, loyalty, and family structures throughout the wider project system.

Samuel Peters is consistently identified as the biological father of Evelyn Woods.
However, from my lived perspective, Sam never fully stepped into the actual day-to-day father role regarding Evelyn.

I was the person: present during birth, involved in the upbringing, involved in daily parenting life, emotionally bonded with Evelyn, functioning inside the family structure with Laura.

The distinction between biological fatherhood and lived fatherhood is one of the strongest emotional themes connected to Samuel Peters.

Despite the history and complications between us, me and Sam began talking again toward the end of 2025.
Since reconnecting, things have generally been going okay between us so far.
There are still unresolved issues and lingering complications that need to be worked through, but the relationship is no longer at the same level of conflict that existed previously.$$,'confirmed','{"Biological father of Evelyn Woods","Former partner of Laura Woods","Current partner of Jade Greenaway","Former best friend of Luke Kerim"}','{"Relevant to Family Court parenting matters","Year 7 friendship connection with Luke Kerim","Former brother-like figure","Relationship crossover figure","Parenting-system overlap","Communication affected by third-party AVO conditions"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('fb874dce-d155-4e78-b991-836ecb596ab9','ee4f4365-bd07-44df-9c76-85a244f0528b','Shane Carter',NULL,NULL,$$Shane isn't just some random partner Laura moved on with.
He had been in Laura's life for years before me. From what I understand, over 10 years.
He was around from before Sam, back when Laura was with Affleck, and she was neighbours with him.

That matters because he wasn't someone new. He was already there in the background.

From my perspective, Shane got in the way purposely.
He inserted himself. He interfered.
He made himself part of things that should have been between me and Laura.
He literally banned me from their house.
That alone shows what his role was.

He wasn't sitting back respectfully — he was actively involved, actively blocking, and actively creating distance.

Shane is one of the legitimate reasons me and Laura didn't work.
Laura was obsessed with him. No matter what was happening between me and her, he was still there.
Still protected. Still chosen. Still sitting in the middle of everything.

He had already had an AVO with Laura before — what I understand as the "drinking AVO."
He breached it twice and was on the run, yet he was still allowed back around Laura and inside the house.
And worse than that, he was still allowed around Evelyn.

While I was pushed out, restricted, blamed, and made to feel like I was unsafe, he kept being let back in.
That shows a massive double standard.
I was judged by my worst moments. Shane was excused through his.

The worst part is the allegation she confirmed.
I didn't hear some random rumour and just go off.
I heard something serious, sat with it, and brought it up properly because I cared about Evelyn and was acting from a father's position.
Laura confirmed it. She said it happened. She said the girl lied about her age. She said he didn't get charged.
But from my perspective, it still should have mattered. Especially as a mother.
Instead she stayed. Chose him. Defended him.

He represents: replacement, interference, double standards, being pushed out, humiliation, Laura choosing him over the family, serious concerns being ignored, being treated as the problem while he was excused, Evelyn being around someone I saw as unsafe.$$,'confirmed','{"Engaged to Laura Woods","Former neighbour of Laura Woods"}','{"Long-term background figure in Laura''s life (10+ years)","Connected from before Sam Peters","Central third-party in relationship breakdown","Direct interference figure","Symbol of replacement / humiliation","Associated with confirmed allegation (as stated by Laura)","History of AVO with Laura Woods (drinking AVO)","Breach history and continued access"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('bcc3b12a-c64d-42e6-9448-6dff093be9c2','ee4f4365-bd07-44df-9c76-85a244f0528b','Sonya Kerim',NULL,NULL,$$Mum represents support, but also guilt.
She got dragged into things she never should have been involved in.
There's love there, but also the weight of knowing my situation affected her.$$,'confirmed','{"Mother"}','{}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('195c50a8-df9b-4858-aaa2-8ce151b09b48','ee4f4365-bd07-44df-9c76-85a244f0528b','Tina Kerim',NULL,'1996-10-19',$$Tina represents stability.
She's someone I've had to rely on when everything else fell apart.
At the same time, she's tied to moments where everything spilled into family.$$,'confirmed','{"Sister"}','{}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.people (id,user_id,name,role,dob,notes,status,labels,associate_labels,legal_update,profile_url,bio,legal_notes) VALUES ('593655c3-3446-4490-956f-e98fd44012c5','ee4f4365-bd07-44df-9c76-85a244f0528b','Zoe Sheddan',NULL,'2002-10-18',$$Zoe represents one of the most immediate and natural connections in my life.

When we met around 2016 — I was 16 and she was 14 — we clicked straight away and became instant best friends.
There wasn't a gradual build with her; it was just an immediate familiarity and comfort that stayed consistent for a long time.

With Zoe specifically, there's a long history of going through a lot of heavy stuff together.
It's not just a surface-level friendship — it's more in the category of having been through real situations, stress, change, and emotional ups and downs side by side over years.

There has also always been an emotional layer underneath it.
I had a strong crush on her at different points, but it was more than just that — it was a deeper attachment and care for her as a person.
At the same time, I was always able to remain her best friend without forcing it into anything else, even when there were moments where that boundary almost shifted a few times.

Recently, things have been strained.
We've both been in difficult places, and there's been a major fight that's put the friendship under real pressure.
We are currently trying to repair it, but the situation is unstable and it's not clear where it will land.

She sits in the system as:
- instant best friend connection
- long-term shared history and experiences
- emotionally significant attachment
- unresolved but controlled romantic tension
- currently strained friendship with attempted repair underway$$,'confirmed','{"Best friend"}','{"Sister like friendship","Longest crush"}',NULL,NULL,NULL,NULL) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INCIDENTS (43 rows)
-- ============================================================
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('b4547de3-b543-4ba7-b3ae-78c6498442bd','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-03-15','Manilla Show — Allegations, Police Attendance, Evelyn Removed','police','Luke and Christopher Brandon organised a trip to the Manilla Show for the group: Luke, Chris, Daymon, Danika, Myah, and Evelyn Woods. Laura Woods was working at Southgate Inn; Jayana Mangan was not present at any time during the day.

The group attended rides and carnival activities. After lunchtime they returned home.

That afternoon, after Luke posted a Facebook photo of the group, Laura contacted Luke alleging Jayana had been present at the show. Luke denied this. Laura demanded Evelyn be returned within approximately 15 minutes. Luke queried the reason and noted the timeframe was impracticable.

Laura threatened police; Luke also called police. Police attended and remained at the top gate of the locked property. Evelyn was with Gary (roommate) further down the driveway. Jesse Kerim attended and stayed with Luke.

A heated argument occurred between Luke and officers. One officer told Luke to "shut up and listen", which significantly escalated Luke''s emotional state. Police advised Luke that as he was not Evelyn''s biological parent, Laura did not need to provide a reason for return. Luke reluctantly handed Evelyn over.','{"Luke Kerim","Christopher Brandon","Evelyn Woods","Laura Woods","Jesse Kerim"}',NULL,NULL,'documented',NULL,'Manilla, NSW','high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('ba9af2b9-69e4-4054-a64c-d92f3b039f82','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-03-15','Mental Health Crisis — Firearm Incident, Banksia Admission, AVO Served','mental_health','After police departed and Evelyn was removed, Luke experienced an acute mental health crisis. Luke accessed his father''s gun safe, loaded a firearm, and pointed it at himself. Jesse Kerim saw this and physically tackled Luke, removing the firearm.

Luke then consumed unknown pills and was admitted to Banksia mental health facility.

While admitted to Banksia, Luke was served with an Apprehended Violence Order (AVO).','{"Luke Kerim","Jesse Kerim"}','Upon release from Banksia, Luke was arrested for unlawful firearm possession and released on bail several hours later. The firearm matter was later dismissed under section 14.',NULL,'documented',NULL,'Manilla, NSW','critical',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('28fb561e-9108-4456-bfeb-a0aca4d7bfb9','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-05-01','Alleged AVO Breach — Message Sent by Luke''s Mother, Luke Charged','avo','At the time of this incident, Laura Woods and Luke''s mother were communicating normally via text message. The communication had been ongoing and was not hostile in nature. Luke was not involved in these messages and was not directing, encouraging, or facilitating the contact.

During the course of this normal text conversation, Luke''s mother made an error in judgment by sending a message that should not have been sent.

Laura immediately seized on this message and reported it to police as an alleged breach. Luke''s mother took responsibility for the message and identified herself to police as the sender. The message was not sent by Luke, was not sent at his request, and did not originate from Luke.

Despite this, the incident was treated as a breach attributed to Luke, and Luke was subsequently charged.','{"Luke Kerim","Laura Woods","Sonya Kerim"}',NULL,NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('875a53d2-009a-4b18-af37-26571a1efb85','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-05-03','Laura Initiates Contact and Regular Visits Despite AVO Conditions','other','Approximately two days after the alleged AVO breach involving Luke''s mother, Laura contacted Luke from a private number. Laura asked Luke to see Evelyn and requested that visits be organised. Laura initiated and arranged these visits herself, despite being aware that AVO conditions restricted contact.

Because of the AVO, the visits were arranged carefully, cautiously, and discreetly. Initially visits occurred once per week. Over time they increased to two to three times per week, lasting several hours at a time. Visits took place in public locations, including Kids Zone and parks. Laura was present for the entirety of every visit.

During this period: Laura showed no fear, no concern for safety, and no indication that Luke posed any risk. Laura behaved as though nothing had happened previously, acting calm, friendly, and cooperative.','{"Luke Kerim","Laura Woods","Evelyn Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('16bb6fb3-d83b-464c-b13d-b3ded46ad6fe','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-06-15','Mental Strain Intensifies — Substance Use Begins During AVO-Restricted Visits','mental_health','As the visits continued, Luke''s mental strain steadily increased. The AVO conditions were never amended, despite Laura continuing to initiate and attend visits. This created constant anxiety for Luke.

Luke was aware that the visits were technically inconsistent with AVO conditions and that they could be used against him at any moment or abruptly withdrawn. Luke lived in a constant state of hyper-vigilance, worried that the same conduct Laura was encouraging could later be characterised as wrongdoing.

As Luke''s anxiety intensified, he began using substances in an attempt to slow his thoughts, reduce paranoia, and cope with the ongoing mental overload. Rather than stabilising his condition, substance use worsened paranoia, impaired judgment, and reduced emotional regulation.','{"Luke Kerim","Laura Woods","Evelyn Woods"}',NULL,NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('c76e114a-6c4c-490b-9a55-6bb6f61941f4','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-07-15','Substance Disclosure to Laura — Cooperation Breaks Down, Final Visit 6 August','other','By mid-July 2025, Luke''s mental state had deteriorated further. Luke openly disclosed to Laura that he was using substances and struggling significantly with his mental health. Luke asked Laura for time to stabilise and requested that contact with Evelyn be restricted initially.

At first, Laura was supportive and understanding. She reassured Luke and appeared to acknowledge the seriousness of his mental state. However, this attitude changed abruptly.

Laura suddenly accused Luke of choosing substances over his daughter and being a "deadbeat". Communication rapidly deteriorated into hostile and emotionally charged arguments.

Despite the conflict, visits continued briefly. The final visit with Evelyn occurred on 6 August 2025. After this visit, Laura cut off contact.','{"Luke Kerim","Laura Woods","Evelyn Woods"}',NULL,NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('d494c8cb-3790-4ddf-a935-ed5638c8351e','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-08-07','Birthday — Car Accusation, Methamphetamine Psychosis, AVO Breach Charged 13 Aug','mental_health','On 7 August 2025 (Luke''s birthday), communication continued via hostile text messages. Luke was accused by Laura of attempting to run Shane Carter and Evelyn off the road. There was no police attendance or police involvement in relation to this allegation. Luke denied the allegation and provided information demonstrating it was not him.

Following this, Laura went silent and ceased responding. At this point: Luke had not slept properly for weeks; substance use had escalated; his mental health was severely compromised. Laura''s sudden silence triggered a significant psychological collapse.

Between 7 and 13 August 2025, Luke entered a methamphetamine-induced psychosis. During this period: Luke experienced paranoia, rage, and loss of emotional control; his thinking was disorganised; he was unable to stop messaging Laura, despite knowing it would make things worse.

Luke acknowledges that his behaviour during this period occurred while he was not mentally well and not thinking clearly.','{"Luke Kerim","Laura Woods","Shane Carter","Evelyn Woods"}','On 13 August 2025, Luke was charged with a breach.',NULL,'documented',NULL,NULL,'critical',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('02f0d678-4b6c-4959-92ef-b54a267a7b68','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-08-21','Taxi Customer Pick-Up Near Laura''s Workplace — No Breach Established','police','On 21 August 2025, Luke picked up a taxi customer from Laura''s workplace while compliant with AVO and bail conditions. Laura verbally abused Luke''s sister and contacted police. No breach was established.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,'Tamworth, NSW','low',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('42549cf2-e656-45ee-8ab0-87c8dffe80d9','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-08-22','Laura''s TikTok Harassment Campaign Targeting Luke (22–27 August)','other','Between 22–27 August 2025, Laura repeatedly changed TikTok accounts to post content targeting Luke and attempted to manipulate Luke''s sister. Multiple attempts to breach Luke legally during this period failed.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('8b42f09f-454d-4f04-af6e-2040f8ece79d','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-09-21','Drive-Past Verbal Abuse at Christopher Brandon''s — Police Non-Attendance, Luke Arrested','police','On 21 September 2025, Luke was at the front lawn of Christopher Brandon''s house with Chris and Myah (Chris''s child).

While Luke and Chris were outside, Laura Woods deliberately drove past. Laura was a passenger in her own white Toyota Prado, driven by Shane Carter. Evelyn Woods was seated in the back.

As the vehicle passed: Laura leaned out of the passenger window, began verbally abusing Luke and Chris, and yelled words to the effect of "You both can go fuck yourselves, you dogs." Laura also made multiple obscene gestures, including repeatedly raising her middle finger.

Luke and Chris were confused and deeply concerned that Evelyn was present during this incident.

Luke and Chris attempted to contact the local police station; their calls were not answered. They contacted 000. Over the course of approximately two hours multiple calls were made; calls were eventually answered by Constable Matt Smith; Luke and Chris were repeatedly told words to the effect of "maybe tomorrow". Despite the ongoing calls and the nature of the incident, police did not attend.

There is no viable footage or audio of Laura''s verbal abuse during the drive-past.

Later that evening, while driving home past her workplace, Luke retaliated emotionally by making an obscene gesture. Luke acknowledges this behaviour occurred while he was already distressed.','{"Luke Kerim","Christopher Brandon","Laura Woods","Shane Carter","Evelyn Woods"}','Luke was subsequently contacted by Constable Matt Smith and arrested for an alleged breach of bail / AVO. Luke was released the following day, banned from Tamworth, and bailed to his sister''s residence in Sydney.',NULL,'documented',NULL,'Christopher Brandon''s residence, Tamworth NSW','high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('4f2f2d30-a4bc-4850-8dfc-b43229cdf1c4','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-09-28','Ongoing Harassment Via Calls/Messages While Laura Actively Avoided AVO Service (28 Sep–25 Oct)','avo','From 28 September 2025 through to 25 October 2025, Laura continued to harass Luke via phone calls and messages. This occurred while Laura was actively avoiding service of the AVO.

Luke experienced this period as extremely distressing, as: the conduct that led to the AVO was continuing, and the order was not yet enforceable due to service delays.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('3363c16c-60bb-46d2-94da-b31eb729507c','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-19','AVO Granted Against Laura Woods at Approximately 5:40 PM','avo','On 19 October 2025 at approximately 5:40 PM, an Apprehended Violence Order (AVO) was granted against Laura Woods. The application was progressed by Senior Constable Dana following a series of emails and ongoing communications that Luke believed were being sent by Laura Woods.

The matter was listed for hearing at Parramatta Local Court on 21 October 2025.

Subsequently, the matter did not proceed to a defended hearing. Senior Constable Dana later advised that police were unable to conclusively prove that Laura Woods was responsible for sending the emails relied upon in the application.','{"Luke Kerim","Laura Woods"}','The AVO application against Laura Woods was formally withdrawn on 10 February 2026.',NULL,'documented','17:40:00',NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('288fb7b8-0e3a-4c6b-a1e1-c9ac307f102b','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-20','Laura Contacts Granville Police, Abuses Staff, Admits Avoiding AVO Service','avo','On 20 October 2025, Laura contacted Granville Police Station. During that call Laura abused police staff and admitted that she was actively avoiding being served with the AVO. This call occurred while Luke believed the AVO process was underway and should have been progressing toward enforceability.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,'Granville Police Station','medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('fd25f66e-a2a5-41a2-afd7-8202415fad48','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-21','Tamworth Police Incorrectly Record AVO as Served — Luke Relies on Inaccurate Advice','avo','On 21 October 2025, Tamworth Police initially recorded or indicated that Laura Woods had walked into the police station and that the AVO had been served and was enforceable. Luke relied on this information. It later became clear that this information was incorrect, and that the AVO had not in fact been served at that time.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,'Tamworth Police Station','medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('3dfe57c3-3510-47dc-ab18-c7784e64a8cc','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-24','AVO Against Laura Woods — Actually Served at Approximately 1:00 PM','avo','On 24 October 2025 at approximately 1:00 PM, Laura was actually served with the AVO. This was the first point at which the AVO became capable of being enforced.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented','13:00:00',NULL,'low',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('ba076efd-4ca3-4152-8ea1-06490d880f21','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-25','Laura Calls Melanie Kerim at 12:13 AM — AVO Not Yet Enforceable at Time of Call','avo','On 24 October 2025 at approximately 6:00 AM, prior to service, Luke contacted police to confirm whether the AVO was enforceable and was advised it was not yet enforceable.

At 12:13 AM on 25 October 2025, Laura attempted to call Luke''s sister, Melanie Kerim. Melanie''s local police station later confirmed that at the time of this call, the AVO against Laura was still not enforceable.','{"Luke Kerim","Laura Woods","Melanie Kerim"}',NULL,NULL,'documented','00:13:00',NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('75bc325b-2a20-4c83-a7d4-5487584a3ec8','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-27','Batch 5 — Seven Recorded Police Events Under Case C100740160 (Oct–Dec 2025)','legal','Seven recorded police events under combined case number C100740160, Officer in Charge: Constable Jesse Gordon:
1) 27 October 2025 — E184183202
2) 28 October 2025 — E103595280
3) End October 2025 — E88611567
4) 19 November 2025 — E184675902
5) 25 November 2025 — E101810504
6) 3 December 2025 — E102901554
7) 6 December 2025 — E85910813','{"Luke Kerim"}',NULL,'C100740160','documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('5ef66287-174a-415c-83fc-0a8ee1baadd1','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-10-29','Luke Reports Breaches — Police Take No Action, Investigation Focus Shifts to Luke','police','Between 29 October and 1 November 2025, Luke continued to report breaches and raise concerns regarding Laura''s conduct. During this period: Tamworth Police took no substantive action on Luke''s reports, and the focus of investigation shifted away from Laura''s conduct and onto Luke.

Later, Granville Police acknowledged that there had been procedural issues, including: an incorrect phone number being entered, and other administrative errors that affected how Luke''s complaints were recorded and handled.','{"Luke Kerim","Laura Woods"}',NULL,'C100740160','documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('cfb9d5aa-dc4f-44eb-abc6-bea1c694fb06','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-11-05','TikTok Story Posted in Frustration — Laura Reports to Police as Harassment','police','After Luke was told there was a new charge or allegation relating to an alleged 9 October 2025 phone call, Luke posted a TikTok story out of frustration. The wording of the story was: "Now using my kid against me, how pathetic mother".

The post: did not name Laura; did not identify her directly; and did not involve direct contact.

Laura reported the TikTok story to police as harassment. As a result, Luke was contacted and told to attend Granville Police Station for an interview on 6 November 2025.

Once Luke became aware that the story had been complained about, he removed it voluntarily.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('131453c1-aeb6-4e09-a5d9-566681a3534a','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-11-06','Granville Police Interview (TikTok Complaint) + LECC Welfare Check at Tina''s Residence','police','On 6 November 2025, Luke attended Granville Police Station for an interview with Senior Constable Dana, relating to the TikTok complaint and ongoing breach matters.

While Luke was at the station, other officers attended the home of Luke''s sister, Tina Kerim, to conduct a welfare check. The welfare check was requested by the Law Enforcement Conduct Commission (LECC) following concerns raised about wording in an email Luke had sent to police.

Police attended Tina''s residence, spoke with her and/or others present, and determined that: there were no safety issues, and there was no immediate risk. The welfare check appeared to be recorded as an administrative follow-up, rather than a criminal or emergency response.','{"Luke Kerim","Tina Kerim"}',NULL,NULL,'documented',NULL,'Granville Police Station','medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('77321842-6ae3-4367-8f1e-aba4609efbaa','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-11-06','Laura''s Breach Files Returned for Correction — Wrong Phone Number Error Discovered','legal','On 6 November 2025, Luke was informed that the breach files relating to Laura Woods had been sent back for further investigation and correction. It was discovered that a previous officer had entered the wrong phone number into one of the reports, which affected how the matter was recorded and handled.

Inspector Rachel Wynter and Senior Constable Dana advised Luke that: the matters were still active; the files had been sent back to be fixed; and the investigation into Laura''s breaches was continuing and not closed.

Luke continued to comply with his daily bail reporting requirements during this period. The outcome of the breach investigations remained pending.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('e936262f-21cc-4485-a7f8-ac014dc3a490','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-11-12','All Linked Matters Consolidated Under Constable Jesse Gordon (Case C100740160)','police','On 12 November 2025, Luke was advised that the breach and harassment file had been transferred back to Tamworth Police Station and assigned to Constable Jesse Gordon.

On the night of 12 November 2025, Constable Gordon called Luke and stated that Luke''s matters had gone through too many hands and he would now be taking responsibility for all linked matters. Constable Gordon told Luke that whoever was actually in the wrong would be charged after a proper review, and that he was waiting on call records and other information before making decisions.

He advised that the combined police case number for all linked events was: C100740160.

Luke felt conflicted during this call: he believed that, given his past experiences with Tamworth Police, it may still end up being him who is charged; however, he was relieved that the file was no longer being bounced between officers.','{"Luke Kerim"}',NULL,'C100740160','documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('a7080f9d-4f2e-435e-a231-b37f11517151','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-11-14','Unprofessional Conduct by Officer During Bail Reporting at Granville Station','police','On 14 November 2025, Luke attended Granville Police Station to report for bail as required. The constable at the counter had a noticeable grin from the outset and was testy and confrontational for no apparent reason.

During the interaction, the constable said words to the effect of: "You''re either a good liar or some…" — Luke did not hear the remainder of the sentence.

Luke responded: "So you know about our case then?" The constable replied: "No."

The exchange felt unprofessional, confusing, and inappropriate given Luke was only present to comply with bail conditions.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,'Granville Police Station','low',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('ed328270-ee1f-4fe6-bc6f-59cbd1136dc1','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-12-03','Section 14 Application Refused — 12-Month Intensive Correction Order Imposed','court','On 3 December 2025, Luke''s section 14 application was refused and convictions were recorded. A 12-month Intensive Correction Order was imposed. One phone-call matter remained contested. Luke contacted police in late December seeking clarification. Police stated the matter was progressing. Luke disputed reliance on historical call records.','{"Luke Kerim"}','12-month Intensive Correction Order imposed. One phone-call matter remained contested.',NULL,'documented',NULL,NULL,'critical',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('2c144310-3edf-4851-bc3a-c30c7ebc6649','ee4f4365-bd07-44df-9c76-85a244f0528b','2025-12-28','Year-End Status Update — Call Record Dispute (0434 646 203, ~400+ Calls Alleged)','legal','Luke Kerim contacted Tamworth Police Station and Granville Police Station seeking an official update and was advised the case is progressing.

Luke Kerim was informed that Constable Jesse Gordon is reportedly relying on call history associated with the phone number 0434 646 203, with an assertion of over 400 outgoing calls attributed to Luke Kerim.

Luke Kerim disputes the relevance of this material. The number 0434 646 203 was Laura Woods'' primary contact number from 5 March 2022 until the end of August 2025 and relates largely to lawful relationship and family contact. Luke Kerim was already breached in August 2025 in relation to contact involving this number.

Also on the same day, Luke Kerim sent two emails to Constable Jesse Gordon requesting an update and providing clarification regarding the historic nature of the phone number.','{"Luke Kerim"}',NULL,'C100740160','documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('0c453186-1f51-4164-9793-2404f60f2a1d','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-01','Investigation Status Update — AVO Breaches by Laura Under Technical Analysis','police','Luke Kerim spoke with Constable Schofield of Tamworth Police regarding the status of investigations into reported AVO breaches by Laura Woods. He was advised that the investigation remained ongoing, including technical enquiries such as IP address analysis and location-based tracking. No enforcement outcome was communicated at that time. Luke Kerim remained fully compliant with all court orders and reporting obligations.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,NULL,'low',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('5eb9cc8f-62a9-4cb0-8967-efc894512fc6','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-05','Attendance at Liverpool Police Station — Dispute ~500 Call Allegation (Aug–Sep 2025)','legal','Luke Kerim attended Liverpool Police Station to obtain and review charge documentation relating to allegations of approximately 500 calls between August and September 2025.

Luke Kerim disputed the accuracy of these allegations, noting: the aggregation of SMS and call data into a single figure; inclusion of periods where AVO conditions were not active; failure to account for incoming contact initiated by Laura Woods.

This formed part of an ongoing dispute regarding the reliability and interpretation of call data relied upon by police.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,'Liverpool Police Station','medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('e9378083-3ddc-454e-91d6-fe33755b54df','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-06','Email Dispute of Call-Data Allegations — Constable Gordon: Matter for the Magistrate','legal','Luke Kerim corresponded with Constable Jesse Gordon disputing the call-data allegations. Constable Gordon advised that police were unable to reconcile the discrepancies and that the matter would ultimately be determined by the Magistrate.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('5799c683-9e94-4544-ac67-b725d698f907','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-07','No Enforcement Action on Laura''s Reported Breaches — Luke Remains Compliant','legal','As at this date, no enforcement action or clarification had been provided in relation to the reported breaches by Laura Woods. Luke Kerim remained compliant with all bail and court conditions.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'low',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('c17ea427-c753-4992-8c8d-f956ce8e86fb','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-08','Anonymous Harassing Text Referencing New Charges — Police Attend (Liverpool)','police','Luke Kerim received an anonymous text message containing taunting language referencing new charges. Luke Kerim contacted Liverpool Police. Police attended and recorded the matter under an event number. The message formed part of a pattern of ongoing anonymous harassment.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('d03013ec-061a-4f9a-a896-eff61fda0e7d','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-10','Anonymous Threatening Text with External Link — References Evelyn Woods by Name','other','Luke Kerim received a further anonymous message directing him to an external link containing threatening content. The content referenced police inaction, legal matters, and Evelyn Woods by name. The matter was reported to police and formally recorded.','{"Luke Kerim","Evelyn Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('638144b3-df00-42c2-ac4a-950f46f15073','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-11','Social Media Posts Alleging Harassment and Threats — Screenshots Preserved','other','Luke Kerim was notified of social media posts alleging harassment and threats. Screenshots of the content were preserved for evidentiary purposes.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('379fcb14-54dc-4067-8829-5aa8efe56bfd','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-11','9 Consecutive Missed Calls from International Number (8:56–8:58 PM)','other','Between approximately 8:56 PM and 8:58 PM, Luke Kerim received nine consecutive missed calls from an international number. Calls were not answered.','{"Luke Kerim"}',NULL,NULL,'documented','20:56:00',NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('491072f3-6b9b-453f-97d8-6b832c149c1d','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-12','11 Missed Calls from International Number (2:55–2:56 AM) — Repeated Pattern','other','Luke Kerim identified eleven missed calls from the same international number between approximately 2:55 AM and 2:56 AM. This formed part of a repeated pattern of contact from unidentified sources.','{"Luke Kerim"}',NULL,NULL,'documented','02:55:00',NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('11ce5700-a455-48be-82d7-fac714236529','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-14','Police Attend Re Workplace Contact Allegations — Luke Disputes, No Arrest','police','Police attended Luke Kerim''s residence again regarding allegations of workplace contact. Luke Kerim disputed the allegations, stating any contact occurred prior to AVO service or on 29 September 2025. No arrest was made.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('b72d3c28-abfb-4b9e-bdb6-352faddb6488','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-14','Constable Gordon Advises ~2 Charges Expected Against Laura for AVO Breaches','legal','Luke Kerim spoke with Constable Jesse Gordon for approximately 20 minutes. Constable Gordon advised that charges against Laura Woods were expected in relation to approximately two breaches. He noted that Liverpool-based matters may not yet have been received.','{"Luke Kerim","Laura Woods"}',NULL,NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('8210be38-5b47-4d08-befa-a27c15474f22','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-14','Police Welfare Check — Involuntary Detention Under Mental Health Powers, Released Same Day','mental_health','Five police officers attended Luke Kerim''s residence following a reported welfare check. Luke Kerim stated he was distressed but not suicidal and was not requesting assistance. Police detained him under mental health powers and transported him to hospital by ambulance. He was released the same day. No charges were laid.','{"Luke Kerim"}','Released same day. No charges laid.',NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('e697a754-8579-4794-80f9-860320c91669','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-15','Arrested for TikTok AVO Breach — Bail Refused at Station and Court — Remanded in Custody','legal','On or around 7 January 2026, Laura Woods posted content on TikTok which Luke Kerim interpreted as targeted baiting and provocation. In response, Luke Kerim made a TikTok post addressing the situation. The post did not name Laura Woods directly and did not involve Evelyn Woods. The content referred to allegations involving Shane Carter and was made during a period of significant stress.

This interaction was later treated by police as a breach of AVO conditions relating to social media.

On 15 January 2026, police attended Luke Kerim''s residence and arrested him. Luke Kerim was transported to Liverpool Police Station and processed. Police refused bail at the station. He was then transported to court the same day. Bail was refused by the court, and Luke Kerim was remanded in custody.','{"Luke Kerim","Laura Woods","Shane Carter"}','Bail refused at station and court. Remanded in custody.',NULL,'documented',NULL,'Liverpool Police Station','critical',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('358b856e-2097-4d11-b316-c5ddc1d5e1f7','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-01-15','Remand Period 15 Jan – 2 Apr 2026 (78 Days) — Released on 14-Month ICO','court','Following the arrest on 15 January 2026, Luke Kerim remained in custody for approximately two months and seventeen days (78 days on remand, not serving a sentence). The matter remained unresolved. No full brief of evidence had been tested in court. This period occurred alongside ongoing disputes regarding evidence, enforcement inconsistencies, and unresolved AVO breach reports.

On 2 April 2026, Luke Kerim was brought before the Local Court and released from custody following the imposition of an Intensive Correction Order (ICO). In order to secure his release on the ICO, Luke Kerim was required to withdraw his appeals relating to the 2025 charges.','{"Luke Kerim"}','ICO: 14 months, 1 April 2026 – 31 May 2027. Conditions: Community Corrections supervision; mandatory program participation; abstinence from drugs and alcohol unless prescribed; location restrictions including Tamworth without permission; compliance with existing AVO conditions. Appeals withdrawn to secure release.',NULL,'documented',NULL,NULL,'critical',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('61d2c075-6e99-4934-9ff3-06b3c5946c01','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-02-09','Bail Application Refused While on Remand — Luke Remains in Custody','court','While on remand, Luke Kerim made an application for bail. The application was heard before the court. Bail was refused. Luke Kerim remained in custody following this refusal.','{"Luke Kerim"}',NULL,NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('69d6c396-a63f-4b17-8787-fad1f7e2e57a','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-04-15','Luke Learns AVO Against Laura Was Dismissed on 10 February 2026','avo','On 15 April 2026, after Luke Kerim put in a complaint through Liverpool Police, he was advised that the AVO protecting him from Laura Woods was not enforceable. He then found out the AVO had been dismissed on 10 February 2026. Senior Constable Dana later advised that police were unable to conclusively prove that Laura Woods was responsible for sending the emails relied upon in the application.','{"Luke Kerim","Laura Woods"}','AVO formally dismissed 10 February 2026.',NULL,'documented',NULL,NULL,'medium',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('f067115d-e3e6-45d6-9fc9-e83e148cfa52','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-05-15','Arrested at Bankstown (TikTok AVO Breach — remi.petrovich Account) — Bailed 16 May','legal','On 15 May 2026 at approximately 3:30 PM, Luke Kerim attended Bankstown Police Station voluntarily after being informed by family that police had been attempting to locate him. At approximately 3:37 PM, police activated Body Worn Video. Luke was arrested at approximately 3:50 PM.

Luke was charged with: Contravene prohibition or restriction in an apprehended domestic violence order, contrary to s14(1) of the Crimes (Domestic and Personal Violence) Act 2007.

Police alleged that between 28 April 2026 and 12 May 2026, Luke breached AVO conditions relating to social media activity via a TikTok account using the username "remi.petrovich" — containing reposts and comments said to involve or reference Laura Woods and/or Evelyn Woods.

Luke denied breaching the AVO. Luke''s position: the reposts related to issues involving his mother; the material was not intended to target Laura Woods or Evelyn Woods; the account username/profile details had already been changed prior to arrest.

Luke declined to participate in an electronically recorded interview after speaking with his legal representative. Police initially refused bail and Luke remained in custody overnight.','{"Luke Kerim","Laura Woods","Evelyn Woods"}','Released on bail 16 May 2026. Bail condition: no social media posting. Following release, Luke voluntarily deactivated Facebook, Instagram, and TikTok accounts at approximately 8:00 PM on 16 May 2026.',NULL,'documented','15:30:00','Bankstown Police Station','critical',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.incidents (id,user_id,date,title,category,description,people_involved,outcome,reference_number,status,incident_time,location,severity,evidence_notes,linked_case_id,linked_charge_id,linked_order_id,created_at,updated_at) VALUES ('65ae8486-c41f-4336-a651-f5a50bcee5b8','ee4f4365-bd07-44df-9c76-85a244f0528b','2026-05-27','First Mention — Not Guilty Plea to AVO Breach (s14(1)) — Hearing Listed 4 November 2026','court','Luke Kerim appeared at Local Court for the first mention in relation to an alleged breach of an Apprehended Violence Order condition (s14(1)). He entered a plea of Not Guilty. The matter was not finalised at this appearance.

The Court adjourned the matter to the defended hearing track. A call-over/case management date was set for 9 September 2026, with a defended hearing listed for 4 November 2026. The brief of evidence is to be served no later than 14 days prior to the call-over date.

No findings of fact were made by the Court on this date, and the allegation remains untested.

At the time of this appearance, Luke Kerim was subject to an Intensive Correction Order (ICO). No breach of the ICO was determined in relation to this matter at this stage, and any ICO consequences remain contingent upon the outcome of the substantive charge.','{"Luke Kerim"}','Bail continuing. Call-over: 9 September 2026. Defended hearing: 4 November 2026.',NULL,'documented',NULL,NULL,'high',NULL,NULL,NULL,NULL,'2026-06-19 07:37:33.67286+00','2026-06-19 07:37:33.67286+00') ON CONFLICT (id) DO NOTHING;

-- End of backup