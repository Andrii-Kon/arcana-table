const palmistryForm = document.getElementById('palmistryForm');

if (palmistryForm) {
  const resultsEl = document.getElementById('palmistryResults');
  const errorEl = document.getElementById('palmistryError');
  const errorMessageEl = document.getElementById('palmistryErrorMessage');
  const handTypeTitleEl = document.getElementById('palmistryHandTypeTitle');
  const handTypeDescEl = document.getElementById('palmistryHandTypeDesc');
  const handTypeTagsEl = document.getElementById('palmistryHandTypeTags');
  const traitsEl = document.getElementById('palmistryTraits');
  const linesEl = document.getElementById('palmistryLines');
  const notesEl = document.getElementById('palmistryNotes');

  const TRAIT_DEFS = {
    practical: {
      label: 'Practical',
      description: 'Grounded, steady, prefers clear plans and results.'
    },
    creative: {
      label: 'Creative',
      description: 'Drawn to beauty, expression, and originality.'
    },
    intuitive: {
      label: 'Intuitive',
      description: 'Reads between the lines and trusts inner signals.'
    },
    analytical: {
      label: 'Analytical',
      description: 'Studies details carefully and seeks understanding.'
    },
    ambitious: {
      label: 'Ambitious',
      description: 'Driven to lead, improve, or rise into challenges.'
    },
    communicative: {
      label: 'Communicative',
      description: 'Expressive, persuasive, and quick with language.'
    },
    resilient: {
      label: 'Resilient',
      description: 'Strong endurance and steady energy.'
    },
    adaptable: {
      label: 'Adaptable',
      description: 'Flexible, open to change, and fast to adjust.'
    },
    sensitive: {
      label: 'Sensitive',
      description: 'Feels deeply and notices subtle shifts.'
    },
    disciplined: {
      label: 'Disciplined',
      description: 'Steady willpower and consistent follow-through.'
    },
    grounded: {
      label: 'Grounded',
      description: 'Direct, physical, and focused on essentials.'
    },
    idealistic: {
      label: 'Idealistic',
      description: 'Guided by ideals, vision, and inner meaning.'
    }
  };

  const HAND_TYPES = {
    elementary: {
      title: 'Elementary hand',
      description:
        'Short and thick with heavy fingers. This type focuses on direct action, tangible needs, and a practical sense of life.',
      tags: ['instinctive', 'direct', 'physical'],
      traits: { grounded: 3, resilient: 1 }
    },
    square: {
      title: 'Square hand',
      description:
        'Square palm and straight edges point to a practical, methodical, and reliable nature that values proof and structure.',
      tags: ['methodical', 'reliable', 'steady'],
      traits: { practical: 3, disciplined: 1 }
    },
    spatulate: {
      title: 'Spatulate hand',
      description:
        'Widened finger tips and an active shape suggest energy, drive, and a taste for action and innovation.',
      tags: ['energetic', 'inventive', 'restless'],
      traits: { adaptable: 2, resilient: 1 }
    },
    philosophic: {
      title: 'Philosophic hand',
      description:
        'Long, bony palm with knotty joints. Indicates a thoughtful, analytical, and reflective temperament.',
      tags: ['thoughtful', 'studious', 'independent'],
      traits: { analytical: 2, sensitive: 1 }
    },
    conic: {
      title: 'Conic (artistic) hand',
      description:
        'Tapered fingers and a soft palm point to artistic sensitivity, emotional depth, and love of beauty.',
      tags: ['artistic', 'sensitive', 'aesthetic'],
      traits: { creative: 2, sensitive: 1 }
    },
    psychic: {
      title: 'Psychic (idealistic) hand',
      description:
        'Fine, delicate lines suggest an inward, intuitive nature that lives strongly in ideals and imagination.',
      tags: ['idealistic', 'intuitive', 'dreamy'],
      traits: { idealistic: 2, intuitive: 2 }
    },
    mixed: {
      title: 'Mixed hand',
      description:
        'A blend of shapes across the palm and fingers. Suggests versatility and a wide range of interests.',
      tags: ['versatile', 'curious', 'changeable'],
      traits: { adaptable: 2, communicative: 1 }
    }
  };

  const LINE_QUESTIONS = {
    headLine: {
      label: 'Head line',
      options: {
        straight: {
          description: 'A straight head line leans practical and logical in thought.',
          traits: { practical: 2, analytical: 1 }
        },
        sloping: {
          description: 'A sloping head line favors imagination, intuition, and creativity.',
          traits: { intuitive: 2, creative: 1 }
        },
        chained: {
          description: 'A chained head line suggests mental sensitivity and shifting focus.',
          traits: { sensitive: 1, adaptable: 1 }
        }
      }
    },
    heartLine: {
      label: 'Heart line',
      options: {
        jupiter: {
          description: 'Ending under the index finger points to idealism in love.',
          traits: { idealistic: 2, sensitive: 1 }
        },
        between: {
          description: 'Ending between index and middle suggests balanced emotions.',
          traits: { adaptable: 1, sensitive: 1 }
        },
        saturn: {
          description: 'Ending under the middle finger reads as reserved and realistic.',
          traits: { analytical: 1, practical: 1 }
        },
        chained: {
          description: 'Chained or broken points to deep sensitivity in feelings.',
          traits: { sensitive: 2 }
        }
      }
    },
    lifeLine: {
      label: 'Life line',
      options: {
        strong: {
          description: 'Long and deep suggests strong vitality and steady stamina.',
          traits: { resilient: 2 }
        },
        faint: {
          description: 'Faint or shallow suggests gentle energy and need for balance.',
          traits: { sensitive: 1 }
        },
        broken: {
          description: 'Broken or islanded indicates periods of change or shifts in energy.',
          traits: { adaptable: 1 }
        },
        mars: {
          description: 'A parallel support line signals extra resilience and recovery.',
          traits: { resilient: 2, disciplined: 1 }
        }
      }
    },
    fateLine: {
      label: 'Fate line',
      options: {
        clear: {
          description: 'A clear fate line suggests focus and a defined path.',
          traits: { ambitious: 1, disciplined: 1 }
        },
        broken: {
          description: 'Faint or broken suggests career shifts or reinventions.',
          traits: { adaptable: 2 }
        },
        absent: {
          description: 'Absent suggests a self-directed path with flexible choices.',
          traits: { adaptable: 1, creative: 1 }
        }
      }
    },
    sunLine: {
      label: 'Sun line',
      options: {
        clear: {
          description: 'A clear sun line points to recognition and joy in expression.',
          traits: { creative: 1, ambitious: 1 }
        },
        absent: {
          description: 'Absent suggests private satisfaction over public attention.',
          traits: { sensitive: 1 }
        }
      }
    }
  };

  const FEATURE_QUESTIONS = {
    thumbFlex: {
      options: {
        supple: {
          note: 'Supple thumb: flexible, adaptable, and generous in approach.',
          traits: { adaptable: 2, sensitive: 1 }
        },
        firm: {
          note: 'Firm thumb: steady willpower and persistence.',
          traits: { disciplined: 2, ambitious: 1 }
        }
      }
    },
    thumbLength: {
      options: {
        long: {
          note: 'Long thumb: strong will and follow-through.',
          traits: { disciplined: 2 }
        },
        balanced: {
          note: 'Balanced thumb: even mix of will and reason.',
          traits: { practical: 1 }
        },
        short: {
          note: 'Short thumb: quick to act, spontaneous responses.',
          traits: { adaptable: 1, sensitive: 1 }
        }
      }
    },
    indexRing: {
      options: {
        index: {
          note: 'Index longer: leadership drive and ambition.',
          traits: { ambitious: 2 }
        },
        ring: {
          note: 'Ring longer: artistic pull and love of beauty.',
          traits: { creative: 2 }
        },
        even: {
          note: 'Even length: balanced approach to authority and expression.',
          traits: { practical: 1 }
        }
      }
    },
    mercuryLength: {
      options: {
        long: {
          note: 'Long Mercury finger: strong communication skills.',
          traits: { communicative: 2 }
        },
        short: {
          note: 'Short Mercury finger: private, measured speech.',
          traits: { sensitive: 1 }
        }
      }
    },
    nails: {
      options: {
        long: {
          note: 'Long or narrow nails: sensitive and perceptive.',
          traits: { sensitive: 1, intuitive: 1 }
        },
        short: {
          note: 'Short or broad nails: direct, energetic nature.',
          traits: { resilient: 1, practical: 1 }
        },
        balanced: {
          note: 'Balanced nails: steady temperament and control.',
          traits: { practical: 1 }
        }
      }
    }
  };

  const MOUNTS = {
    venus: {
      note: 'Venus mount: warmth, affection, and magnetism.',
      traits: { sensitive: 1 }
    },
    moon: {
      note: 'Moon mount: imagination and romantic tone.',
      traits: { intuitive: 2 }
    },
    jupiter: {
      note: 'Jupiter mount: ambition and leadership drive.',
      traits: { ambitious: 2 }
    },
    saturn: {
      note: 'Saturn mount: seriousness and responsibility.',
      traits: { analytical: 1, practical: 1 }
    },
    sun: {
      note: 'Sun mount: optimism and creative expression.',
      traits: { creative: 1 }
    },
    mercury: {
      note: 'Mercury mount: wit, commerce, and communication.',
      traits: { communicative: 1 }
    },
    mars: {
      note: 'Mars mount: courage and endurance.',
      traits: { resilient: 2 }
    }
  };

  const REQUIRED_FIELDS = [
    'handType',
    'headLine',
    'heartLine',
    'lifeLine',
    'fateLine',
    'sunLine',
    'thumbFlex',
    'thumbLength',
    'indexRing',
    'mercuryLength',
    'nails'
  ];

  const addTraits = (scoreMap, traits) => {
    if (!traits) return;
    Object.entries(traits).forEach(([trait, value]) => {
      scoreMap[trait] = (scoreMap[trait] || 0) + value;
    });
  };

  const clearResults = () => {
    resultsEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    errorMessageEl.textContent = '';
  };

  const showError = (message) => {
    resultsEl.classList.add('hidden');
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
  };

  const renderTags = (tags) => {
    handTypeTagsEl.innerHTML = '';
    tags.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      handTypeTagsEl.appendChild(span);
    });
  };

  const renderTraits = (traitScores) => {
    traitsEl.innerHTML = '';
    const sorted = Object.entries(traitScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sorted.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Your traits balance evenly across the quiz.';
      traitsEl.appendChild(li);
      return;
    }

    sorted.forEach(([trait]) => {
      const def = TRAIT_DEFS[trait];
      if (!def) return;
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = `${def.label}: `;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(def.description));
      traitsEl.appendChild(li);
    });
  };

  const renderLines = (lines) => {
    linesEl.innerHTML = '';
    lines.forEach((line) => {
      const card = document.createElement('div');
      card.className = 'line-card';
      const title = document.createElement('h4');
      title.textContent = line.label;
      const desc = document.createElement('p');
      desc.textContent = line.description;
      card.appendChild(title);
      card.appendChild(desc);
      linesEl.appendChild(card);
    });
  };

  const renderNotes = (notes) => {
    notesEl.innerHTML = '';
    if (notes.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No extra notes selected.';
      notesEl.appendChild(li);
      return;
    }
    notes.forEach((note) => {
      const li = document.createElement('li');
      li.textContent = note;
      notesEl.appendChild(li);
    });
  };

  palmistryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearResults();

    const formData = new FormData(palmistryForm);
    for (const field of REQUIRED_FIELDS) {
      if (!formData.get(field)) {
        showError('Please answer all required questions.');
        return;
      }
    }

    const selectedMounts = formData.getAll('mounts');
    if (selectedMounts.length > 2) {
      showError('Please select up to two mounts.');
      return;
    }

    const handTypeKey = formData.get('handType');
    const handTypeData = HAND_TYPES[handTypeKey];
    if (!handTypeData) {
      showError('Please select a hand type.');
      return;
    }

    const traitScores = {};
    const notes = [];
    const lineResults = [];

    addTraits(traitScores, handTypeData.traits);

    Object.entries(LINE_QUESTIONS).forEach(([field, data]) => {
      const value = formData.get(field);
      const option = data.options[value];
      if (!option) return;
      lineResults.push({ label: data.label, description: option.description });
      addTraits(traitScores, option.traits);
    });

    Object.entries(FEATURE_QUESTIONS).forEach(([field, data]) => {
      const value = formData.get(field);
      const option = data.options[value];
      if (!option) return;
      if (option.note) {
        notes.push(option.note);
      }
      addTraits(traitScores, option.traits);
    });

    selectedMounts.forEach((mountKey) => {
      const mount = MOUNTS[mountKey];
      if (!mount) return;
      if (mount.note) {
        notes.push(mount.note);
      }
      addTraits(traitScores, mount.traits);
    });

    handTypeTitleEl.textContent = handTypeData.title;
    handTypeDescEl.textContent = handTypeData.description;
    renderTags(handTypeData.tags || []);
    renderTraits(traitScores);
    renderLines(lineResults);
    renderNotes(notes);

    resultsEl.classList.remove('hidden');
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
