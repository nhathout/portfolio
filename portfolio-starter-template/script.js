const content = window.PORTFOLIO_CONTENT || {};
const root = document.documentElement;
const themeStorageKey = "portfolio-template-theme";

function select(selector) {
  return document.querySelector(selector);
}

function selectAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function setText(selector, value) {
  const element = select(selector);
  if (element && value != null) {
    element.textContent = value;
  }
}

function empty(element) {
  if (element) {
    element.replaceChildren();
  }
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function normalizeItems(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function setMeta(name, value) {
  if (!value) return;
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = value;
}

function initialsFromName(name) {
  return String(name || "Your Name")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function isUsableHref(href) {
  return href && href !== "#";
}

function applyBasics() {
  const initials = content.initials || initialsFromName(content.name);
  const title = content.title || "Personal portfolio";
  const description = content.hero?.intro || "Personal portfolio website.";

  document.title = `${content.name || "Your Name"} | Portfolio`;
  setMeta("description", description);

  setText("#brandInitials", initials);
  setText("#brandName", content.name || "Your Name");
  setText("#profileInitials", initials);
  setText("#profileName", content.name || "Your Name");
  setText("#profileRole", title);
  setText("#footerName", content.name || "Your Name");
  setText("#heroEyebrow", content.hero?.eyebrow || "Personal Portfolio");
  setText("#heroTitle", content.hero?.title || "Hi, I am Your Name.");
  setText("#heroIntro", content.hero?.intro || "");
  setText("#aboutHeading", content.about?.heading || "About me");
  setText("#contactHeading", content.contact?.heading || "Say hello.");
  setText("#contactIntro", content.contact?.intro || "");
  setText("#copyrightYear", new Date().getFullYear());

  const resumeLink = select("#resumeLink");
  if (resumeLink) {
    if (isUsableHref(content.resumeUrl)) {
      resumeLink.href = content.resumeUrl;
      resumeLink.hidden = false;
    } else {
      resumeLink.hidden = true;
    }
  }

  renderProfileVisual(initials);
}

function renderProfileVisual(initials) {
  const visual = select("#profileVisual");
  if (!visual) return;

  empty(visual);
  if (content.avatarImage) {
    const image = createElement("img");
    image.src = content.avatarImage;
    image.alt = `${content.name || "Profile"} portrait`;
    visual.appendChild(image);
    visual.classList.add("has-image");
    return;
  }

  visual.classList.remove("has-image");
  visual.appendChild(createElement("span", "", initials));
}

function renderQuickFacts() {
  const list = select("#quickFacts");
  empty(list);

  normalizeItems(content.quickFacts).forEach(fact => {
    const wrapper = createElement("div");
    wrapper.appendChild(createElement("dt", "", fact.label));
    wrapper.appendChild(createElement("dd", "", fact.value));
    list.appendChild(wrapper);
  });
}

function renderSocialLinks() {
  const container = select("#socialLinks");
  empty(container);

  normalizeItems(content.socialLinks).forEach(link => {
    const anchor = createElement("a", "text-link", link.label);
    anchor.href = link.href || "#";
    anchor.target = anchor.href.startsWith("mailto:") ? "_self" : "_blank";
    anchor.rel = "noopener noreferrer";
    container.appendChild(anchor);
  });
}

function renderAbout() {
  const container = select("#aboutText");
  empty(container);

  normalizeItems(content.about?.paragraphs).forEach(paragraph => {
    container.appendChild(createElement("p", "", paragraph));
  });
}

function renderTimeline(filter = "all") {
  const container = select("#timelineList");
  empty(container);

  normalizeItems(content.timeline)
    .filter(item => filter === "all" || item.type === filter)
    .forEach(item => {
      const card = createElement("article", "timeline-card");

      const meta = createElement("div", "timeline-meta");
      meta.appendChild(createElement("span", "pill", item.type || "item"));
      meta.appendChild(createElement("span", "", item.period || ""));

      const title = createElement("h3", "", item.title || "Timeline item");
      const org = createElement("p", "muted", [item.organization, item.location].filter(Boolean).join(" / "));
      const summary = createElement("p", "", item.summary || "");
      const highlights = createElement("ul", "compact-list");

      normalizeItems(item.highlights).forEach(highlight => {
        highlights.appendChild(createElement("li", "", highlight));
      });

      card.append(meta, title, org, summary);
      if (highlights.children.length) card.appendChild(highlights);
      container.appendChild(card);
    });
}

function initTimelineFilters() {
  const buttons = selectAll(".filter-button");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(entry => entry.classList.toggle("is-active", entry === button));
      renderTimeline(button.dataset.filter || "all");
    });
  });
}

function renderSkills() {
  const container = select("#skillsGrid");
  empty(container);

  normalizeItems(content.skills).forEach(group => {
    const card = createElement("article", "skill-group");
    card.appendChild(createElement("h3", "", group.category || "Skills"));

    const list = createElement("div", "tag-list");
    normalizeItems(group.items).forEach(item => {
      list.appendChild(createElement("span", "tag", item));
    });

    card.appendChild(list);
    container.appendChild(card);
  });
}

function renderProjects() {
  const container = select("#projectsGrid");
  empty(container);

  normalizeItems(content.projects).forEach((project, index) => {
    const card = createElement("article", "project-card");
    const media = createElement("div", "project-media");

    if (project.image) {
      const image = createElement("img");
      image.src = project.image;
      image.alt = `${project.title || "Project"} preview`;
      media.appendChild(image);
    } else {
      media.appendChild(createElement("span", "", `0${index + 1}`));
    }

    const body = createElement("div", "project-body");
    body.appendChild(createElement("h3", "", project.title || "Project title"));
    body.appendChild(createElement("p", "", project.summary || ""));

    const tags = createElement("div", "tag-list");
    normalizeItems(project.tags).forEach(tag => {
      tags.appendChild(createElement("span", "tag", tag));
    });
    body.appendChild(tags);

    const links = createElement("div", "card-links");
    normalizeItems(project.links).forEach(link => {
      const anchor = createElement("a", "text-link", link.label || "Link");
      anchor.href = link.href || "#";
      anchor.target = anchor.href.startsWith("#") ? "_self" : "_blank";
      anchor.rel = "noopener noreferrer";
      links.appendChild(anchor);
    });

    if (links.children.length) body.appendChild(links);
    card.append(media, body);
    container.appendChild(card);
  });
}

function renderHighlights() {
  const container = select("#highlightsGrid");
  const section = select("#highlights");
  empty(container);

  const highlights = normalizeItems(content.highlights);
  if (!highlights.length) {
    section?.setAttribute("hidden", "");
    return;
  }

  section?.removeAttribute("hidden");
  highlights.forEach(highlight => {
    const card = createElement("article", "highlight-card");
    card.appendChild(createElement("h3", "", highlight.title || "Highlight"));
    card.appendChild(createElement("p", "", highlight.detail || ""));
    container.appendChild(card);
  });
}

function renderContact() {
  const container = select("#contactLinks");
  empty(container);

  normalizeItems(content.contact?.links).forEach(link => {
    const anchor = createElement("a", "contact-card");
    anchor.href = link.href || "#";
    anchor.target = anchor.href.startsWith("mailto:") ? "_self" : "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.appendChild(createElement("span", "contact-label", link.label || "Link"));
    anchor.appendChild(createElement("strong", "", link.value || link.href || ""));
    container.appendChild(anchor);
  });
}

function initThemeToggle() {
  selectAll("[data-theme-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const isDark = root.dataset.theme === "dark";
      root.dataset.theme = isDark ? "light" : "dark";
      try {
        if (isDark) {
          localStorage.removeItem(themeStorageKey);
        } else {
          localStorage.setItem(themeStorageKey, "dark");
        }
      } catch (error) {}
    });
  });
}

function initMobileMenu() {
  const button = select("#menuToggle");
  const menu = select("#mobileMenu");
  if (!button || !menu) return;

  function setOpen(isOpen) {
    menu.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
    button.classList.toggle("is-open", isOpen);
  }

  button.addEventListener("click", () => setOpen(menu.hidden));
  menu.addEventListener("click", event => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
}

function initActiveNav() {
  const links = selectAll(".nav-links a");
  const sections = links
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
  );

  sections.forEach(section => observer.observe(section));
}

function init() {
  applyBasics();
  renderQuickFacts();
  renderSocialLinks();
  renderAbout();
  renderTimeline();
  renderSkills();
  renderProjects();
  renderHighlights();
  renderContact();
  initTimelineFilters();
  initThemeToggle();
  initMobileMenu();
  initActiveNav();
}

init();
