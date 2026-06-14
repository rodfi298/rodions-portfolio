(async function () {
  const supportedLanguages = ["lv", "ru", "en"];
  const savedLanguage = window.localStorage.getItem("portfolio-language");

  const state = {
    language: supportedLanguages.includes(savedLanguage) ? savedLanguage : "lv",
    filter: "all",
    activeProject: null,
  };

  const elements = {
    filters: document.querySelector("#filters"),
    grid: document.querySelector("#project-grid"),
    metrics: document.querySelector("#metrics"),
    experience: document.querySelector("#experience-grid"),
    socials: document.querySelector("#social-links"),
    modal: document.querySelector("#project-modal"),
    modalMeta: document.querySelector("#modal-meta"),
    modalTitle: document.querySelector("#modal-title"),
    modalDescription: document.querySelector("#modal-description"),
    modalMedia: document.querySelector("#modal-media"),
  };

  let data = null;

  async function loadData() {
    const response = await fetch("content/site.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Content request failed: ${response.status}`);
    }

    return response.json();
  }

  function translate(key) {
    return data.copy[state.language][key] || data.copy.lv[key] || key;
  }

  function localize(value) {
    if (!value || typeof value === "string") {
      return value || "";
    }

    return value[state.language] || value.lv || Object.values(value)[0] || "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function icon(name) {
    const icons = {
      play:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.7v8.6c0 .7.8 1.1 1.4.7l6.8-4.3c.5-.3.5-1.1 0-1.4L10.4 7c-.6-.4-1.4 0-1.4.7Z"/></svg>',
      expand:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>',
    };

    return icons[name] || "";
  }

  function splitName(name) {
    const parts = String(name || "Rodions Timošins").trim().split(/\s+/);

    if (parts.length < 2) {
      return escapeHtml(parts[0] || "Rodions");
    }

    return `${escapeHtml(parts.slice(0, -1).join(" "))} <br />${escapeHtml(parts.at(-1))}`;
  }

  function telHref(phone) {
    return `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
  }

  function projectKindLabel(project) {
    const labels = {
      video: "kindVideo",
      photo: "kindPhoto",
      design: "kindDesign",
      "3d": "kind3d",
    };

    return translate(labels[project.kind] || "kindDesign");
  }

  function renderProfile() {
    const name = data.profile?.name || "Rodions Timošins";
    const portrait = data.profile?.portrait || "assets/profile/rodions-portrait.jpg";
    const email = data.contact?.email || "";
    const phone = data.contact?.phone || "";
    const location = localize(data.profile?.location || data.contact?.location);

    document.querySelectorAll('[data-profile="name"]').forEach((node) => {
      node.innerHTML = splitName(name);
    });

    document.querySelectorAll('[data-profile="portrait"]').forEach((node) => {
      node.setAttribute("src", portrait);
      node.setAttribute("alt", name);
    });

    document.querySelectorAll('[data-contact="email"]').forEach((node) => {
      node.textContent = email;
      node.setAttribute("href", `mailto:${email}`);
    });

    document.querySelectorAll('[data-contact="phone"]').forEach((node) => {
      node.textContent = phone;
      node.setAttribute("href", telHref(phone));
    });

    document.querySelectorAll('[data-contact="location"]').forEach((node) => {
      node.textContent = location;
    });
  }

  function renderStaticCopy() {
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = translate(node.dataset.i18n);
    });

    const headline = localize(data.profile?.headline);
    if (headline) {
      document.querySelector(".hero-role").textContent = headline;
    }

    document.querySelectorAll("[data-lang]").forEach((button) => {
      const isActive = button.dataset.lang === state.language;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderMetrics() {
    elements.metrics.innerHTML = data.metrics
      .map(
        (metric) => `
          <div class="metric">
            <strong>${escapeHtml(metric.value)}</strong>
            <span>${escapeHtml(localize(metric.label))}</span>
          </div>
        `,
      )
      .join("");
  }

  function renderFilters() {
    const labels = {
      all: "filterAll",
      video: "filterVideo",
      design: "filterDesign",
      photo: "filterPhoto",
      "3d": "filter3d",
    };

    elements.filters.innerHTML = data.filters
      .map(
        (filter) => `
          <button
            type="button"
            class="${filter === state.filter ? "is-active" : ""}"
            data-filter="${escapeHtml(filter)}"
            aria-pressed="${filter === state.filter}"
          >
            ${escapeHtml(translate(labels[filter]))}
          </button>
        `,
      )
      .join("");
  }

  function renderProjects() {
    const projects =
      state.filter === "all"
        ? data.projects
        : data.projects.filter((project) => project.category === state.filter);

    elements.grid.innerHTML = projects
      .map(
        (project) => `
          <article class="project-card">
            <button type="button" data-project-id="${escapeHtml(project.id)}">
              <span class="project-poster">
                <img
                  src="${escapeHtml(project.poster)}"
                  alt="${escapeHtml(project.title)}"
                  loading="lazy"
                  decoding="async"
                />
                ${
                  project.kind === "video"
                    ? `<span class="play-mark">${icon("play")}</span>`
                    : `<span class="expand-mark">${icon("expand")}</span>`
                }
              </span>
              <span class="project-info">
                <span class="project-title">${escapeHtml(project.title)}</span>
                <span class="project-role">${escapeHtml(localize(project.role))}</span>
                <span class="project-meta">${escapeHtml(projectKindLabel(project))} / ${escapeHtml(project.year)}</span>
              </span>
            </button>
          </article>
        `,
      )
      .join("");
  }

  function renderExperience() {
    elements.experience.innerHTML = data.experience
      .map(
        ([company, period, role]) => `
          <article class="experience-item">
            <span>${escapeHtml(period)}</span>
            <h3>${escapeHtml(company)}</h3>
            <p>${escapeHtml(role)}</p>
          </article>
        `,
      )
      .join("");
  }

  function renderSocials() {
    const socials = (data.contact?.socials || []).filter((social) => social.url);

    elements.socials.innerHTML = socials
      .map(
        (social) => `
          <a href="${escapeHtml(social.url)}" target="_blank" rel="noreferrer">
            ${escapeHtml(social.label)}
            <span aria-hidden="true">↗</span>
          </a>
        `,
      )
      .join("");
  }

  function renderModalMedia(project) {
    if (project.embedUrl) {
      return `
        <iframe
          src="${escapeHtml(project.embedUrl)}"
          title="${escapeHtml(project.title)}"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    }

    if (project.kind === "video" && project.mediaUrl) {
      return `
        <video
          src="${escapeHtml(project.mediaUrl)}"
          poster="${escapeHtml(project.poster)}"
          controls
          autoplay
          playsinline
          preload="metadata"
        ></video>
      `;
    }

    return `
      <img
        src="${escapeHtml(project.mediaUrl || project.poster)}"
        alt="${escapeHtml(project.title)}"
        loading="eager"
      />
    `;
  }

  function openProject(projectId) {
    const project = data.projects.find((item) => item.id === projectId);

    if (!project) {
      return;
    }

    state.activeProject = project;
    elements.modalMeta.textContent = `${projectKindLabel(project)} / ${project.year}`;
    elements.modalTitle.textContent = project.title;
    elements.modalDescription.textContent = localize(project.description);
    elements.modalMedia.innerHTML = renderModalMedia(project);
    elements.modal.hidden = false;
    document.body.classList.add("has-modal");

    const video = elements.modalMedia.querySelector("video");
    if (video) {
      video.volume = 1;
      video.play().catch(() => undefined);
    }
  }

  function closeModal() {
    elements.modal.hidden = true;
    elements.modalMedia.innerHTML = "";
    document.body.classList.remove("has-modal");
    state.activeProject = null;
  }

  function render() {
    renderProfile();
    renderStaticCopy();
    renderMetrics();
    renderFilters();
    renderProjects();
    renderExperience();
    renderSocials();
  }

  document.addEventListener("click", (event) => {
    const languageButton = event.target.closest("[data-lang]");
    const filterButton = event.target.closest("[data-filter]");
    const projectButton = event.target.closest("[data-project-id]");
    const closeButton = event.target.closest("[data-close-modal]");

    if (languageButton) {
      state.language = languageButton.dataset.lang;
      window.localStorage.setItem("portfolio-language", state.language);
      render();
      return;
    }

    if (filterButton) {
      state.filter = filterButton.dataset.filter;
      renderFilters();
      renderProjects();
      return;
    }

    if (projectButton) {
      openProject(projectButton.dataset.projectId);
      return;
    }

    if (closeButton) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) {
      closeModal();
    }
  });

  try {
    data = await loadData();
    render();
  } catch (error) {
    console.error(error);
    elements.grid.innerHTML =
      '<p class="content-error">Content could not be loaded. Please open this site through Vercel or a local server.</p>';
  }
})();
