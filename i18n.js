(() => {
  const STORAGE_KEY = 'arcana_lang';
  const SUPPORTED = ['en', 'uk'];

  const translations = {
    en: {
      meta: {
        title: 'Arcana Table',
      },
      lang: {
        label: 'Language',
        en: 'English',
        uk: 'Українська',
      },
      common: {
        close: 'Close',
        and: 'and',
      },
      nav: {
        menu: 'Open menu',
        menu_close: 'Close menu',
        site: 'Site',
        daily: {
          title: 'Daily card',
          subtitle: 'Click to reveal',
        },
        magic: {
          title: 'Magic ball',
          subtitle: 'Shake to answer',
        },
        soulmate: {
          title: 'Your soulmate',
          subtitle: 'View portrait',
        },
        tab: {
          tarot: 'Tarot',
          numerology: 'Numerology',
          palmistry: 'Palmistry',
        },
        auth: {
          signin: 'Sign in',
          account: 'Account',
        },
      },
      tarot: {
        view: {
          label: 'Tarot reading',
        },
        table: {
          label: 'Tarot reading table',
        },
        deck: {
          label: 'Tarot deck. Tap to deal cards.',
        },
        spread: {
          title: 'Choose a spread',
          three: 'Three',
          horseshoe: 'Horseshoe',
          celtic: 'Celtic Cross',
          actions: 'Spread actions',
          reveal_all: 'Reveal all',
          positions: 'Spread positions',
        },
        hero: {
          title: 'The Arcana Table',
          subtitle:
            'Choose a spread, tap the deck to deal the cards, then reveal each one to build the full story.',
          begin: 'Begin',
          shuffle: 'Shuffle',
        },
        reading: {
          title: 'Your reading',
          general: 'General Interpretation',
          personalized: 'Personalized interpretation',
          keywords: 'Keywords',
          keywords_shadow: 'Keywords (Shadow)',
          reversed: 'Reversed',
          scene: 'Scene: ',
          scene_reversed: 'Scene (Reversed lens): ',
          blocked: 'Blocked {keyword}',
          shadow_list: '{card} points to an imbalance around {list}.',
          shadow_default: '{card} signals an inward or blocked energy.',
        },
        spreads: {
          three: {
            name: 'Past / Present / Future',
            description: 'A quick read of your past, present, and future energy.',
          },
          horseshoe: {
            name: 'Horseshoe',
            description: 'A seven-card arc that traces momentum and obstacles.',
          },
          celtic: {
            name: 'Celtic Cross',
            description: 'A ten-card classic for deeper insight and layered themes.',
          },
        },
        positions: {
          past: {
            label: 'Past',
            detail: 'What shaped this moment.',
          },
          present: {
            label: 'Present',
            detail: 'Where you stand now.',
          },
          future: {
            label: 'Future',
            detail: 'What is gathering ahead.',
          },
          hidden: {
            label: 'Hidden',
            detail: 'What is unseen or unconscious.',
          },
          obstacles: {
            label: 'Obstacles',
            detail: 'The tension to navigate.',
          },
          external: {
            label: 'External',
            detail: 'Influences around you.',
          },
          advice: {
            label: 'Advice',
            detail: 'The best approach right now.',
          },
          outcome: {
            label: 'Outcome',
            detail: 'Where the path may lead.',
          },
          crossing: {
            label: 'Crossing',
            detail: 'The challenge crossing you.',
          },
          conscious: {
            label: 'Conscious',
            detail: 'Crown or current focus.',
          },
          subconscious: {
            label: 'Subconscious',
            detail: 'Foundation below.',
          },
          near_future: {
            label: 'Near Future',
            detail: 'What approaches next.',
          },
          self: {
            label: 'Self',
            detail: 'Where you are right now.',
          },
          environment: {
            label: 'Environment',
            detail: 'External influences.',
          },
          hopes_fears: {
            label: 'Hopes & Fears',
            detail: 'Inner tensions and wishes.',
          },
        },
        status: {
          tap_deck_deal: 'Tap the deck to deal {count} cards.',
          tap_deck_deal_short: 'Tap the deck to deal {count} cards',
          cards_dealt: 'Cards dealt. Tap each card to reveal (tap deck to shuffle).',
          tap_cards_reveal: 'Tap cards to reveal — tap deck to shuffle',
          dealing: 'Dealing...',
          revealed_progress: 'Revealed {revealed} of {total}. Keep going.',
          reading_complete: 'Reading complete. Reflect on the pattern.',
          shuffling: 'Shuffling...',
          begin_reading: 'Tap the deck to begin your {spread} reading.',
        },
        advice: {
          positive: [
            'Choose one small step today that supports {theme}.',
            'Let {theme} guide one practical decision this week.',
            'Anchor {theme} with a simple, concrete action.',
            'Commit to a steady action that strengthens {theme}.',
          ],
          reversed: [
            'Rebalance {theme} by setting one clear boundary.',
            'Ground {theme} with one small, steady action.',
            'Bring {theme} back to basics with a simple next step.',
          ],
          neutral: [
            'Choose one small, concrete step and do it today.',
            'Pick the simplest next action and follow through.',
            'Name what matters most, then take one grounded step.',
          ],
          caution: [
            'Pause, simplify, and focus on what you can control.',
            'Create a boundary, then take one stabilizing step.',
            'Name the pressure you feel and soften it with one small action.',
          ],
          fallback: 'Take one small, grounded step today.',
        },
        leads: {
          past: 'In your past, ',
          present: 'Right now, ',
          future: 'Ahead, ',
          near_future: 'In the near future, ',
          outcome: 'If the current path continues, ',
          conscious: 'On your mind, ',
          subconscious: 'Under the surface, ',
          crown: 'At the top of your mind, ',
          foundation: 'At the root of this, ',
          crossing: 'What is crossing you is that ',
          self: 'How you are showing up is that ',
          environment: 'Around you, ',
          hopes_fears: 'In your hopes and fears, ',
          advice: 'Your next best move is to notice that ',
          hidden: 'What is hidden is that ',
          obstacles: 'The obstacle here is that ',
          external: 'From outside influences, ',
          love: 'In love, ',
          career: 'In career matters, ',
          finance: 'With money and resources, ',
          default: 'In the {position} position, ',
          generic: 'In this position, ',
        },
        personalized: {
          past: '{card} influenced your past, setting the tone for what you face now.',
          present: '{card} highlights the central energy shaping your current moment.',
          future: '{card} points to energy gathering ahead—prepare to meet it.',
          hidden: '{card} reveals what works beneath the surface, unseen but active.',
          obstacles: '{card} shows the tension or obstacle you must navigate.',
          external: '{card} reflects outside influences shaping this situation.',
          advice: '{card} offers a course of action: move with this guidance.',
          outcome: '{card} sketches a likely outcome if the current path holds.',
          crossing: '{card} crosses your path, challenging your direction.',
          conscious: '{card} mirrors what’s on your mind and in clear view.',
          subconscious: '{card} mirrors what lies beneath awareness, steering you quietly.',
          near_future: '{card} approaches soon—be ready for its lesson.',
          self: '{card} reflects how you show up and engage right now.',
          environment: '{card} mirrors the environment and people around you.',
          hopes_and_fears: '{card} touches both your hopes and your worries in this matter.',
        },
      },
      daily: {
        kicker: 'Daily insight',
        title: 'Personal card of the day',
        interpretation_label: 'Personalized interpretation',
        guidance_label: 'Guidance',
        arcana: {
          major: 'Major Arcana',
          minor: 'Minor Arcana',
        },
        fallback: {
          keywords: 'A quiet focus for today.',
          message: 'Let today be a gentle reset.',
          guidance: 'Choose one grounded action that honors your focus.',
        },
        reversed: ' (Reversed)',
      },
      magic: {
        kicker: 'Magic ball',
        title: 'Shake for an answer',
        subtitle: 'Hold a clear question, then shake your phone or tap the orb.',
        enable_motion: 'Enable motion',
        status: {
          default: 'Shake your phone or tap the orb to reveal a message.',
          motion_off: 'Motion access is off. Tap the orb to reveal a message.',
          pending: 'The orb is listening...',
          tap_orb: 'Tap the orb to reveal a message.',
          enable_motion: 'Enable motion or tap the orb to reveal a message.',
          shake_again: 'The orb shifts. Ask again when ready.',
          tap_again: 'Ask again when ready.',
        },
        default_answer: 'Focus your question.',
        responses: [
          'Yes, but give it time.',
          'No, and that is protection.',
          'Lean into the next step.',
          'Trust your instinct.',
          'Wait for clearer signals.',
          'A small yes opens a bigger door.',
          'Choose the simpler path.',
          'Now is not the moment.',
          'Ask again after you rest.',
          'Follow the spark, ignore the noise.',
          'The answer is already near.',
          'Let it unfold without force.',
          'A shift is underway.',
          'Release what is heavy.',
          'Move gently, but move.',
          'Protect your energy first.',
          'A helpful ally appears soon.',
          'You already know the answer.',
          'Say no to protect the yes.',
          'This is a good omen.',
          'A pause will reveal more.',
          'Listen, then act.',
          'Take the risk with care.',
          'Begin with the smallest action.',
        ],
      },
      soulmate: {
        title: 'Your soulmate portrait',
        subtitle: 'Generated just for you.',
        status: {
          preparing: 'Preparing your portrait...',
          loading: 'Loading your soulmate portrait...',
          no_quiz: 'Complete the quiz to unlock your soulmate portrait.',
          processing: 'Your soulmate portrait is being prepared...',
          generating: 'We are preparing your soulmate portrait.',
        },
        image_alt: 'Your soulmate portrait',
      },
      prelude: {
        kicker: 'Tarot prelude',
        title: 'Attune your reading',
        subtitle: 'Take a breath. Hold a single, honest question.',
        steps: {
          breathe: {
            title: 'Breathe (10 seconds)',
            text: 'Slow inhale, slow exhale. Let the noise settle.',
          },
          focus: {
            title: 'Focus',
            text: 'Pick one situation, not ten. Clarity loves simplicity.',
          },
          ask: {
            title: 'Ask',
            text: 'Use open questions that invite insight.',
          },
        },
        guides: {
          do: {
            title: 'Ask like this',
            items: [
              'What should I consider about ___?',
              'What energy surrounds ___?',
              'How can I move forward with ___?',
            ],
          },
          dont: {
            title: 'Avoid this',
            items: ['Yes or no questions.', 'Will they or will it happen?', 'Multiple topics in one spread.'],
          },
        },
        formula: {
          label: 'Prompt formula',
          text: 'Show me what I need to understand about ___ so I can ___.',
        },
        ready: "I'm ready",
      },
      numerology: {
        view: {
          label: 'Numerology map',
        },
        title: 'Numerology Map',
        subtitle: 'A quick, story-rich look at your core numbers and current cycles.',
        tabs: {
          profile: 'My Numbers',
          compatibility: 'Connection',
        },
        profile: {
          heading: 'Tell us about you',
          full_name: {
            label: 'Full name:',
            placeholder: 'For example: John Smith',
            help: 'Use the name you use most, or the one on your documents.',
          },
          birth_date: {
            label: 'Date of birth:',
          },
          current_date: {
            label: 'Current date (optional):',
            help: 'Leave blank to use today.',
          },
          submit: 'Reveal my numbers',
          loading: 'Tuning your numbers...',
          core_signature: 'Core signature',
        },
        formula: {
          show_math: 'Show the math',
        },
        numbers: {
          life_path: { title: 'Life Path' },
          destiny: { title: 'Destiny' },
          soul: { title: 'Soul' },
          personality: { title: 'Personality' },
        },
        cycles: {
          title: 'Current cycles',
          year: { title: 'Personal year' },
          month: { title: 'Personal month' },
          day: { title: 'Personal day' },
        },
        pinnacles: { title: 'Life peaks' },
        challenges: { title: 'Life lessons' },
        footer: 'Inspired by the Jean Simpson numerology system.',
      },
      compatibility: {
        title: 'Connection',
        subtitle: 'See how two charts interact and where the energy flows.',
        person_a: {
          title: 'Person A',
          full_name: { label: 'Full name:', placeholder: 'For example: John Smith' },
          birth_date: { label: 'Birth date:' },
        },
        person_b: {
          title: 'Person B',
          full_name: { label: 'Full name:', placeholder: 'For example: Emily Carter' },
          birth_date: { label: 'Birth date:' },
        },
        submit: 'Check compatibility',
        overall: {
          title: 'Overall match',
          how_to_read: 'How to read this score?',
          scale_title: 'Compatibility scale:',
          scale: {
            aligned: {
              label: '85-100% (Aligned):',
              text: 'Strong flow and natural support',
            },
            supportive: {
              label: '70-84% (Supportive):',
              text: 'Stable base with room to grow',
            },
            mixed: {
              label: '60-69% (Mixed):',
              text: 'Needs attention and clear communication',
            },
            growth: {
              label: 'Below 60% (Growth edge):',
              text: 'Requires intention and care',
            },
          },
          important_label: 'Important:',
          important_text: 'A low score is not a verdict. It points to the places that need care.',
        },
        details: {
          title: 'Number by number',
          explanation:
            'We weight Life Path (40%), Destiny (30%), Soul (20%), and Personality (10%) to build the overall score.',
        },
        metrics: {
          why_it_matters: 'Why it matters',
          shows: 'Shows:',
          life_path: {
            title: 'Life Path',
            strong: 'Life Path',
            desc: 'shows the long arc: direction, timing, and core life rhythm.',
            items: [
              'Alignment of long-term goals',
              'How you move through change',
              'Potential for staying power',
            ],
          },
          destiny: {
            title: 'Destiny',
            strong: 'Destiny',
            desc: 'reflects goals and how you build in the world.',
            items: ['Shared ambitions and focus', 'How you collaborate on plans', 'Whether strengths stack or clash'],
          },
          soul: {
            title: 'Soul',
            strong: 'Soul',
            desc: 'speaks to emotional tone and inner needs.',
            items: ['Emotional resonance', 'How you recharge together', 'Alignment of inner values'],
          },
          personality: {
            title: 'Personality',
            strong: 'Personality',
            desc: 'is the social layer: first impressions and outward style.',
            items: ['Social ease and chemistry', 'How you present as a pair', 'Public-facing harmony'],
          },
        },
        group: {
          title: 'Pair signature',
          description: 'The shared tone created by your combined life paths.',
          how_calculated: 'How is it calculated?',
          formula_label: 'Formula:',
          formula_text: 'Person A Life Path + Person B Life Path -> reduction',
          highlights_label: 'This number highlights:',
          items: ['The energy you create together', 'The style of the bond', 'Collective potential'],
        },
        recommendations: {
          title: 'Suggested focus',
        },
        loading: 'Reading your connection...',
      },
      palmistry: {
        view: {
          label: 'Palmistry quiz',
        },
        title: 'Palmistry Reading',
        subtitle: "Based on Cheiro's Palmistry for All. Study your hand and answer the quiz.",
        intro: {
          title: 'How to read your hand',
          text: 'Use your dominant hand. Compare shape, lines, and mounts, then choose the closest option.',
          steps: [
            'Look at your palm shape and finger tips first.',
            'Trace the major lines with a soft light.',
            'Pick the strongest mounts if two feel prominent.',
          ],
        },
        hand_shape: {
          title: 'Hand shape',
          legend: 'Which hand type matches you best?',
          elementary: {
            title: 'Elementary',
            desc: 'Short, thick palm with heavy fingers.',
          },
          square: {
            title: 'Square (Practical)',
            desc: 'Square palm, straight edges, solid build.',
          },
          spatulate: {
            title: 'Spatulate (Active)',
            desc: 'Widened finger tips, energetic look.',
          },
          philosophic: {
            title: 'Philosophic',
            desc: 'Long, bony palm with knotty joints.',
          },
          conic: {
            title: 'Conic (Artistic)',
            desc: 'Tapered fingers, soft and graceful.',
          },
          psychic: {
            title: 'Psychic (Idealistic)',
            desc: 'Very fine, delicate, refined lines.',
          },
          mixed: {
            title: 'Mixed',
            desc: 'Different shapes across fingers and palm.',
          },
        },
        major_lines: {
          title: 'Major lines',
          diagram_alt: 'Palm diagram labeling the five major lines: heart, head, life, fate, and sun.',
          caption: 'Major lines: Heart, Head, Life, Fate, Sun.',
          head: {
            legend: 'Head line (mentality)',
            straight: { title: 'Straight across', desc: 'Clear, steady line across the palm.' },
            sloping: { title: 'Slopes downward', desc: 'Drops toward the Moon side of the palm.' },
            chained: { title: 'Chained or broken', desc: 'Looks linked, fragmented, or uneven.' },
          },
          heart: {
            legend: 'Heart line (emotions)',
            jupiter: { title: 'Ends under index finger', desc: 'Rises toward the Jupiter mount.' },
            between: { title: 'Ends between index and middle', desc: 'Balanced finish between two fingers.' },
            saturn: { title: 'Ends under middle finger', desc: 'Finishes closer to Saturn mount.' },
            chained: { title: 'Chained or fragmented', desc: 'Looks linked, dotted, or uneven.' },
          },
          life: {
            legend: 'Life line (vitality)',
            strong: { title: 'Long and deep', desc: 'Clear curve around the thumb.' },
            faint: { title: 'Faint or shallow', desc: 'Light line, thin or narrow.' },
            broken: { title: 'Broken or islanded', desc: 'Gaps, islands, or interruptions.' },
            mars: { title: 'Double line (Mars line)', desc: 'A parallel support line beside it.' },
          },
          fate: {
            legend: 'Fate line (career path)',
            clear: { title: 'Clear and steady', desc: 'Runs upward through the center.' },
            broken: { title: 'Faint or broken', desc: 'Changes, gaps, or multiple starts.' },
            absent: { title: 'Absent or very light', desc: 'No strong central career line.' },
          },
          sun: {
            legend: 'Sun line (recognition)',
            clear: { title: 'Clear or rising', desc: 'Visible line under the ring finger.' },
            absent: { title: 'Faint or absent', desc: 'No strong line under the ring finger.' },
          },
        },
        details: {
          title: 'Details and structure',
          thumb_flex: {
            legend: 'Thumb flexibility',
            supple: { title: 'Supple and bends back', desc: 'Flexible, easy to fold outward.' },
            firm: { title: 'Firm and straight', desc: 'Stiff, strong, resists bending.' },
          },
          thumb_length: {
            legend: 'Thumb length',
            long: { title: 'Long thumb', desc: 'Reaches near the first finger joint.' },
            balanced: { title: 'Balanced thumb', desc: 'Average length and proportion.' },
            short: { title: 'Short thumb', desc: 'Noticeably shorter than average.' },
          },
          index_ring: {
            legend: 'Index and ring fingers',
            index: { title: 'Index finger longer', desc: 'Jupiter finger leads the ring finger.' },
            ring: { title: 'Ring finger longer', desc: 'Sun finger edges past the index.' },
            even: { title: 'About the same length', desc: 'Balanced length and proportion.' },
          },
          mercury: {
            legend: 'Little finger (Mercury)',
            long: { title: 'Long', desc: 'Reaches near the top joint of the ring finger.' },
            short: { title: 'Short', desc: 'Ends lower than the ring finger joint.' },
          },
          nails: {
            legend: 'Nail shape',
            long: { title: 'Long or narrow', desc: 'Slender nail beds or longer nails.' },
            short: { title: 'Short or broad', desc: 'Shorter nails, wider beds.' },
            balanced: { title: 'Medium and rounded', desc: 'Balanced, neither long nor short.' },
          },
          mounts: {
            diagram_alt:
              'Palm diagram labeling the mounts: Jupiter, Saturn, Apollo, Mercury, Venus, Mars, Moon.',
            caption: 'Mounts: Jupiter, Saturn, Apollo, Mercury, Venus, Mars, Moon.',
            legend: 'Prominent mounts (pick up to two)',
            help: 'Look for raised areas at the base of each finger or along the palm.',
            venus: { title: 'Venus', desc: 'Base of thumb, warmth and affection.' },
            moon: { title: 'Moon', desc: 'Outer palm, imagination and mood.' },
            jupiter: { title: 'Jupiter', desc: 'Under index, ambition and leadership.' },
            saturn: { title: 'Saturn', desc: 'Under middle, seriousness and focus.' },
            sun: { title: 'Sun (Apollo)', desc: 'Under ring, joy and creativity.' },
            mercury: { title: 'Mercury', desc: 'Under little, wit and communication.' },
            mars: { title: 'Mars', desc: 'Inner palm, courage and endurance.' },
          },
        },
        submit: 'Reveal my palm reading',
        results: {
          primary: { title: 'Primary hand type' },
          themes: { title: 'Top themes' },
          lines: { title: 'Major lines' },
          notes: { title: 'Extra notes' },
          disclaimer: 'Palmistry is interpretive and meant for reflection, not prediction.',
        },
        traits: {
          practical: { label: 'Practical', desc: 'Grounded, steady, prefers clear plans and results.' },
          creative: { label: 'Creative', desc: 'Drawn to beauty, expression, and originality.' },
          intuitive: { label: 'Intuitive', desc: 'Reads between the lines and trusts inner signals.' },
          analytical: { label: 'Analytical', desc: 'Studies details carefully and seeks understanding.' },
          ambitious: { label: 'Ambitious', desc: 'Driven to lead, improve, or rise into challenges.' },
          communicative: { label: 'Communicative', desc: 'Expressive, persuasive, and quick with language.' },
          resilient: { label: 'Resilient', desc: 'Strong endurance and steady energy.' },
          adaptable: { label: 'Adaptable', desc: 'Flexible, open to change, and fast to adjust.' },
          sensitive: { label: 'Sensitive', desc: 'Feels deeply and notices subtle shifts.' },
          disciplined: { label: 'Disciplined', desc: 'Steady willpower and consistent follow-through.' },
          grounded: { label: 'Grounded', desc: 'Direct, physical, and focused on essentials.' },
          idealistic: { label: 'Idealistic', desc: 'Guided by ideals, vision, and inner meaning.' },
        },
        tags: {
          instinctive: 'instinctive',
          direct: 'direct',
          physical: 'physical',
          methodical: 'methodical',
          reliable: 'reliable',
          steady: 'steady',
          energetic: 'energetic',
          inventive: 'inventive',
          restless: 'restless',
          thoughtful: 'thoughtful',
          studious: 'studious',
          independent: 'independent',
          artistic: 'artistic',
          sensitive: 'sensitive',
          aesthetic: 'aesthetic',
          idealistic: 'idealistic',
          intuitive: 'intuitive',
          dreamy: 'dreamy',
          versatile: 'versatile',
          curious: 'curious',
          changeable: 'changeable',
        },
        hand_types: {
          elementary: {
            title: 'Elementary hand',
            desc:
              'Short and thick with heavy fingers. This type focuses on direct action, tangible needs, and a practical sense of life.',
          },
          square: {
            title: 'Square hand',
            desc:
              'Square palm and straight edges point to a practical, methodical, and reliable nature that values proof and structure.',
          },
          spatulate: {
            title: 'Spatulate hand',
            desc:
              'Widened finger tips and an active shape suggest energy, drive, and a taste for action and innovation.',
          },
          philosophic: {
            title: 'Philosophic hand',
            desc:
              'Long, bony palm with knotty joints. Indicates a thoughtful, analytical, and reflective temperament.',
          },
          conic: {
            title: 'Conic (artistic) hand',
            desc:
              'Tapered fingers and a soft palm point to artistic sensitivity, emotional depth, and love of beauty.',
          },
          psychic: {
            title: 'Psychic (idealistic) hand',
            desc:
              'Fine, delicate lines suggest an inward, intuitive nature that lives strongly in ideals and imagination.',
          },
          mixed: {
            title: 'Mixed hand',
            desc:
              'A blend of shapes across the palm and fingers. Suggests versatility and a wide range of interests.',
          },
        },
        lines: {
          head: {
            label: 'Head line',
            straight: 'A straight head line leans practical and logical in thought.',
            sloping: 'A sloping head line favors imagination, intuition, and creativity.',
            chained: 'A chained head line suggests mental sensitivity and shifting focus.',
          },
          heart: {
            label: 'Heart line',
            jupiter: 'Ending under the index finger points to idealism in love.',
            between: 'Ending between index and middle suggests balanced emotions.',
            saturn: 'Ending under the middle finger reads as reserved and realistic.',
            chained: 'Chained or broken points to deep sensitivity in feelings.',
          },
          life: {
            label: 'Life line',
            strong: 'Long and deep suggests strong vitality and steady stamina.',
            faint: 'Faint or shallow suggests gentle energy and need for balance.',
            broken: 'Broken or islanded indicates periods of change or shifts in energy.',
            mars: 'A parallel support line signals extra resilience and recovery.',
          },
          fate: {
            label: 'Fate line',
            clear: 'A clear fate line suggests focus and a defined path.',
            broken: 'Faint or broken suggests career shifts or reinventions.',
            absent: 'Absent suggests a self-directed path with flexible choices.',
          },
          sun: {
            label: 'Sun line',
            clear: 'A clear sun line points to recognition and joy in expression.',
            absent: 'Absent suggests private satisfaction over public attention.',
          },
        },
        features: {
          thumb_flex: {
            supple: 'Supple thumb: flexible, adaptable, and generous in approach.',
            firm: 'Firm thumb: steady willpower and persistence.',
          },
          thumb_length: {
            long: 'Long thumb: strong will and follow-through.',
            balanced: 'Balanced thumb: even mix of will and reason.',
            short: 'Short thumb: quick to act, spontaneous responses.',
          },
          index_ring: {
            index: 'Index longer: leadership drive and ambition.',
            ring: 'Ring longer: artistic pull and love of beauty.',
            even: 'Even length: balanced approach to authority and expression.',
          },
          mercury: {
            long: 'Long Mercury finger: strong communication skills.',
            short: 'Short Mercury finger: private, measured speech.',
          },
          nails: {
            long: 'Long or narrow nails: sensitive and perceptive.',
            short: 'Short or broad nails: direct, energetic nature.',
            balanced: 'Balanced nails: steady temperament and control.',
          },
        },
        mounts: {
          venus: 'Venus mount: warmth, affection, and magnetism.',
          moon: 'Moon mount: imagination and romantic tone.',
          jupiter: 'Jupiter mount: ambition and leadership drive.',
          saturn: 'Saturn mount: seriousness and responsibility.',
          sun: 'Sun mount: optimism and creative expression.',
          mercury: 'Mercury mount: wit, commerce, and communication.',
          mars: 'Mars mount: courage and endurance.',
        },
      },
      auth: {
        menu: {
          account_details: 'Account details',
          language: 'Language',
          logout: 'Log out',
        },
        modal: {
          title: {
            account: 'Account',
          },
          sign_out: 'Sign out',
        },
        page: {
          meta_title: 'Sign in - Arcana Table',
          title: {
            signin: 'Login your account',
            signup: 'Create an account',
            account: 'Account',
          },
          switch: {
            no_account: "Don't have an account?",
            signup: 'Sign up',
            have_account: 'Already have an account?',
            signin: 'Login',
          },
          name: {
            label: 'Your name',
            placeholder: 'Enter your name',
          },
          email: {
            label: 'Email',
            placeholder: 'Enter your email address',
          },
          password: {
            label: 'Password',
            placeholder: 'Enter your password',
            toggle: 'Toggle password',
            hint: 'Use 8 or more characters with a mix of letters, numbers & symbols.',
          },
          submit: {
            signin: 'Login',
            signup: 'Sign up',
          },
          forgot: 'Forgot Password?',
          reset: {
            title: 'Reset your password',
            text: 'We will email you a link to reset your password.',
            set_title: 'Set a new password',
            update_text: 'Enter a new password to finish resetting your account.',
            send: 'Send reset link',
            new_password: { label: 'New password', placeholder: 'Create a new password' },
            confirm: { label: 'Confirm password', placeholder: 'Repeat your new password' },
            update: 'Update password',
            back: 'Back to login',
          },
          verify: {
            title: 'Verify your email',
            text_prefix: 'We have sent a verification link to',
            text_note: 'Click the link to complete verification. Check spam if you don’t see it.',
            resend: 'Resend verification link',
            try_another: 'Try another email?',
            back_to_login: 'Go to Login',
          },
        },
        status: {
          supabase_missing: 'Supabase keys are missing.',
          enter_email_password: 'Enter a valid email and password.',
          enter_name: 'Enter your name to create an account.',
          creating_account: 'Creating your account...',
          check_email: 'Check your email to confirm your account.',
          signing_in: 'Signing you in...',
          validating_reset: 'Validating reset link...',
          server_session_failed: 'Server session failed. Check SUPABASE_URL in server env.',
          resend_link: 'Resending verification link...',
          link_resent: 'Verification link resent.',
          enter_email_reset: 'Enter your email to reset the password.',
          sending_reset: 'Sending reset link...',
          reset_sent: 'Password reset link sent. Check your email.',
          reset_title: 'Reset your password',
          password_length: 'Use at least 8 characters for your new password.',
          passwords_mismatch: 'Passwords do not match.',
          updating_password: 'Updating your password...',
          password_updated: 'Password updated. Please sign in.',
        },
      },
      numerology_messages: {
        number_label: 'Number {number}',
        personal_year_energy: 'Personal year energy: {number}',
        personal_month_energy: 'Personal month energy: {number}',
        personal_day_energy: 'Personal day energy: {number}',
        ages_range: 'Ages {start}-{end}',
        age_from: 'From age {start}',
        peak: 'Peak {index}',
        lesson: 'Lesson {index}',
        master_number: 'master number',
        pair_example: 'Example: {p1} + {p2} = {sum} -> {pair}',
        required_fields: 'Please fill in the required fields.',
        invalid_birth: 'Please enter a valid birth date.',
        birth_future: 'Birth date cannot be in the future.',
        invalid_current: 'Please enter a valid current date.',
        current_future: 'Current date cannot be in the future.',
        current_before_birth: 'Current date cannot be earlier than birth date.',
        calculation_failed: 'We could not calculate that right now.',
        generic_error: 'Something went wrong. Please try again in a moment.',
        compatibility_required: 'Please fill in both profiles.',
        compatibility_invalid_dates: 'Please enter valid birth dates.',
        compatibility_future: 'Birth dates cannot be in the future.',
        compatibility_failed: 'We could not read the connection right now.',
        compatibility_generic: 'Something went wrong while checking compatibility.',
      },
      palmistry_messages: {
        required_questions: 'Please answer all required questions.',
        max_mounts: 'Please select up to two mounts.',
        select_hand: 'Please select a hand type.',
        traits_balanced: 'Your traits balance evenly across the quiz.',
        no_notes: 'No extra notes selected.',
      },
    },
    uk: {
      meta: {
        title: 'Стіл Арканів',
      },
      lang: {
        label: 'Мова',
        en: 'English',
        uk: 'Українська',
      },
      common: {
        close: 'Закрити',
        and: 'і',
      },
      nav: {
        menu: 'Відкрити меню',
        menu_close: 'Закрити меню',
        site: 'Сайт',
        daily: {
          title: 'Карта дня',
          subtitle: 'Натисни, щоб відкрити',
        },
        magic: {
          title: 'Магічна куля',
          subtitle: 'Струси, щоб отримати відповідь',
        },
        soulmate: {
          title: 'Твоя споріднена душа',
          subtitle: 'Переглянути портрет',
        },
        tab: {
          tarot: 'Таро',
          numerology: 'Нумерологія',
          palmistry: 'Хіромантія',
        },
        auth: {
          signin: 'Увійти',
          account: 'Акаунт',
        },
      },
      tarot: {
        view: {
          label: 'Розклад Таро',
        },
        table: {
          label: 'Стіл для розкладу Таро',
        },
        deck: {
          label: 'Колода Таро. Торкнись, щоб роздати карти.',
        },
        spread: {
          title: 'Обери розклад',
          three: 'Три',
          horseshoe: 'Підкова',
          celtic: 'Кельтський хрест',
          actions: 'Дії розкладу',
          reveal_all: 'Відкрити все',
          positions: 'Позиції розкладу',
        },
        hero: {
          title: 'Стіл Арканів',
          subtitle:
            'Обери розклад, торкнись колоди, щоб роздати карти, а потім відкрий кожну, щоб зібрати повну історію.',
          begin: 'Почати',
          shuffle: 'Перетасувати',
        },
        reading: {
          title: 'Твій розклад',
          general: 'Загальне тлумачення',
          personalized: 'Персоналізована інтерпретація',
          keywords: 'Ключові слова',
          keywords_shadow: 'Ключові слова (тінь)',
          reversed: 'Перевернута',
          scene: 'Сцена: ',
          scene_reversed: 'Сцена (перевернута перспектива): ',
          blocked: 'Заблоковано {keyword}',
          shadow_list: '{card} вказує на дисбаланс щодо {list}.',
          shadow_default: '{card} сигналізує про внутрішню або заблоковану енергію.',
        },
        spreads: {
          three: {
            name: 'Минуле / Теперішнє / Майбутнє',
            description: 'Швидкий погляд на енергію минулого, теперішнього й майбутнього.',
          },
          horseshoe: {
            name: 'Підкова',
            description: 'Сім карт у дузі, що показують імпульс і перешкоди.',
          },
          celtic: {
            name: 'Кельтський хрест',
            description: 'Класичний розклад на десять карт для глибшого розуміння.',
          },
        },
        positions: {
          past: {
            label: 'Минуле',
            detail: 'Що сформувало цей момент.',
          },
          present: {
            label: 'Теперішнє',
            detail: 'Де ти зараз.',
          },
          future: {
            label: 'Майбутнє',
            detail: 'Що назріває попереду.',
          },
          hidden: {
            label: 'Приховане',
            detail: 'Що непомітне або несвідоме.',
          },
          obstacles: {
            label: 'Перешкоди',
            detail: 'Напруга, з якою треба впоратися.',
          },
          external: {
            label: 'Зовнішнє',
            detail: 'Впливи навколо.',
          },
          advice: {
            label: 'Порада',
            detail: 'Найкращий підхід зараз.',
          },
          outcome: {
            label: 'Результат',
            detail: 'Куди може привести шлях.',
          },
          crossing: {
            label: 'Перехрестя',
            detail: 'Виклик, що перетинає шлях.',
          },
          conscious: {
            label: 'Свідоме',
            detail: 'Вгорі свідомості / фокус.',
          },
          subconscious: {
            label: 'Підсвідоме',
            detail: 'Основа під поверхнею.',
          },
          near_future: {
            label: 'Ближнє майбутнє',
            detail: 'Що наближається далі.',
          },
          self: {
            label: 'Я',
            detail: 'Де ти зараз.',
          },
          environment: {
            label: 'Оточення',
            detail: 'Зовнішні впливи.',
          },
          hopes_fears: {
            label: 'Надії та страхи',
            detail: 'Внутрішні напруги й бажання.',
          },
        },
        status: {
          tap_deck_deal: 'Торкнись колоди, щоб роздати {count} карт.',
          tap_deck_deal_short: 'Торкнись колоди, щоб роздати {count} карт',
          cards_dealt: 'Карти роздано. Торкнись кожної, щоб відкрити (торкнись колоди, щоб перетасувати).',
          tap_cards_reveal: 'Торкнись карт, щоб відкрити — торкнись колоди, щоб перетасувати',
          dealing: 'Роздаємо...',
          revealed_progress: 'Відкрито {revealed} з {total}. Продовжуй.',
          reading_complete: "Розклад завершено. Поміркуй над зв'язком.",
          shuffling: 'Перетасовуємо...',
          begin_reading: 'Торкнись колоди, щоб почати розклад «{spread}».',
        },
        advice: {
          positive: [
            'Обери один маленький крок сьогодні, який підтримує {theme}.',
            'Нехай {theme} веде одне практичне рішення цього тижня.',
            'Закріпи {theme} простою, конкретною дією.',
            'Зобов’яжись до стабільної дії, що зміцнює {theme}.',
          ],
          reversed: [
            'Віднови баланс {theme}, встановивши одну чітку межу.',
            'Заземли {theme} одним малим, стабільним кроком.',
            'Поверни {theme} до основ простим наступним кроком.',
          ],
          neutral: [
            'Обери один малий конкретний крок і зроби його сьогодні.',
            'Обери найпростіший наступний крок і доведи його до кінця.',
            'Назви найважливіше, а потім зроби один заземлений крок.',
          ],
          caution: [
            'Зупинись, спростись і зосередься на тому, що ти можеш контролювати.',
            'Постав межу, а потім зроби один стабілізуючий крок.',
            'Назви тиск, який відчуваєш, і пом’якши його одним малим кроком.',
          ],
          fallback: 'Зроби сьогодні один маленький заземлений крок.',
        },
        leads: {
          past: 'У твоєму минулому, ',
          present: 'Наразі, ',
          future: 'Попереду, ',
          near_future: 'У близькому майбутньому, ',
          outcome: 'Якщо поточний шлях триває, ',
          conscious: 'У твоїх думках, ',
          subconscious: 'Під поверхнею, ',
          crown: 'На вершині свідомості, ',
          foundation: 'У корені цього, ',
          crossing: 'Те, що перетинає тебе, — це те, що ',
          self: 'Те, як ти проявляєшся, — це те, що ',
          environment: 'Навколо тебе, ',
          hopes_fears: 'У твоїх надіях і страхах, ',
          advice: 'Твій найкращий наступний крок — помітити, що ',
          hidden: 'Те, що приховано, — це те, що ',
          obstacles: 'Перешкода тут у тому, що ',
          external: 'Зовнішні впливи показують, що ',
          love: 'У коханні, ',
          career: 'У справах кар’єри, ',
          finance: 'У питаннях грошей і ресурсів, ',
          default: 'У позиції {position}, ',
          generic: 'У цій позиції, ',
        },
        personalized: {
          past: '{card} вплинула на ваше минуле й задала тон тому, що є зараз.',
          present: '{card} підсвічує головну енергію поточного моменту.',
          future: '{card} вказує на енергію, що збирається попереду — підготуйтеся зустріти її.',
          hidden: '{card} відкриває те, що діє під поверхнею, хоч ви цього не бачите.',
          obstacles: '{card} показує напругу чи перешкоду, яку треба пройти.',
          external: '{card} відображає зовнішні впливи, що формують ситуацію.',
          advice: '{card} пропонує курс дій: рухайтесь із цією порадою.',
          outcome: '{card} окреслює ймовірний результат, якщо шлях не зміниться.',
          crossing: '{card} перетинає ваш шлях, ставлячи виклик напрямку.',
          conscious: '{card} віддзеркалює те, що у вас на думці й у полі зору.',
          subconscious: '{card} відображає те, що підсвідомо керує ситуацією.',
          near_future: '{card} наближається скоро — будьте готові до її уроку.',
          self: '{card} показує, як ви проявляєтесь і дієте зараз.',
          environment: '{card} відображає оточення та людей навколо.',
          hopes_and_fears: '{card} торкається і ваших надій, і ваших побоювань у цій справі.',
        },
      },
      daily: {
        kicker: 'Щоденне послання',
        title: 'Особиста карта дня',
        interpretation_label: 'Персоналізована інтерпретація',
        guidance_label: 'Порада',
        arcana: {
          major: 'Старші Аркани',
          minor: 'Молодші Аркани',
        },
        fallback: {
          keywords: 'Тихий фокус на сьогодні.',
          message: 'Нехай сьогодні буде м’яким перезапуском.',
          guidance: 'Обери одну конкретну дію, що підтримає твій фокус.',
        },
        reversed: ' (Перевернута)',
      },
      magic: {
        kicker: 'Магічна куля',
        title: 'Струси, щоб отримати відповідь',
        subtitle: 'Сформулюй чітке питання, потім струси телефон або торкнись кулі.',
        enable_motion: 'Увімкнути рух',
        status: {
          default: 'Струси телефон або торкнись кулі, щоб побачити послання.',
          motion_off: 'Доступ до руху вимкнено. Торкнись кулі, щоб отримати послання.',
          pending: 'Куля слухає...',
          tap_orb: 'Торкнись кулі, щоб отримати послання.',
          enable_motion: 'Увімкни рух або торкнись кулі, щоб отримати послання.',
          shake_again: 'Куля здригається. Запитай знову, коли будеш готовий/готова.',
          tap_again: 'Запитай знову, коли будеш готовий/готова.',
        },
        default_answer: 'Сформулюй питання.',
        responses: [
          'Так, але дай час.',
          'Ні, і це захист.',
          'Зроби наступний крок.',
          'Довіряй інстинкту.',
          'Зачекай на ясніші сигнали.',
          'Мале «так» відкриває більші двері.',
          'Обери простіший шлях.',
          'Зараз не час.',
          'Спробуй знову після відпочинку.',
          'Йди за іскрою, ігноруй шум.',
          'Відповідь уже близько.',
          'Нехай це розгорнеться без тиску.',
          'Зміни вже в русі.',
          'Відпусти важке.',
          'Рухайся м’яко, але рухайся.',
          'Спершу захисти свою енергію.',
          'Невдовзі з’явиться союзник.',
          'Ти вже знаєш відповідь.',
          'Скажи «ні», щоб зберегти «так».',
          'Це добрий знак.',
          'Пауза відкриє більше.',
          'Спочатку слухай, потім дій.',
          'Ризикуй обережно.',
          'Почни з найменшої дії.',
        ],
      },
      soulmate: {
        title: 'Портрет твоєї спорідненої душі',
        subtitle: 'Створено спеціально для тебе.',
        status: {
          preparing: 'Готуємо твій портрет...',
          loading: 'Завантажуємо твій портрет спорідненої душі...',
          no_quiz: 'Пройди опитування, щоб відкрити портрет спорідненої душі.',
          processing: 'Твій портрет спорідненої душі готується...',
          generating: 'Ми готуємо твій портрет спорідненої душі.',
        },
        image_alt: 'Портрет твоєї спорідненої душі',
      },
      prelude: {
        kicker: 'Вступ до Таро',
        title: 'Налаштуйся на розклад',
        subtitle: 'Зроби вдих. Тримай одне чесне питання.',
        steps: {
          breathe: {
            title: 'Дихай (10 секунд)',
            text: 'Повільний вдих, повільний видих. Дай шуму стихнути.',
          },
          focus: {
            title: 'Фокус',
            text: 'Одна ситуація, не десять. Ясність любить простоту.',
          },
          ask: {
            title: 'Запитай',
            text: 'Формулюй відкриті питання, які запрошують усвідомлення.',
          },
        },
        guides: {
          do: {
            title: 'Питай так',
            items: [
              'Що мені варто врахувати щодо ___?',
              'Яка енергія оточує ___?',
              'Як мені рухатися далі з ___?',
            ],
          },
          dont: {
            title: 'Уникай',
            items: ['Питань «так/ні».', 'Чи буде це або вони?', 'Кілька тем в одному розкладі.'],
          },
        },
        formula: {
          label: 'Формула запиту',
          text: 'Покажи, що мені потрібно зрозуміти про ___, щоб я міг/могла ___.',
        },
        ready: 'Я готовий/готова',
      },
      numerology: {
        view: {
          label: 'Мапа нумерології',
        },
        title: 'Мапа нумерології',
        subtitle: 'Швидкий, насичений огляд твоїх базових чисел і поточних циклів.',
        tabs: {
          profile: 'Мої числа',
          compatibility: "Зв'язок",
        },
        profile: {
          heading: 'Розкажи про себе',
          full_name: {
            label: "Повне ім'я:",
            placeholder: 'Наприклад: Іван Іванов',
            help: "Використай ім'я, яким користуєшся найчастіше, або як у документах.",
          },
          birth_date: {
            label: 'Дата народження:',
          },
          current_date: {
            label: 'Поточна дата (необов’язково):',
            help: 'Залиш порожнім, щоб використати сьогодні.',
          },
          submit: 'Відкрити мої числа',
          loading: 'Налаштовуємо твої числа...',
          core_signature: 'Ключова сигнатура',
        },
        formula: {
          show_math: 'Показати розрахунок',
        },
        numbers: {
          life_path: { title: 'Життєвий шлях' },
          destiny: { title: 'Доля' },
          soul: { title: 'Душа' },
          personality: { title: 'Особистість' },
        },
        cycles: {
          title: 'Поточні цикли',
          year: { title: 'Особистий рік' },
          month: { title: 'Особистий місяць' },
          day: { title: 'Особистий день' },
        },
        pinnacles: { title: 'Життєві вершини' },
        challenges: { title: 'Життєві уроки' },
        footer: 'Натхнено системою нумерології Жан Сімпсон.',
      },
      compatibility: {
        title: "Зв'язок",
        subtitle: 'Подивись, як взаємодіють дві карти й куди тече енергія.',
        person_a: {
          title: 'Особа A',
          full_name: { label: "Повне ім'я:", placeholder: 'Наприклад: Іван Іванов' },
          birth_date: { label: 'Дата народження:' },
        },
        person_b: {
          title: 'Особа B',
          full_name: { label: "Повне ім'я:", placeholder: 'Наприклад: Марія Петрова' },
          birth_date: { label: 'Дата народження:' },
        },
        submit: 'Перевірити сумісність',
        overall: {
          title: 'Загальна сумісність',
          how_to_read: 'Як читати цей показник?',
          scale_title: 'Шкала сумісності:',
          scale: {
            aligned: {
              label: '85–100% (Узгоджено):',
              text: 'сильний потік і природна підтримка',
            },
            supportive: {
              label: '70–84% (Підтримка):',
              text: 'стабільна база з простором для росту',
            },
            mixed: {
              label: '60–69% (Змішано):',
              text: 'потрібна увага й ясна комунікація',
            },
            growth: {
              label: 'Нижче 60% (Зона росту):',
              text: 'потребує наміру й турботи',
            },
          },
          important_label: 'Важливо:',
          important_text: 'Низький бал — не вирок. Він показує місця, що потребують уваги.',
        },
        details: {
          title: 'По числах',
          explanation:
            'Ми зважуємо Життєвий шлях (40%), Долю (30%), Душу (20%) та Особистість (10%), щоб отримати загальний бал.',
        },
        metrics: {
          why_it_matters: 'Чому це важливо',
          shows: 'Показує:',
          life_path: {
            title: 'Життєвий шлях',
            strong: 'Життєвий шлях',
            desc: 'показує довгу дугу: напрям, ритм і життєвий темп.',
            items: [
              'Узгодженість довгострокових цілей',
              'Як ви проходите зміни',
              'Потенціал витривалості',
            ],
          },
          destiny: {
            title: 'Доля',
            strong: 'Доля',
            desc: 'відображає цілі та те, як ви будуєте у світі.',
            items: ['Спільні амбіції та фокус', 'Як ви співпрацюєте в планах', 'Чи підсилюють сили чи конфліктують'],
          },
          soul: {
            title: 'Душа',
            strong: 'Душа',
            desc: 'говорить про емоційний тон і внутрішні потреби.',
            items: ['Емоційна резонансність', 'Як ви відновлюєтесь разом', 'Узгодженість внутрішніх цінностей'],
          },
          personality: {
            title: 'Особистість',
            strong: 'Особистість',
            desc: 'це соціальний шар: перше враження та зовнішній стиль.',
            items: ['Соціальна легкість і хімія', 'Як ви виглядаєте як пара', 'Публічна гармонія'],
          },
        },
        group: {
          title: 'Підпис пари',
          description: 'Спільний тон, створений вашими життєвими шляхами.',
          how_calculated: 'Як це обчислюється?',
          formula_label: 'Формула:',
          formula_text: 'Життєвий шлях A + Життєвий шлях B → редукція',
          highlights_label: 'Це число підкреслює:',
          items: ['Енергію, яку ви створюєте разом', 'Стиль зв’язку', 'Колективний потенціал'],
        },
        recommendations: {
          title: 'Рекомендований фокус',
        },
        loading: "Читаємо ваш зв'язок...",
      },
      palmistry: {
        view: {
          label: 'Тест з хіромантії',
        },
        title: 'Читання долоні',
        subtitle: 'За книгою Cheiro «Palmistry for All». Роздивись руку та пройди опитування.',
        intro: {
          title: 'Як читати свою руку',
          text: 'Використай домінантну руку. Порівняй форму, лінії та горби, потім обери найближчий варіант.',
          steps: [
            'Спершу зверни увагу на форму долоні й кінчики пальців.',
            'Проведи світлом по основних лініях.',
            'Обери найвиразніші горби, якщо виділяються два.',
          ],
        },
        hand_shape: {
          title: 'Форма руки',
          legend: 'Який тип руки найбільше схожий на ваш?',
          elementary: {
            title: 'Елементарна',
            desc: 'Коротка, товста долоня з масивними пальцями.',
          },
          square: {
            title: 'Квадратна (практична)',
            desc: 'Квадратна долоня, прямі краї, міцна будова.',
          },
          spatulate: {
            title: 'Лопатоподібна (активна)',
            desc: 'Розширені кінчики пальців, енергійний вигляд.',
          },
          philosophic: {
            title: 'Філософська',
            desc: 'Довга кістлява долоня з вузлуватими суглобами.',
          },
          conic: {
            title: 'Конічна (творча)',
            desc: 'Звужені пальці, м’які й граціозні.',
          },
          psychic: {
            title: 'Психічна (ідеалістична)',
            desc: 'Дуже тонкі, ніжні, витончені лінії.',
          },
          mixed: {
            title: 'Змішана',
            desc: 'Різні форми на пальцях і долоні.',
          },
        },
        major_lines: {
          title: 'Основні лінії',
          diagram_alt: 'Схема долоні з підписами п’яти головних ліній: серця, голови, життя, долі та сонця.',
          caption: 'Основні лінії: Серця, Голови, Життя, Долі, Сонця.',
          head: {
            legend: 'Лінія голови (мислення)',
            straight: { title: 'Пряма', desc: 'Чітка, рівна лінія через долоню.' },
            sloping: { title: 'Спадає вниз', desc: 'Опускається в бік Місяця.' },
            chained: { title: 'Ланцюжок або розірвана', desc: 'Схожа на ланцюг, фрагментована чи нерівна.' },
          },
          heart: {
            legend: 'Лінія серця (емоції)',
            jupiter: { title: 'Закінчується під вказівним', desc: 'Підіймається до горба Юпітера.' },
            between: { title: 'Між вказівним і середнім', desc: 'Збалансоване завершення між двома пальцями.' },
            saturn: { title: 'Під середнім', desc: 'Закінчується ближче до горба Сатурна.' },
            chained: { title: 'Ланцюжок або фрагменти', desc: 'Схожа на ланцюг, пунктир чи нерівність.' },
          },
          life: {
            legend: 'Лінія життя (життєва сила)',
            strong: { title: 'Довга і глибока', desc: 'Чітка дуга навколо великого пальця.' },
            faint: { title: 'Легка або мілка', desc: 'Легка лінія, тонка або вузька.' },
            broken: { title: 'Розірвана або з «острівцями»', desc: 'Розриви, острови чи перерви.' },
            mars: { title: 'Подвійна (лінія Марса)', desc: 'Паралельна лінія підтримки поруч.' },
          },
          fate: {
            legend: 'Лінія долі (кар’єрний шлях)',
            clear: { title: 'Чітка і рівна', desc: 'Йде вгору через центр.' },
            broken: { title: 'Слабка або розірвана', desc: 'Зміни, прогалини або кілька стартів.' },
            absent: { title: 'Відсутня або дуже слабка', desc: 'Немає виразної центральної лінії кар’єри.' },
          },
          sun: {
            legend: 'Лінія сонця (визнання)',
            clear: { title: 'Чітка або висхідна', desc: 'Видима лінія під безіменним пальцем.' },
            absent: { title: 'Слабка або відсутня', desc: 'Немає сильної лінії під безіменним пальцем.' },
          },
        },
        details: {
          title: 'Деталі та структура',
          thumb_flex: {
            legend: 'Гнучкість великого пальця',
            supple: { title: 'Гнучкий, відхиляється назад', desc: 'Гнучкий, легко відводиться назовні.' },
            firm: { title: 'Твердий і прямий', desc: 'Жорсткий, міцний, опирається згину.' },
          },
          thumb_length: {
            legend: 'Довжина великого пальця',
            long: { title: 'Довгий', desc: 'Дістає до першого суглоба пальця.' },
            balanced: { title: 'Збалансований', desc: 'Середня довжина і пропорція.' },
            short: { title: 'Короткий', desc: 'Помітно коротший за середній.' },
          },
          index_ring: {
            legend: 'Вказівний і безіменний',
            index: { title: 'Вказівний довший', desc: 'Палець Юпітера довший за безіменний.' },
            ring: { title: 'Безіменний довший', desc: 'Палець Сонця довший за вказівний.' },
            even: { title: 'Майже однакова довжина', desc: 'Збалансована довжина й пропорція.' },
          },
          mercury: {
            legend: 'Мізинець (Меркурій)',
            long: { title: 'Довгий', desc: 'Дістає майже до верхнього суглоба безіменного.' },
            short: { title: 'Короткий', desc: 'Закінчується нижче суглоба безіменного.' },
          },
          nails: {
            legend: 'Форма нігтів',
            long: { title: 'Довгі або вузькі', desc: 'Тонкі нігтьові ложа або довші нігті.' },
            short: { title: 'Короткі або широкі', desc: 'Коротші нігті, ширші ложа.' },
            balanced: { title: 'Середні й округлі', desc: 'Збалансовані, ні довгі, ні короткі.' },
          },
          mounts: {
            diagram_alt:
              'Схема долоні з підписами горбів: Юпітер, Сатурн, Аполлон, Меркурій, Венера, Марс, Місяць.',
            caption: 'Горби: Юпітер, Сатурн, Аполлон, Меркурій, Венера, Марс, Місяць.',
            legend: 'Виразні горби (обери до двох)',
            help: 'Шукай підвищення біля основи пальців або вздовж долоні.',
            venus: { title: 'Венера', desc: 'Основа великого пальця, тепло й прихильність.' },
            moon: { title: 'Місяць', desc: 'Зовнішній край долоні, уява і настрій.' },
            jupiter: { title: 'Юпітер', desc: 'Під вказівним, амбіції та лідерство.' },
            saturn: { title: 'Сатурн', desc: 'Під середнім, серйозність і фокус.' },
            sun: { title: 'Сонце (Аполлон)', desc: 'Під безіменним, радість і творчість.' },
            mercury: { title: 'Меркурій', desc: 'Під мізинцем, дотепність і комунікація.' },
            mars: { title: 'Марс', desc: 'Внутрішня долоня, відвага й витривалість.' },
          },
        },
        submit: 'Відкрити читання долоні',
        results: {
          primary: { title: 'Основний тип руки' },
          themes: { title: 'Головні теми' },
          lines: { title: 'Основні лінії' },
          notes: { title: 'Додаткові нотатки' },
          disclaimer: 'Хіромантія — це інтерпретація для роздумів, а не передбачення.',
        },
        traits: {
          practical: { label: 'Практичність', desc: 'Заземленість і стійкість, схильність до чітких планів і результатів.' },
          creative: { label: 'Творчість', desc: 'Тягнеться до краси, самовираження й оригінальності.' },
          intuitive: { label: 'Інтуїція', desc: 'Читає між рядками й довіряє внутрішнім сигналам.' },
          analytical: { label: 'Аналітичність', desc: 'Уважно досліджує деталі й прагне розуміння.' },
          ambitious: { label: 'Амбітність', desc: 'Прагне вести, вдосконалюватися й виходити на виклики.' },
          communicative: { label: 'Комунікабельність', desc: 'Виразний, переконливий і швидкий у мовленні.' },
          resilient: { label: 'Стійкість', desc: 'Сильна витривалість і стабільна енергія.' },
          adaptable: { label: 'Адаптивність', desc: 'Гнучкий, відкритий до змін і швидко адаптується.' },
          sensitive: { label: 'Чутливість', desc: 'Глибоко відчуває і помічає тонкі зміни.' },
          disciplined: { label: 'Дисциплінованість', desc: 'Стійка воля і послідовне доведення справ до кінця.' },
          grounded: { label: 'Заземленість', desc: 'Прямий, тілесний і зосереджений на головному.' },
          idealistic: { label: 'Ідеалізм', desc: 'Керується ідеалами, баченням і внутрішнім змістом.' },
        },
        tags: {
          instinctive: 'інстинктивний',
          direct: 'прямий',
          physical: 'фізичний',
          methodical: 'методичний',
          reliable: 'надійний',
          steady: 'стійкий',
          energetic: 'енергійний',
          inventive: 'винахідливий',
          restless: 'неспокійний',
          thoughtful: 'замислений',
          studious: 'дослідницький',
          independent: 'незалежний',
          artistic: 'творчий',
          sensitive: 'чутливий',
          aesthetic: 'естетичний',
          idealistic: 'ідеалістичний',
          intuitive: 'інтуїтивний',
          dreamy: 'мрійливий',
          versatile: 'універсальний',
          curious: 'допитливий',
          changeable: 'мінливий',
        },
        hand_types: {
          elementary: {
            title: 'Елементарна рука',
            desc:
              'Коротка і товста з масивними пальцями. Цей тип зосереджений на прямій дії, відчутних потребах і практичному відчутті життя.',
          },
          square: {
            title: 'Квадратна рука',
            desc:
              'Квадратна долоня та прямі краї вказують на практичну, методичну й надійну натуру, що цінує доказовість і структуру.',
          },
          spatulate: {
            title: 'Лопатоподібна рука',
            desc:
              'Розширені кінчики пальців і активна форма вказують на енергію, драйв і потяг до дії та інновацій.',
          },
          philosophic: {
            title: 'Філософська рука',
            desc:
              'Довга, кістлява долоня з вузлуватими суглобами. Вказує на вдумливий, аналітичний і рефлексивний темперамент.',
          },
          conic: {
            title: 'Конічна (творча) рука',
            desc:
              'Звужені пальці й м’яка долоня вказують на творчу чутливість, емоційну глибину та любов до краси.',
          },
          psychic: {
            title: 'Психічна (ідеалістична) рука',
            desc:
              'Тонкі, делікатні лінії натякають на внутрішню, інтуїтивну натуру, яка живе ідеалами та уявою.',
          },
          mixed: {
            title: 'Змішана рука',
            desc:
              'Поєднання форм у долоні та пальцях. Свідчить про універсальність і широкий спектр інтересів.',
          },
        },
        lines: {
          head: {
            label: 'Лінія голови',
            straight: 'Пряма лінія голови схиляє до практичного й логічного мислення.',
            sloping: 'Похилена лінія голови підтримує уяву, інтуїцію та творчість.',
            chained: 'Ланцюжкова лінія голови вказує на чутливість і змінний фокус.',
          },
          heart: {
            label: 'Лінія серця',
            jupiter: 'Завершення під вказівним пальцем вказує на ідеалізм у коханні.',
            between: 'Завершення між вказівним і середнім говорить про збалансовані емоції.',
            saturn: 'Завершення під середнім пальцем читається як стриманість і реалізм.',
            chained: 'Ланцюжкова або розірвана лінія вказує на глибоку чутливість у почуттях.',
          },
          life: {
            label: 'Лінія життя',
            strong: 'Довга й глибока означає сильну життєву силу та витривалість.',
            faint: 'Легка або мілка натякає на м’яку енергію і потребу в балансі.',
            broken: 'Розірвана або з «острівцями» означає періоди змін чи зсувів енергії.',
            mars: 'Паралельна лінія підтримки означає додаткову стійкість і відновлення.',
          },
          fate: {
            label: 'Лінія долі',
            clear: 'Чітка лінія долі свідчить про фокус і визначений шлях.',
            broken: 'Слабка або розірвана натякає на зміни в кар’єрі чи переосмислення.',
            absent: 'Відсутня лінія означає самостійний шлях із гнучкими виборами.',
          },
          sun: {
            label: 'Лінія сонця',
            clear: 'Чітка лінія сонця вказує на визнання й радість у самовираженні.',
            absent: 'Відсутня лінія означає приватне задоволення понад публічну увагу.',
          },
        },
        features: {
          thumb_flex: {
            supple: 'Гнучкий великий палець: гнучкість, адаптивність і щедрість у підході.',
            firm: 'Твердий великий палець: стійка воля та наполегливість.',
          },
          thumb_length: {
            long: 'Довгий великий палець: сильна воля і здатність доводити справи.',
            balanced: 'Збалансований великий палець: рівне поєднання волі та розуму.',
            short: 'Короткий великий палець: швидкі дії, спонтанні реакції.',
          },
          index_ring: {
            index: 'Вказівний довший: лідерський потяг і амбіції.',
            ring: 'Безіменний довший: творчий потяг і любов до краси.',
            even: 'Однакова довжина: збалансований підхід до авторитету й самовираження.',
          },
          mercury: {
            long: 'Довгий мізинець: сильні комунікативні навички.',
            short: 'Короткий мізинець: стримана, зважена мова.',
          },
          nails: {
            long: 'Довгі або вузькі нігті: чутливість і сприйнятливість.',
            short: 'Короткі або широкі нігті: прямий, енергійний характер.',
            balanced: 'Збалансовані нігті: рівний темперамент і самоконтроль.',
          },
        },
        mounts: {
          venus: 'Горб Венери: тепло, прихильність і магнетизм.',
          moon: 'Горб Місяця: уява і романтичний тон.',
          jupiter: 'Горб Юпітера: амбіції та лідерський потяг.',
          saturn: 'Горб Сатурна: серйозність і відповідальність.',
          sun: 'Горб Сонця: оптимізм і творче самовираження.',
          mercury: 'Горб Меркурія: дотепність, комерція та комунікація.',
          mars: 'Горб Марса: відвага й витривалість.',
        },
      },
      auth: {
        menu: {
          account_details: 'Деталі акаунта',
          language: 'Мова',
          logout: 'Вийти',
        },
        modal: {
          title: {
            account: 'Акаунт',
          },
          sign_out: 'Вийти',
        },
        page: {
          meta_title: 'Вхід — Arcana Table',
          title: {
            signin: 'Увійдіть до акаунту',
            signup: 'Створіть акаунт',
            account: 'Акаунт',
          },
          switch: {
            no_account: 'Немає акаунту?',
            signup: 'Зареєструватися',
            have_account: 'Вже є акаунт?',
            signin: 'Увійти',
          },
          name: {
            label: "Ваше ім'я",
            placeholder: "Введіть ім'я",
          },
          email: {
            label: 'Email',
            placeholder: 'Введіть email',
          },
          password: {
            label: 'Пароль',
            placeholder: 'Введіть пароль',
            toggle: 'Показати пароль',
            hint: 'Використайте 8+ символів із літерами, цифрами й знаками.',
          },
          submit: {
            signin: 'Увійти',
            signup: 'Зареєструватися',
          },
          forgot: 'Забули пароль?',
          reset: {
            title: 'Скидання пароля',
            text: 'Ми надішлемо лист із посиланням для скидання пароля.',
            set_title: 'Встановіть новий пароль',
            update_text: 'Введіть новий пароль, щоб завершити скидання акаунту.',
            send: 'Надіслати посилання',
            new_password: { label: 'Новий пароль', placeholder: 'Створіть новий пароль' },
            confirm: { label: 'Підтвердьте пароль', placeholder: 'Повторіть новий пароль' },
            update: 'Оновити пароль',
            back: 'Повернутися до входу',
          },
          verify: {
            title: 'Підтвердіть email',
            text_prefix: 'Ми надіслали посилання на',
            text_note: 'Натисніть посилання для підтвердження. Перевірте спам, якщо не бачите листа.',
            resend: 'Надіслати ще раз',
            try_another: 'Інший email?',
            back_to_login: 'Перейти до входу',
          },
        },
        status: {
          supabase_missing: 'Ключі Supabase відсутні.',
          enter_email_password: 'Введіть коректний email і пароль.',
          enter_name: "Введіть ім'я для створення акаунту.",
          creating_account: 'Створюємо акаунт...',
          check_email: 'Перевірте пошту, щоб підтвердити акаунт.',
          signing_in: 'Виконуємо вхід...',
          validating_reset: 'Перевіряємо посилання для скидання...',
          server_session_failed: 'Не вдалося створити сесію на сервері. Перевірте SUPABASE_URL у середовищі.',
          resend_link: 'Надсилаємо посилання ще раз...',
          link_resent: 'Посилання повторно надіслано.',
          enter_email_reset: 'Введіть email, щоб скинути пароль.',
          sending_reset: 'Надсилаємо посилання для скидання...',
          reset_sent: 'Посилання на скидання надіслано. Перевірте пошту.',
          reset_title: 'Скидання пароля',
          password_length: 'Використайте щонайменше 8 символів для нового пароля.',
          passwords_mismatch: 'Паролі не збігаються.',
          updating_password: 'Оновлюємо пароль...',
          password_updated: 'Пароль оновлено. Будь ласка, увійдіть.',
        },
      },
      numerology_messages: {
        number_label: 'Число {number}',
        personal_year_energy: 'Енергія особистого року: {number}',
        personal_month_energy: 'Енергія особистого місяця: {number}',
        personal_day_energy: 'Енергія особистого дня: {number}',
        ages_range: 'Вік {start}–{end}',
        age_from: 'Від {start} років',
        peak: 'Вершина {index}',
        lesson: 'Урок {index}',
        master_number: 'майстер-число',
        pair_example: 'Приклад: {p1} + {p2} = {sum} → {pair}',
        required_fields: "Будь ласка, заповніть обов'язкові поля.",
        invalid_birth: 'Введіть коректну дату народження.',
        birth_future: 'Дата народження не може бути в майбутньому.',
        invalid_current: 'Введіть коректну поточну дату.',
        current_future: 'Поточна дата не може бути в майбутньому.',
        current_before_birth: 'Поточна дата не може бути ранішою за дату народження.',
        calculation_failed: 'Наразі не вдалося виконати розрахунок.',
        generic_error: 'Щось пішло не так. Спробуйте ще раз трохи пізніше.',
        compatibility_required: 'Будь ласка, заповніть обидва профілі.',
        compatibility_invalid_dates: 'Будь ласка, введіть коректні дати народження.',
        compatibility_future: 'Дати народження не можуть бути в майбутньому.',
        compatibility_failed: 'Наразі не вдалося прочитати зв’язок.',
        compatibility_generic: 'Щось пішло не так під час перевірки сумісності.',
      },
      palmistry_messages: {
        required_questions: 'Будь ласка, дайте відповіді на всі обов’язкові запитання.',
        max_mounts: 'Будь ласка, оберіть до двох горбів.',
        select_hand: 'Будь ласка, оберіть тип руки.',
        traits_balanced: 'Ваші риси розподілилися рівномірно.',
        no_notes: 'Додаткові нотатки не обрані.',
      },
    },
  };

  const getPathValue = (lang, key) => {
    if (!key) return null;
    const parts = key.split('.');
    let current = translations[lang];
    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
    return current;
  };

  const normalizeLang = (lang) => {
    if (!lang) return null;
    const normalized = String(lang).toLowerCase();
    const short = normalized.split('-')[0];
    return SUPPORTED.includes(short) ? short : null;
  };

  const getQueryLang = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('lang');
    } catch (error) {
      return null;
    }
  };

  const getStoredLang = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  };

  const getBrowserLang = () => {
    if (typeof navigator === 'undefined') return null;
    return navigator.language || navigator.userLanguage || null;
  };

  const replaceVars = (text, vars) => {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(vars, key)) {
        return String(vars[key]);
      }
      return match;
    });
  };

  let currentLang =
    normalizeLang(getQueryLang()) || normalizeLang(getStoredLang()) || normalizeLang(getBrowserLang()) || 'en';

  const t = (key, vars) => {
    const value = getPathValue(currentLang, key) ?? getPathValue('en', key);
    if (typeof value === 'string') {
      return replaceVars(value, vars);
    }
    return value ?? '';
  };

  const list = (key) => {
    const value = getPathValue(currentLang, key) ?? getPathValue('en', key);
    return Array.isArray(value) ? value : [];
  };

  const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = t(key);
      if (typeof value === 'string' && value.length) {
        el.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const raw = el.getAttribute('data-i18n-attr') || '';
      const pairs = raw
        .split(/[;,]/)
        .map((part) => part.trim())
        .filter(Boolean);
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        if (!attr || !key) return;
        const value = t(key);
        if (typeof value === 'string' && value.length) {
          el.setAttribute(attr, value);
        }
      });
    });

    if (document.documentElement) {
      document.documentElement.lang = currentLang;
    }
  };

  const setLanguage = (lang, options = {}) => {
    const next = normalizeLang(lang) || 'en';
    if (next === currentLang) {
      applyTranslations();
      return;
    }
    currentLang = next;
    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, currentLang);
      } catch (error) {
        // Ignore storage errors.
      }
    }
    if (options.updateUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', currentLang);
        window.history.replaceState({}, document.title, url.toString());
      } catch (error) {
        // Ignore URL errors.
      }
    }
    applyTranslations();
    window.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: currentLang } }));
  };

  window.i18n = {
    t,
    list,
    setLanguage,
    getLanguage: () => currentLang,
    applyTranslations,
    translations,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyTranslations();
    });
  } else {
    applyTranslations();
  }

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = currentLang;
    languageSelect.addEventListener('change', (event) => {
      const value = event.target.value;
      setLanguage(value, { updateUrl: true });
    });
  }
})();
