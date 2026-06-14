(async function () {
  const state = {
    data: null,
    activeTab: "profile",
    activeProject: 0,
    admin: {
      repo: "rodfi298/rodions-portfolio",
      branch: "main",
      path: "content/site.json",
      token: "",
      rememberToken: false,
    },
  };

  const adminStorageKey = "rodions-portfolio-admin";
  const tokenStorageKey = "rodions-portfolio-token";
  const statusNode = document.querySelector("#status");

  const selectors = {
    repo: document.querySelector("#repo-input"),
    branch: document.querySelector("#branch-input"),
    path: document.querySelector("#path-input"),
    token: document.querySelector("#token-input"),
    remember: document.querySelector("#remember-token"),
    projectList: document.querySelector("#project-list"),
    projectEditor: document.querySelector("#project-editor"),
    experienceList: document.querySelector("#experience-list"),
    socialList: document.querySelector("#social-list"),
  };

  function setStatus(message, type = "") {
    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", type === "error");
    statusNode.classList.toggle("is-ok", type === "ok");
  }

  function getPath(path) {
    return path.split(".").reduce((value, key) => value?.[key], state.data);
  }

  function setPath(path, value) {
    const keys = path.split(".");
    let target = state.data;

    keys.slice(0, -1).forEach((key) => {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      target = target[key];
    });

    target[keys.at(-1)] = value;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(value) {
    return String(value || "new-work")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  function readAdminConfig() {
    const saved = JSON.parse(window.localStorage.getItem(adminStorageKey) || "{}");
    state.admin = {
      ...state.admin,
      ...saved,
      token: window.localStorage.getItem(tokenStorageKey) || "",
      rememberToken: Boolean(window.localStorage.getItem(tokenStorageKey)),
    };
  }

  function writeAdminConfig() {
    state.admin.repo = selectors.repo.value.trim();
    state.admin.branch = selectors.branch.value.trim() || "main";
    state.admin.path = selectors.path.value.trim() || "content/site.json";
    state.admin.token = selectors.token.value.trim();
    state.admin.rememberToken = selectors.remember.checked;

    window.localStorage.setItem(
      adminStorageKey,
      JSON.stringify({
        repo: state.admin.repo,
        branch: state.admin.branch,
        path: state.admin.path,
      }),
    );

    if (state.admin.rememberToken && state.admin.token) {
      window.localStorage.setItem(tokenStorageKey, state.admin.token);
    } else {
      window.localStorage.removeItem(tokenStorageKey);
    }
  }

  function syncSettingsInputs() {
    selectors.repo.value = state.admin.repo;
    selectors.branch.value = state.admin.branch;
    selectors.path.value = state.admin.path;
    selectors.token.value = state.admin.token;
    selectors.remember.checked = state.admin.rememberToken;
  }

  async function loadContent() {
    const response = await fetch("content/site.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load content/site.json (${response.status})`);
    }

    state.data = await response.json();
    state.admin.repo = state.data.cms?.repository || state.admin.repo;
    state.admin.branch = state.data.cms?.branch || state.admin.branch;
    state.admin.path = state.data.cms?.contentPath || state.admin.path;
    syncSettingsInputs();
  }

  function bindInputs() {
    document.querySelectorAll("[data-bind]").forEach((input) => {
      const path = input.dataset.bind;
      input.value = getPath(path) || "";
    });
  }

  function renderSocials() {
    const socials = state.data.contact.socials || [];
    selectors.socialList.innerHTML = socials
      .map(
        (social, index) => `
          <article class="stack-item" data-social-index="${index}">
            <div class="form-grid">
              <label>Label <input data-social-field="label" value="${escapeHtml(social.label)}" /></label>
              <label>URL <input data-social-field="url" value="${escapeHtml(social.url)}" /></label>
            </div>
            <div class="row-actions">
              <button type="button" class="danger" data-delete-social="${index}">Delete</button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderProjectList() {
    selectors.projectList.innerHTML = state.data.projects
      .map(
        (project, index) => `
          <button type="button" class="${index === state.activeProject ? "is-active" : ""}" data-select-project="${index}">
            ${escapeHtml(project.title || "Untitled")}
            <small>${escapeHtml(project.year || "")}</small>
          </button>
        `,
      )
      .join("");
  }

  function renderProjectEditor() {
    const project = state.data.projects[state.activeProject];

    if (!project) {
      selectors.projectEditor.innerHTML = "<p>No project selected.</p>";
      return;
    }

    selectors.projectEditor.innerHTML = `
      <div class="form-grid">
        <label>Title <input data-project-field="title" value="${escapeHtml(project.title)}" /></label>
        <label>ID <input data-project-field="id" value="${escapeHtml(project.id)}" /></label>
        <label>
          Category
          <select data-project-field="category">
            ${["video", "design", "photo", "3d"]
              .map((value) => `<option value="${value}" ${project.category === value ? "selected" : ""}>${value}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          Kind
          <select data-project-field="kind">
            ${["video", "design", "photo", "3d"]
              .map((value) => `<option value="${value}" ${project.kind === value ? "selected" : ""}>${value}</option>`)
              .join("")}
          </select>
        </label>
        <label>Year <input data-project-field="year" value="${escapeHtml(project.year)}" /></label>
        <label>
          Poster URL
          <span class="inline-control">
            <input data-project-field="poster" data-media-target="project.poster" value="${escapeHtml(project.poster)}" />
            <button type="button" data-upload-target="project.poster">Upload</button>
          </span>
        </label>
        <label>
          Video / image URL
          <span class="inline-control">
            <input data-project-field="mediaUrl" data-media-target="project.mediaUrl" value="${escapeHtml(project.mediaUrl)}" />
            <button type="button" data-upload-target="project.mediaUrl">Upload</button>
          </span>
        </label>
        <label>Embed URL <input data-project-field="embedUrl" value="${escapeHtml(project.embedUrl)}" /></label>
      </div>

      <h2>Role</h2>
      <div class="form-grid three">
        <label>LV <input data-project-field="role.lv" value="${escapeHtml(project.role?.lv)}" /></label>
        <label>RU <input data-project-field="role.ru" value="${escapeHtml(project.role?.ru)}" /></label>
        <label>EN <input data-project-field="role.en" value="${escapeHtml(project.role?.en)}" /></label>
      </div>

      <h2>Description</h2>
      <div class="form-grid three">
        <label>LV <textarea data-project-field="description.lv">${escapeHtml(project.description?.lv)}</textarea></label>
        <label>RU <textarea data-project-field="description.ru">${escapeHtml(project.description?.ru)}</textarea></label>
        <label>EN <textarea data-project-field="description.en">${escapeHtml(project.description?.en)}</textarea></label>
      </div>

      <div class="project-actions">
        <button type="button" class="danger" id="delete-project">Delete work</button>
        <button type="button" class="secondary" id="duplicate-project">Duplicate</button>
      </div>
    `;
  }

  function renderExperience() {
    selectors.experienceList.innerHTML = state.data.experience
      .map(
        (row, index) => `
          <article class="stack-item" data-experience-index="${index}">
            <div class="form-grid three">
              <label>Company <input data-experience-field="0" value="${escapeHtml(row[0])}" /></label>
              <label>Period <input data-experience-field="1" value="${escapeHtml(row[1])}" /></label>
              <label>Role <input data-experience-field="2" value="${escapeHtml(row[2])}" /></label>
            </div>
            <div class="row-actions">
              <button type="button" class="danger" data-delete-experience="${index}">Delete</button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderTabs() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
    });

    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === state.activeTab);
    });
  }

  function render() {
    bindInputs();
    renderSocials();
    renderProjectList();
    renderProjectEditor();
    renderExperience();
    renderTabs();
  }

  function updateDataFromEvent(target) {
    const bindPath = target.dataset.bind;
    const projectField = target.dataset.projectField;
    const experienceField = target.dataset.experienceField;
    const socialField = target.dataset.socialField;

    if (bindPath) {
      setPath(bindPath, target.value);
    }

    if (projectField) {
      const project = state.data.projects[state.activeProject];
      const keys = projectField.split(".");
      let targetObject = project;

      keys.slice(0, -1).forEach((key) => {
        if (!targetObject[key]) {
          targetObject[key] = {};
        }
        targetObject = targetObject[key];
      });

      targetObject[keys.at(-1)] = target.value;

      if (projectField === "title" && !project.id) {
        project.id = slugify(target.value);
      }
    }

    if (experienceField) {
      const item = target.closest("[data-experience-index]");
      state.data.experience[Number(item.dataset.experienceIndex)][Number(experienceField)] =
        target.value;
    }

    if (socialField) {
      const item = target.closest("[data-social-index]");
      state.data.contact.socials[Number(item.dataset.socialIndex)][socialField] = target.value;
    }
  }

  function addProject() {
    state.data.projects.unshift({
      id: `new-work-${Date.now()}`,
      title: "New Work",
      category: "video",
      kind: "video",
      year: "2026",
      poster: "",
      mediaUrl: "",
      embedUrl: "",
      role: {
        lv: "Projekta loma",
        ru: "Роль в проекте",
        en: "Project role",
      },
      description: {
        lv: "Īss projekta apraksts.",
        ru: "Короткое описание проекта.",
        en: "Short project description.",
      },
    });
    state.activeProject = 0;
    render();
  }

  function deleteProject() {
    if (!state.data.projects.length) {
      return;
    }

    state.data.projects.splice(state.activeProject, 1);
    state.activeProject = Math.max(0, state.activeProject - 1);
    render();
  }

  function duplicateProject() {
    const project = state.data.projects[state.activeProject];
    const copy = structuredClone(project);
    copy.id = `${slugify(copy.title)}-${Date.now()}`;
    copy.title = `${copy.title} Copy`;
    state.data.projects.splice(state.activeProject + 1, 0, copy);
    state.activeProject += 1;
    render();
  }

  function addExperience() {
    state.data.experience.unshift(["New Company", "2026", "Role"]);
    renderExperience();
  }

  function addSocial() {
    state.data.contact.socials.push({ label: "New Link", url: "" });
    renderSocials();
  }

  function openCloudinaryUpload(targetName) {
    const cloudName = state.data.cms?.cloudinaryCloudName;
    const uploadPreset = state.data.cms?.cloudinaryUploadPreset;

    if (!window.cloudinary || !cloudName || !uploadPreset) {
      setStatus("Add Cloudinary cloud name and unsigned upload preset in Settings first.", "error");
      state.activeTab = "settings";
      renderTabs();
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        resourceType: "auto",
        multiple: false,
        sources: ["local", "url", "camera"],
      },
      (error, result) => {
        if (error) {
          setStatus(error.message || "Cloudinary upload failed.", "error");
          return;
        }

        if (result.event !== "success") {
          return;
        }

        const url = result.info.secure_url;

        if (targetName === "profile.portrait") {
          setPath("profile.portrait", url);
        }

        if (targetName === "project.poster") {
          state.data.projects[state.activeProject].poster = url;
        }

        if (targetName === "project.mediaUrl") {
          state.data.projects[state.activeProject].mediaUrl = url;
        }

        setStatus("Uploaded to Cloudinary. Save changes to publish.", "ok");
        render();
      },
    );

    widget.open();
  }

  function toBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  async function githubRequest(url, options = {}) {
    if (!state.admin.token) {
      throw new Error("Add GitHub token in Settings before saving.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.admin.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub request failed (${response.status}): ${detail}`);
    }

    return response.json();
  }

  async function saveToGitHub() {
    writeAdminConfig();

    state.data.cms = {
      ...(state.data.cms || {}),
      repository: state.admin.repo,
      branch: state.admin.branch,
      contentPath: state.admin.path,
    };

    const contentJson = `${JSON.stringify(state.data, null, 2)}\n`;
    const encodedPath = state.admin.path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const baseUrl = `https://api.github.com/repos/${state.admin.repo}/contents/${encodedPath}`;
    const current = await githubRequest(`${baseUrl}?ref=${encodeURIComponent(state.admin.branch)}`);

    await githubRequest(baseUrl, {
      method: "PUT",
      body: JSON.stringify({
        message: "Update portfolio content",
        content: toBase64(contentJson),
        sha: current.sha,
        branch: state.admin.branch,
      }),
    });

    setStatus("Saved to GitHub. Vercel will redeploy automatically.", "ok");
  }

  document.addEventListener("input", (event) => {
    if (event.target.matches("input, textarea, select")) {
      updateDataFromEvent(event.target);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("input, textarea, select")) {
      updateDataFromEvent(event.target);
    }
  });

  document.addEventListener("click", async (event) => {
    const tabButton = event.target.closest("[data-tab]");
    const projectButton = event.target.closest("[data-select-project]");
    const uploadButton = event.target.closest("[data-upload-target]");
    const deleteExperience = event.target.closest("[data-delete-experience]");
    const deleteSocial = event.target.closest("[data-delete-social]");

    if (tabButton) {
      state.activeTab = tabButton.dataset.tab;
      renderTabs();
      return;
    }

    if (projectButton) {
      state.activeProject = Number(projectButton.dataset.selectProject);
      renderProjectList();
      renderProjectEditor();
      return;
    }

    if (uploadButton) {
      openCloudinaryUpload(uploadButton.dataset.uploadTarget);
      return;
    }

    if (event.target.closest("#add-project")) {
      addProject();
      return;
    }

    if (event.target.closest("#delete-project")) {
      deleteProject();
      return;
    }

    if (event.target.closest("#duplicate-project")) {
      duplicateProject();
      return;
    }

    if (event.target.closest("#add-experience")) {
      addExperience();
      return;
    }

    if (deleteExperience) {
      state.data.experience.splice(Number(deleteExperience.dataset.deleteExperience), 1);
      renderExperience();
      return;
    }

    if (event.target.closest("#add-social")) {
      addSocial();
      return;
    }

    if (deleteSocial) {
      state.data.contact.socials.splice(Number(deleteSocial.dataset.deleteSocial), 1);
      renderSocials();
      return;
    }

    if (event.target.closest("#save-top")) {
      try {
        setStatus("Saving to GitHub...");
        await saveToGitHub();
      } catch (error) {
        setStatus(error.message, "error");
      }
    }
  });

  readAdminConfig();

  try {
    await loadContent();
    syncSettingsInputs();
    render();
    setStatus("Content loaded. Edit fields, then save changes.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
})();
