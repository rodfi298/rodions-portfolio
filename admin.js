(async function () {
  const state = {
    data: null,
    activeTab: "profile",
    activeProject: 0,
    isUnlocked: false,
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
  const sessionTokenKey = "rodions-portfolio-session-token";
  const statusNode = document.querySelector("#status");

  const selectors = {
    lockScreen: document.querySelector("#lock-screen"),
    adminApp: document.querySelector("#admin-app"),
    unlockForm: document.querySelector("#unlock-form"),
    lockRepo: document.querySelector("#lock-repo"),
    lockToken: document.querySelector("#lock-token"),
    lockRemember: document.querySelector("#lock-remember"),
    lockMessage: document.querySelector("#lock-message"),
    logout: document.querySelector("#logout-button"),
    saveTop: document.querySelector("#save-top"),
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
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", type === "error");
    statusNode.classList.toggle("is-ok", type === "ok");
  }

  function setLockMessage(message = "", type = "") {
    if (!selectors.lockMessage) {
      return;
    }

    selectors.lockMessage.textContent = message;
    selectors.lockMessage.classList.toggle("is-visible", Boolean(message));
    selectors.lockMessage.classList.toggle("is-error", type === "error");
    selectors.lockMessage.classList.toggle("is-ok", type === "ok");
  }

  function getPath(path) {
    return path.split(".").reduce((value, key) => value?.[key], state.data);
  }

  function setPath(path, value) {
    const keys = path.split(".");
    let target = state.data;

    if (!target) {
      return;
    }

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
    let saved = {};

    try {
      saved = JSON.parse(window.localStorage.getItem(adminStorageKey) || "{}");
    } catch {
      saved = {};
    }

    const localToken = window.localStorage.getItem(tokenStorageKey) || "";
    const sessionToken = window.sessionStorage.getItem(sessionTokenKey) || "";

    state.admin = {
      ...state.admin,
      ...saved,
      token: localToken || sessionToken,
      rememberToken: Boolean(localToken),
    };
  }

  function readAdminInputs(source = "settings") {
    const isLock = source === "lock";
    const repoInput = isLock ? selectors.lockRepo : selectors.repo;
    const tokenInput = isLock ? selectors.lockToken : selectors.token;
    const rememberInput = isLock ? selectors.lockRemember : selectors.remember;

    state.admin.repo = (repoInput?.value || state.admin.repo).trim();
    state.admin.branch = (selectors.branch?.value || state.admin.branch || "main").trim();
    state.admin.path = (selectors.path?.value || state.admin.path || "content/site.json").trim();
    state.admin.token = (tokenInput?.value || state.admin.token).trim();
    state.admin.rememberToken = Boolean(rememberInput?.checked);
  }

  function persistAdminConfig() {
    window.localStorage.setItem(
      adminStorageKey,
      JSON.stringify({
        repo: state.admin.repo,
        branch: state.admin.branch,
        path: state.admin.path,
      }),
    );

    if (state.admin.token && state.admin.rememberToken) {
      window.localStorage.setItem(tokenStorageKey, state.admin.token);
      window.sessionStorage.removeItem(sessionTokenKey);
      return;
    }

    window.localStorage.removeItem(tokenStorageKey);

    if (state.admin.token) {
      window.sessionStorage.setItem(sessionTokenKey, state.admin.token);
    } else {
      window.sessionStorage.removeItem(sessionTokenKey);
    }
  }

  function writeAdminConfig(source = "settings") {
    readAdminInputs(source);
    persistAdminConfig();
    syncLockInputs();
    syncSettingsInputs();
  }

  function syncLockInputs() {
    if (selectors.lockRepo) {
      selectors.lockRepo.value = state.admin.repo;
    }

    if (selectors.lockToken) {
      selectors.lockToken.value = state.admin.token;
    }

    if (selectors.lockRemember) {
      selectors.lockRemember.checked = state.admin.rememberToken;
    }
  }

  function syncSettingsInputs() {
    if (selectors.repo) {
      selectors.repo.value = state.admin.repo;
    }

    if (selectors.branch) {
      selectors.branch.value = state.admin.branch;
    }

    if (selectors.path) {
      selectors.path.value = state.admin.path;
    }

    if (selectors.token) {
      selectors.token.value = state.admin.token;
    }

    if (selectors.remember) {
      selectors.remember.checked = state.admin.rememberToken;
    }
  }

  function showLocked(message = "", type = "") {
    state.isUnlocked = false;
    selectors.lockScreen.hidden = false;
    selectors.adminApp.hidden = true;
    selectors.logout.hidden = true;
    selectors.saveTop.hidden = true;
    syncLockInputs();
    setLockMessage(message, type);
  }

  function showAdmin() {
    state.isUnlocked = true;
    selectors.lockScreen.hidden = true;
    selectors.adminApp.hidden = false;
    selectors.logout.hidden = false;
    selectors.saveTop.hidden = false;
    syncSettingsInputs();
    setLockMessage("");
  }

  async function verifyAccess() {
    if (!state.admin.token) {
      throw new Error("Paste your GitHub token to unlock the admin panel.");
    }

    const response = await fetch(`https://api.github.com/repos/${state.admin.repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.admin.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub access check failed (${response.status}). Check repository name and token permissions.`,
      );
    }

    const repo = await response.json();
    const permissions = repo.permissions;

    if (permissions && !permissions.admin && !permissions.maintain && !permissions.push) {
      throw new Error("This token can read the repository but cannot write content.");
    }

    state.admin.branch = state.admin.branch || repo.default_branch || "main";
    persistAdminConfig();
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
    syncLockInputs();
  }

  async function unlockAndLoad() {
    readAdminInputs("lock");
    setLockMessage("Checking GitHub access...", "ok");
    await verifyAccess();
    showAdmin();
    setStatus("Loading content...");
    await loadContent();
    render();
    setStatus("Admin unlocked. Edit fields, upload media, then save changes.", "ok");
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
    if (!state.data) {
      return;
    }

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

  function insertCloudinaryTransformation(url, transformation) {
    if (!url || !url.includes("/upload/")) {
      return url;
    }

    return url.replace("/upload/", `/upload/${transformation}/`);
  }

  function replaceExtension(url, extension) {
    const [base, query] = url.split("?");
    const nextBase = base.replace(/\.[a-z0-9]+$/i, `.${extension}`);
    return query ? `${nextBase}?${query}` : nextBase;
  }

  function cloudinaryDeliveryUrl(info, targetName) {
    const secureUrl = info?.secure_url || "";
    const resourceType = info?.resource_type || "";

    if (targetName === "project.poster" && resourceType === "video") {
      const posterUrl = insertCloudinaryTransformation(
        secureUrl,
        "so_0,w_1600,c_limit,f_jpg,q_auto:best",
      );
      return replaceExtension(posterUrl, "jpg");
    }

    if (resourceType === "video") {
      return insertCloudinaryTransformation(secureUrl, "f_auto:video,q_auto:best");
    }

    if (resourceType === "image") {
      return insertCloudinaryTransformation(secureUrl, "f_auto,q_auto:best");
    }

    return secureUrl;
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
        showAdvancedOptions: false,
      },
      (error, result) => {
        if (error) {
          setStatus(error.message || "Cloudinary upload failed.", "error");
          return;
        }

        if (result.event !== "success") {
          return;
        }

        const url = cloudinaryDeliveryUrl(result.info, targetName);
        const activeProject = state.data.projects[state.activeProject];

        if (targetName === "project.poster") {
          activeProject.poster = url;
        }

        if (targetName === "project.mediaUrl") {
          activeProject.mediaUrl = url;

          if (result.info?.resource_type === "video") {
            activeProject.kind = "video";
            activeProject.category = "video";
          }

          if (result.info?.resource_type === "image") {
            activeProject.kind = "design";
            activeProject.category = activeProject.category === "video" ? "design" : activeProject.category;
          }
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
      throw new Error("Unlock the admin panel with your GitHub token before saving.");
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
    if (!state.isUnlocked || !state.data) {
      throw new Error("Unlock the admin panel before saving.");
    }

    writeAdminConfig("settings");

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

  selectors.unlockForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await unlockAndLoad();
    } catch (error) {
      showLocked(error.message, "error");
    }
  });

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

    if (event.target.closest("#logout-button")) {
      state.admin.token = "";
      state.admin.rememberToken = false;
      window.localStorage.removeItem(tokenStorageKey);
      window.sessionStorage.removeItem(sessionTokenKey);
      showLocked("Logged out. Paste your GitHub token to edit again.");
      return;
    }

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
  syncLockInputs();
  syncSettingsInputs();

  if (!state.admin.token) {
    showLocked("Paste your private GitHub token to open the admin panel.");
    return;
  }

  try {
    await unlockAndLoad();
  } catch (error) {
    showLocked(error.message, "error");
  }
})();
