const i18n = window.i18n || {};
const t = (key, vars) => (typeof i18n.t === 'function' ? i18n.t(key, vars) : key);

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
      labelKey: 'palmistry.traits.practical.label',
      descriptionKey: 'palmistry.traits.practical.desc'
    },
    creative: {
      labelKey: 'palmistry.traits.creative.label',
      descriptionKey: 'palmistry.traits.creative.desc'
    },
    intuitive: {
      labelKey: 'palmistry.traits.intuitive.label',
      descriptionKey: 'palmistry.traits.intuitive.desc'
    },
    analytical: {
      labelKey: 'palmistry.traits.analytical.label',
      descriptionKey: 'palmistry.traits.analytical.desc'
    },
    ambitious: {
      labelKey: 'palmistry.traits.ambitious.label',
      descriptionKey: 'palmistry.traits.ambitious.desc'
    },
    communicative: {
      labelKey: 'palmistry.traits.communicative.label',
      descriptionKey: 'palmistry.traits.communicative.desc'
    },
    resilient: {
      labelKey: 'palmistry.traits.resilient.label',
      descriptionKey: 'palmistry.traits.resilient.desc'
    },
    adaptable: {
      labelKey: 'palmistry.traits.adaptable.label',
      descriptionKey: 'palmistry.traits.adaptable.desc'
    },
    sensitive: {
      labelKey: 'palmistry.traits.sensitive.label',
      descriptionKey: 'palmistry.traits.sensitive.desc'
    },
    disciplined: {
      labelKey: 'palmistry.traits.disciplined.label',
      descriptionKey: 'palmistry.traits.disciplined.desc'
    },
    grounded: {
      labelKey: 'palmistry.traits.grounded.label',
      descriptionKey: 'palmistry.traits.grounded.desc'
    },
    idealistic: {
      labelKey: 'palmistry.traits.idealistic.label',
      descriptionKey: 'palmistry.traits.idealistic.desc'
    }
  };

  const HAND_TYPES = {
    elementary: {
      titleKey: 'palmistry.hand_types.elementary.title',
      descriptionKey: 'palmistry.hand_types.elementary.desc',
      tags: [
        'palmistry.tags.instinctive',
        'palmistry.tags.direct',
        'palmistry.tags.physical'
      ],
      traits: { grounded: 3, resilient: 1 }
    },
    square: {
      titleKey: 'palmistry.hand_types.square.title',
      descriptionKey: 'palmistry.hand_types.square.desc',
      tags: [
        'palmistry.tags.methodical',
        'palmistry.tags.reliable',
        'palmistry.tags.steady'
      ],
      traits: { practical: 3, disciplined: 1 }
    },
    spatulate: {
      titleKey: 'palmistry.hand_types.spatulate.title',
      descriptionKey: 'palmistry.hand_types.spatulate.desc',
      tags: [
        'palmistry.tags.energetic',
        'palmistry.tags.inventive',
        'palmistry.tags.restless'
      ],
      traits: { adaptable: 2, resilient: 1 }
    },
    philosophic: {
      titleKey: 'palmistry.hand_types.philosophic.title',
      descriptionKey: 'palmistry.hand_types.philosophic.desc',
      tags: [
        'palmistry.tags.thoughtful',
        'palmistry.tags.studious',
        'palmistry.tags.independent'
      ],
      traits: { analytical: 2, sensitive: 1 }
    },
    conic: {
      titleKey: 'palmistry.hand_types.conic.title',
      descriptionKey: 'palmistry.hand_types.conic.desc',
      tags: [
        'palmistry.tags.artistic',
        'palmistry.tags.sensitive',
        'palmistry.tags.aesthetic'
      ],
      traits: { creative: 2, sensitive: 1 }
    },
    psychic: {
      titleKey: 'palmistry.hand_types.psychic.title',
      descriptionKey: 'palmistry.hand_types.psychic.desc',
      tags: [
        'palmistry.tags.idealistic',
        'palmistry.tags.intuitive',
        'palmistry.tags.dreamy'
      ],
      traits: { idealistic: 2, intuitive: 2 }
    },
    mixed: {
      titleKey: 'palmistry.hand_types.mixed.title',
      descriptionKey: 'palmistry.hand_types.mixed.desc',
      tags: [
        'palmistry.tags.versatile',
        'palmistry.tags.curious',
        'palmistry.tags.changeable'
      ],
      traits: { adaptable: 2, communicative: 1 }
    }
  };

  const LINE_QUESTIONS = {
    headLine: {
      labelKey: 'palmistry.lines.head.label',
      options: {
        straight: {
          descriptionKey: 'palmistry.lines.head.straight',
          traits: { practical: 2, analytical: 1 }
        },
        sloping: {
          descriptionKey: 'palmistry.lines.head.sloping',
          traits: { intuitive: 2, creative: 1 }
        },
        chained: {
          descriptionKey: 'palmistry.lines.head.chained',
          traits: { sensitive: 1, adaptable: 1 }
        }
      }
    },
    heartLine: {
      labelKey: 'palmistry.lines.heart.label',
      options: {
        jupiter: {
          descriptionKey: 'palmistry.lines.heart.jupiter',
          traits: { idealistic: 2, sensitive: 1 }
        },
        between: {
          descriptionKey: 'palmistry.lines.heart.between',
          traits: { adaptable: 1, sensitive: 1 }
        },
        saturn: {
          descriptionKey: 'palmistry.lines.heart.saturn',
          traits: { analytical: 1, practical: 1 }
        },
        chained: {
          descriptionKey: 'palmistry.lines.heart.chained',
          traits: { sensitive: 2 }
        }
      }
    },
    lifeLine: {
      labelKey: 'palmistry.lines.life.label',
      options: {
        strong: {
          descriptionKey: 'palmistry.lines.life.strong',
          traits: { resilient: 2 }
        },
        faint: {
          descriptionKey: 'palmistry.lines.life.faint',
          traits: { sensitive: 1 }
        },
        broken: {
          descriptionKey: 'palmistry.lines.life.broken',
          traits: { adaptable: 1 }
        },
        mars: {
          descriptionKey: 'palmistry.lines.life.mars',
          traits: { resilient: 2, disciplined: 1 }
        }
      }
    },
    fateLine: {
      labelKey: 'palmistry.lines.fate.label',
      options: {
        clear: {
          descriptionKey: 'palmistry.lines.fate.clear',
          traits: { ambitious: 1, disciplined: 1 }
        },
        broken: {
          descriptionKey: 'palmistry.lines.fate.broken',
          traits: { adaptable: 2 }
        },
        absent: {
          descriptionKey: 'palmistry.lines.fate.absent',
          traits: { adaptable: 1, creative: 1 }
        }
      }
    },
    sunLine: {
      labelKey: 'palmistry.lines.sun.label',
      options: {
        clear: {
          descriptionKey: 'palmistry.lines.sun.clear',
          traits: { creative: 1, ambitious: 1 }
        },
        absent: {
          descriptionKey: 'palmistry.lines.sun.absent',
          traits: { sensitive: 1 }
        }
      }
    }
  };

  const FEATURE_QUESTIONS = {
    thumbFlex: {
      options: {
        supple: {
          noteKey: 'palmistry.features.thumb_flex.supple',
          traits: { adaptable: 2, sensitive: 1 }
        },
        firm: {
          noteKey: 'palmistry.features.thumb_flex.firm',
          traits: { disciplined: 2, ambitious: 1 }
        }
      }
    },
    thumbLength: {
      options: {
        long: {
          noteKey: 'palmistry.features.thumb_length.long',
          traits: { disciplined: 2 }
        },
        balanced: {
          noteKey: 'palmistry.features.thumb_length.balanced',
          traits: { practical: 1 }
        },
        short: {
          noteKey: 'palmistry.features.thumb_length.short',
          traits: { adaptable: 1, sensitive: 1 }
        }
      }
    },
    indexRing: {
      options: {
        index: {
          noteKey: 'palmistry.features.index_ring.index',
          traits: { ambitious: 2 }
        },
        ring: {
          noteKey: 'palmistry.features.index_ring.ring',
          traits: { creative: 2 }
        },
        even: {
          noteKey: 'palmistry.features.index_ring.even',
          traits: { practical: 1 }
        }
      }
    },
    mercuryLength: {
      options: {
        long: {
          noteKey: 'palmistry.features.mercury.long',
          traits: { communicative: 2 }
        },
        short: {
          noteKey: 'palmistry.features.mercury.short',
          traits: { sensitive: 1 }
        }
      }
    },
    nails: {
      options: {
        long: {
          noteKey: 'palmistry.features.nails.long',
          traits: { sensitive: 1, intuitive: 1 }
        },
        short: {
          noteKey: 'palmistry.features.nails.short',
          traits: { resilient: 1, practical: 1 }
        },
        balanced: {
          noteKey: 'palmistry.features.nails.balanced',
          traits: { practical: 1 }
        }
      }
    }
  };

  const MOUNTS = {
    venus: {
      noteKey: 'palmistry.mounts.venus',
      traits: { sensitive: 1 }
    },
    moon: {
      noteKey: 'palmistry.mounts.moon',
      traits: { intuitive: 2 }
    },
    jupiter: {
      noteKey: 'palmistry.mounts.jupiter',
      traits: { ambitious: 2 }
    },
    saturn: {
      noteKey: 'palmistry.mounts.saturn',
      traits: { analytical: 1, practical: 1 }
    },
    sun: {
      noteKey: 'palmistry.mounts.sun',
      traits: { creative: 1 }
    },
    mercury: {
      noteKey: 'palmistry.mounts.mercury',
      traits: { communicative: 1 }
    },
    mars: {
      noteKey: 'palmistry.mounts.mars',
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
      span.textContent = t(tag);
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
      li.textContent = t('palmistry_messages.traits_balanced');
      traitsEl.appendChild(li);
      return;
    }

    sorted.forEach(([trait]) => {
      const def = TRAIT_DEFS[trait];
      if (!def) return;
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = `${t(def.labelKey)}: `;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(t(def.descriptionKey)));
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
      li.textContent = t('palmistry_messages.no_notes');
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
        showError(t('palmistry_messages.required_questions'));
        return;
      }
    }

    const selectedMounts = formData.getAll('mounts');
    if (selectedMounts.length > 2) {
      showError(t('palmistry_messages.max_mounts'));
      return;
    }

    const handTypeKey = formData.get('handType');
    const handTypeData = HAND_TYPES[handTypeKey];
    if (!handTypeData) {
      showError(t('palmistry_messages.select_hand'));
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
      lineResults.push({ label: t(data.labelKey), description: t(option.descriptionKey) });
      addTraits(traitScores, option.traits);
    });

    Object.entries(FEATURE_QUESTIONS).forEach(([field, data]) => {
      const value = formData.get(field);
      const option = data.options[value];
      if (!option) return;
      if (option.noteKey) {
        notes.push(t(option.noteKey));
      }
      addTraits(traitScores, option.traits);
    });

    selectedMounts.forEach((mountKey) => {
      const mount = MOUNTS[mountKey];
      if (!mount) return;
      if (mount.noteKey) {
        notes.push(t(mount.noteKey));
      }
      addTraits(traitScores, mount.traits);
    });

    handTypeTitleEl.textContent = t(handTypeData.titleKey);
    handTypeDescEl.textContent = t(handTypeData.descriptionKey);
    renderTags(handTypeData.tags || []);
    renderTraits(traitScores);
    renderLines(lineResults);
    renderNotes(notes);

    resultsEl.classList.remove('hidden');
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
