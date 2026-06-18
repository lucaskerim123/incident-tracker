do $$
declare
  v_uid uuid;
begin
  select id into v_uid from public.users where role = 'admin' order by created_at limit 1;

  insert into public.people
    (name, dob, labels, associate_labels, legal_update, notes, status, user_id)
  values

  -- 1. Luke Kerim
  (
    'Luke Kerim',
    '1998-08-07',
    array['Father of Evelyn Woods', 'Former partner of Laura Woods', 'Former partner of Jade Greenaway'],
    array['Primary father figure from birth', 'Present at Evelyn''s birth and cut the cord', 'Central subject of collapse', 'Loss of identity and role'],
    null,
    'I am the one left carrying everything.
Not just what happened, but what it turned into.
The damage, the anger, the loss of identity, and the feeling that my life got reduced to its worst moments.

When Evelyn was born, everything became real.
I was there. I cut the cord. When she opened her eyes, they opened on me.
From that point on, I wasn''t just around — I was her dad in every way that mattered.

That period — 2020 into 2021 — was real.
It wasn''t perfect, but it was stable. It was a family.
I had purpose, direction, something solid to build on.
Then everything started breaking down slowly.

I know I wasn''t easy to be with.
I was angry, reactive, and I said things I shouldn''t have.
I put pressure on the relationship and I played a role in how bad things got.
But at the same time, I stayed because walking away didn''t just mean losing Laura — it meant losing Evelyn.
So I held on longer than I should have, even when things were already collapsing.

Losing Evelyn didn''t just hurt — it stripped the foundation out from under me.
Everything since then feels like aftermath. Like I''m still here, but not living the life I built.
Mentally, I feel worn down, burnt out, and disconnected from who I used to be.

The truth underneath everything is simple: losing Evelyn destroyed me.',
    'confirmed',
    v_uid
  ),

  -- 2. Evelyn Woods
  (
    'Evelyn Woods',
    '2020-03-05',
    array['Daughter of Laura Woods and Luke Kerim'],
    array['Core emotional bond', 'Primary source of purpose'],
    null,
    'Evelyn is the most important person in my life.
She was my daughter in every way that mattered.
She gave my life meaning, direction, and something real to live for.

Losing access to her is the deepest damage I carry.
What I miss isn''t just seeing her — it''s being her dad.

She represents the best and most real part of my life.
Losing her feels like losing the reason my life held together.',
    'confirmed',
    v_uid
  ),

  -- 3. Laura Woods
  (
    'Laura Woods',
    '1997-09-18',
    array['Mother of Evelyn Woods', 'Former partner of Luke Kerim', 'Former partner of Sam Peters', 'Currently engaged to Shane Carter'],
    array['Central figure in relationship cycle (build → breakdown → conflict)', 'Connected to early 2019 DV incident with Sam Peters'],
    'AVO against Laura Woods has been withdrawn and dismissed',
    'Laura is one of the main reasons my life collapsed. But it didn''t start that way.

When we got together, she was already pregnant.
From the beginning, it wasn''t just a relationship — it was stepping straight into a family.
When Evelyn was born, everything felt real. We had something that actually mattered.

2020 into 2021 wasn''t all bad. There was stability there. There was a real family.
That''s what makes everything after it hit harder.

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

She represents: betrayal, instability, manipulation, double standards, the collapse of everything.',
    'confirmed',
    v_uid
  ),

  -- 4. Shane Carter
  (
    'Shane Carter',
    null,
    array['Engaged to Laura Woods', 'Former neighbour of Laura Woods'],
    array['Long-term background figure in Laura''s life (10+ years)', 'Connected from before Sam Peters', 'Central third-party in relationship breakdown', 'Direct interference figure', 'Symbol of replacement / humiliation', 'Associated with confirmed allegation (as stated by Laura)', 'History of AVO with Laura Woods ("drinking AVO")', 'Breach history and continued access'],
    null,
    'Shane isn''t just some random partner Laura moved on with.
He had been in Laura''s life for years before me. From what I understand, over 10 years.
He was around from before Sam, back when Laura was with Affleck, and she was neighbours with him.

That matters because he wasn''t someone new. He was already there in the background.

From my perspective, Shane got in the way purposely.
He inserted himself. He interfered.
He made himself part of things that should have been between me and Laura.
He literally banned me from their house.
That alone shows what his role was.

He wasn''t sitting back respectfully — he was actively involved, actively blocking, and actively creating distance.

Shane is one of the legitimate reasons me and Laura didn''t work.
Laura was obsessed with him. No matter what was happening between me and her, he was still there.
Still protected. Still chosen. Still sitting in the middle of everything.

He had already had an AVO with Laura before — what I understand as the "drinking AVO."
He breached it twice and was on the run, yet he was still allowed back around Laura and inside the house.
And worse than that, he was still allowed around Evelyn.

While I was pushed out, restricted, blamed, and made to feel like I was unsafe, he kept being let back in.
That shows a massive double standard.
I was judged by my worst moments. Shane was excused through his.

The worst part is the allegation she confirmed.
I didn''t hear some random rumour and just go off.
I heard something serious, sat with it, and brought it up properly because I cared about Evelyn and was acting from a father''s position.
Laura confirmed it. She said it happened. She said the girl lied about her age. She said he didn''t get charged.
But from my perspective, it still should have mattered. Especially as a mother.
Instead she stayed. Chose him. Defended him.

He represents: replacement, interference, double standards, being pushed out, humiliation, Laura choosing him over the family, serious concerns being ignored, being treated as the problem while he was excused, Evelyn being around someone I saw as unsafe.',
    'confirmed',
    v_uid
  ),

  -- 5. Christopher Brandon
  (
    'Christopher Brandon',
    null,
    array['Best mate'],
    array['Brother figure', 'Current support person', 'Witness'],
    null,
    'Chris is one of the only people who stayed solid.
He''s like a brother to me. I''m part of his family and he''s part of mine.

He got dragged into things he never should have been part of.
He represents loyalty and something real that didn''t collapse.
One of the only people I fully trust.

He''s also one of the main people supporting me through the current period of my life.
Not just historically, but actively now.
When everything else became unstable, Chris stayed consistent.
That matters more than most people probably realise.

He represents stability, loyalty, and the few relationships in my life that still feel genuine and real.',
    'confirmed',
    v_uid
  ),

  -- 6. Bronte Rose Jacobson
  (
    'Bronte Rose Jacobson',
    '2004-08-30',
    array['Former fling', 'Best friend'],
    array['Support during collapse period'],
    null,
    'Bronte was one of the only people there for me during last year.
She was around consistently and helped me get through a lot when everything was falling apart.
She saw me at my worst and didn''t walk away.
There was support there that I didn''t really have anywhere else at the time.

At the same time, it wasn''t clean.
She indirectly played a role in me getting hooked on ice.
So there''s a mix there — support, connection, but also damage.
It''s not something I can look at one way.

There was also the incident where Laura approached her in public and questioned her about me.
That situation wasn''t really about Bronte.
It showed that things were never actually separate, and Laura was still involved and reacting to what I was doing.',
    'confirmed',
    v_uid
  ),

  -- 7. Zoe Sheddan
  (
    'Zoe Sheddan',
    '2002-10-18',
    array['Best friend'],
    array['Sister like friendship', 'Longest crush'],
    null,
    'Zoe represents one of the most immediate and natural connections in my life.

When we met around 2016 — I was 16 and she was 14 — we clicked straight away and became instant best friends.
There wasn''t a gradual build with her; it was just an immediate familiarity and comfort that stayed consistent for a long time.

With Zoe specifically, there''s a long history of going through a lot of heavy stuff together.
It''s not just a surface-level friendship — it''s more in the category of having been through real situations, stress, change, and emotional ups and downs side by side over years.

There has also always been an emotional layer underneath it.
I had a strong crush on her at different points, but it was more than just that — it was a deeper attachment and care for her as a person.
At the same time, I was always able to remain her best friend without forcing it into anything else, even when there were moments where that boundary almost shifted a few times.

Recently, things have been strained.
We''ve both been in difficult places, and there''s been a major fight that''s put the friendship under real pressure.
We are currently trying to repair it, but the situation is unstable and it''s not clear where it will land.

She sits in the system as:
- instant best friend connection
- long-term shared history and experiences
- emotionally significant attachment
- unresolved but controlled romantic tension
- currently strained friendship with attempted repair underway',
    'confirmed',
    v_uid
  ),

  -- 8. Samuel Peters
  (
    'Samuel Peters',
    '1997-02-22',
    array['Biological father of Evelyn Woods', 'Former partner of Laura Woods', 'Current partner of Jade Greenaway', 'Former best friend of Luke Kerim'],
    array['Relevant to Family Court parenting matters', 'Year 7 friendship connection with Luke Kerim', 'Former brother-like figure', 'Relationship crossover figure', 'Parenting-system overlap', 'Communication affected by third-party AVO conditions'],
    null,
    'Samuel Peters was one of my closest friends from Year 7 onward and was someone I considered like a brother for a large portion of my life.

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
There are still unresolved issues and lingering complications that need to be worked through, but the relationship is no longer at the same level of conflict that existed previously.',
    'confirmed',
    v_uid
  ),

  -- 9. Jade Greenaway
  (
    'Jade Greenaway',
    '1999-07-15',
    array['Former partner of Luke Kerim', 'Current partner of Sam Peters'],
    array['Mother of two children with Sam Peters', 'Associated with the 2017–2019 relationship period', 'Present during the 2018 grief event — Luke''s uncle''s passing', 'Linked to early emotional instability phase'],
    'AVO condition 2 (no contact) has been removed',
    'Jade represents the relationship immediately before Laura.
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

Jade is not central to the current Laura and Evelyn conflict, but she remains relevant because she sits directly before that chapter and connects to the older emotional damage underneath it.',
    'confirmed',
    v_uid
  ),

  -- 10. Jayana Mangan
  (
    'Jayana Mangan',
    null,
    array['Associated individual'],
    array['Indirect involvement', 'Connected to Manilla Show allegation / early escalation'],
    null,
    'Jayana isn''t a central figure, but she became part of the situation through allegations and conflict.

Her name became tied to the Manilla Show situation and the early escalation that followed.
Laura alleged Jayana had been present, which I denied, and that allegation became part of the confusion and pressure around Evelyn being returned that day.

She represents how quickly things became messy and how other people got pulled into something that should have stayed contained.',
    'confirmed',
    v_uid
  ),

  -- 11. Sonya Kerim
  (
    'Sonya Kerim',
    null,
    array['Mother'],
    array[]::text[],
    null,
    'Mum represents support, but also guilt.
She got dragged into things she never should have been involved in.
There''s love there, but also the weight of knowing my situation affected her.',
    'confirmed',
    v_uid
  ),

  -- 12. Tina Kerim
  (
    'Tina Kerim',
    '1996-10-19',
    array['Sister'],
    array[]::text[],
    null,
    'Tina represents stability.
She''s someone I''ve had to rely on when everything else fell apart.
At the same time, she''s tied to moments where everything spilled into family.',
    'confirmed',
    v_uid
  ),

  -- 13. Melanie Kerim
  (
    'Melanie Kerim',
    null,
    array['Sister'],
    array[]::text[],
    null,
    'Melanie represents loyalty.
She also represents how far everything spread beyond just me.
Support is there, but so is the reality others got dragged into it.',
    'confirmed',
    v_uid
  ),

  -- 14. Jesse Kerim
  (
    'Jesse Kerim',
    null,
    array['Brother'],
    array['Witness to March 2025 mental health crisis', 'Immediate intervention figure'],
    null,
    'Jesse is tied to one of the worst moments of my life.

He was there after Evelyn was removed on 15 March 2025 and saw how badly I collapsed.
He physically intervened when I accessed the firearm, and that matters because he was one of the only people directly present when everything went from emotional pain into an acute crisis.

He represents family being pulled into the most dangerous part of the collapse.
He also represents the reality that some people saw how bad it actually got, not just the version that exists on paper.',
    'confirmed',
    v_uid
  );

end $$;
