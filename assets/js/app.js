const DB =
  "https://portfolio-b581f-default-rtdb.asia-southeast1.firebasedatabase.app";
let DATA = {};
const $ = (s) => document.querySelector(s),
  A = (v) =>
    Array.isArray(v)
      ? v.filter(Boolean)
      : Object.entries(v || {})
          .filter(([, x]) => x != null)
          .map(([firebaseKey, x]) => ({ ...x, firebaseKey })),
  V = (v) => A(v).filter((x) => x.hidden !== true),
  E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
async function load() {
  const localPath =
    (location.pathname.includes("/admin/") ? "../" : "") +
    "data/portfolio-data.json";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    let r = await fetch(DB + "/.json", {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (r.ok) {
      let d = await r.json();
      if (d && typeof d === "object" && !d.error) return d;
    }
  } catch (e) {
    console.warn("Firebase unavailable; using bundled demo data.", e);
  }
  let r = await fetch(localPath, { cache: "no-store" });
  if (!r.ok) throw new Error("Bundled portfolio data could not be loaded.");
  return r.json();
}
function theme() {
  let t = A(DATA.ThemeSettings)[0] || {},
    saved = localStorage.getItem("ajeb-theme"),
    mode = saved || t.defaultTheme || "dark";
  document.documentElement.dataset.theme = mode;
  let map = {
    p: t.primaryColor,
    s: t.secondaryColor,
    a: t.accentColor,
    bg: mode === "dark" ? t.darkBackground : t.lightBackground,
    surface: mode === "dark" ? t.darkSurface : t.lightSurface,
    text: mode === "dark" ? t.darkText : t.lightText,
  };
  Object.entries(map).forEach(
    ([k, v]) => v && document.documentElement.style.setProperty("--" + k, v),
  );
  document.querySelectorAll("[data-theme-toggle]").forEach(
    (b) =>
      (b.onclick = () => {
        localStorage.setItem(
          "ajeb-theme",
          document.documentElement.dataset.theme === "dark" ? "light" : "dark",
        );
        location.reload();
      }),
  );
}
const pd = (v, end = false) => {
    if (!v) return end ? new Date() : null;
    v = String(v);
    if (/^\d{8}$/.test(v))
      v = v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6);
    let d = new Date(v + "T00:00:00");
    return isNaN(d) ? null : d;
  },
  fd = (v) => {
    let d = pd(v);
    return !v
      ? "Present"
      : d
        ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : v;
  },
  range = (a, b) => fd(a) + " - " + fd(b);
function mergedYears(rows) {
  let q = rows
      .map((x) => [pd(x.startDate), pd(x.endDate, true)])
      .filter((x) => x[0] && x[1])
      .sort((a, b) => a[0] - b[0]),
    m = [];
  q.forEach((x) => {
    let z = m.at(-1);
    if (!z || x[0] > z[1]) m.push(x);
    else if (x[1] > z[1]) z[1] = x[1];
  });
  return m.reduce((n, x) => n + (x[1] - x[0]) / 31556952000, 0);
}
function technologyExperienceYears(technology) {
  const selectedTechnology = String(
    technology || "",
  )
    .trim()
    .toUpperCase();

  if (!selectedTechnology) {
    return 0;
  }

  const ranges = V(DATA.Experiences)
    .filter(
      (experience) =>
        String(experience.tech || "")
          .trim()
          .toUpperCase() === selectedTechnology,
    )
    .map((experience) => {
      const startDate = pd(
        experience.techStartDate,
      );

      const endDate = pd(
        experience.techEndDate,
        true,
      );

      return [startDate, endDate];
    })
    .filter(
      ([startDate, endDate]) =>
        startDate &&
        endDate &&
        endDate >= startDate,
    )
    .sort(
      (first, second) =>
        first[0] - second[0],
    );

  const mergedRanges = [];

  ranges.forEach(([startDate, endDate]) => {
    const previousRange =
      mergedRanges.at(-1);

    if (
      !previousRange ||
      startDate > previousRange[1]
    ) {
      mergedRanges.push([
        startDate,
        endDate,
      ]);

      return;
    }

    if (endDate > previousRange[1]) {
      previousRange[1] = endDate;
    }
  });

  const milliseconds = mergedRanges.reduce(
    (total, [startDate, endDate]) =>
      total + (endDate - startDate),
    0,
  );

  return milliseconds / 31556952000;
}
function iconTitle(icon, title) {
  return `<h2 class="section-title"><i class="bi ${icon}"></i>${E(title)}</h2>`;
}
function settingEntries() {
  return A(DATA.SectionSettings).map((x) => ({
    ...(x || {}),
    sectionId: x.sectionId || x.section || x.id || x.firebaseKey,
  }));
}
function sectionSetting(id) {
  return (
    settingEntries().find(
      (x) =>
        String(x.sectionId || "").toLowerCase() === String(id).toLowerCase(),
    ) || {}
  );
}
function isSectionVisible(id) {
  let s = sectionSetting(id);
  return s.hidden !== true && s.visible !== false && s.isVisible !== false;
}
function normalizeHref(x) {
  let href = String(x.href || "").trim(),
    section = String(x.section || x.sectionId || "").trim();
  if (href) return href;
  if (!section) return "#";
  return location.pathname.includes("index.html") ||
    location.pathname.endsWith("/")
    ? "#" + section
    : "index.html#" + section;
}
function nav() {
  const target = $("#navItems");
  let items = V(DATA.Navigation)
    .filter((x) => isSectionVisible(x.section || x.sectionId))
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  if (target)
    target.innerHTML = items
      .filter((x) => x.showInNavbar !== false)
      .map(
        (x) =>
          `<li class="nav-item"><a class="nav-link" href="${E(normalizeHref(x))}">${E(x.navbarText || x.text || x.section || "Link")}</a></li>`,
      )
      .join("");
  let quick = $("#quickLinks");
  if (!quick) {
    let footer = document.querySelector(
      ".footer .container, footer .container",
    );
    if (footer) {
      quick = document.createElement("nav");
      quick.id = "quickLinks";
      quick.className = "quick-links d-flex flex-wrap gap-3";
      let adminLink = footer.querySelector('a[href*="admin"]');
      footer.insertBefore(quick, adminLink || null);
    }
  }
  if (quick)
    quick.innerHTML = items
      .filter((x) => x.showInQuickLinks === true)
      .map(
        (x) =>
          `<a href="${E(normalizeHref(x))}">${E(x.quickLinkText || x.navbarText || x.text || x.section || "Link")}</a>`,
      )
      .join("");
}
function applySectionSettings() {
  let main = document.querySelector("main");
  if (main) {
    main.style.display = "flex";
    main.style.flexDirection = "column";
  }
  settingEntries().forEach((s) => {
    let id = s.sectionId;
    if (!id) return;
    let el = document.getElementById(id);
    if (!el) return;
    el.style.order = String(Number(s.sortOrder) || 999);
    el.hidden =
      s.hidden === true || s.visible === false || s.isVisible === false;
    el.classList.toggle("d-none", el.hidden);
    el.classList.toggle(
      "alt",
      s.alternateBackground === true || s.altBackground === true,
    );
  });
  settingEntries().forEach((s) => {
    if (!s.title) return;
    let el = document.getElementById(s.sectionId);
    if (!el) return;
    let heading = el.querySelector(".section-title");
    if (heading) {
      let icon = heading.querySelector("i");
      heading.textContent = "";
      if (icon) heading.appendChild(icon);
      heading.appendChild(document.createTextNode(s.title));
    }
  });
}
function home() {
  let p = V(DATA.SiteProfile)[0] || {},
    hero = $("#hero");
  hero.innerHTML = `<div class="container"><div class="row align-items-center g-5"><div class="col-lg-7"><div class="eyebrow"><i class="bi bi-code-slash"></i> ${E(p.greeting)}</div><h1>${E(p.fullName)}</h1><h2 class="accent">${E(p.jobTitle)}</h2><p class="lead">${E(p.heroDescription)}</p><div class="hero-actions"><a class="btn btn-primary" href="#projects"><i class="bi bi-folder2-open"></i> View My Work</a>${p.showLinkedIn !== false && p.linkedinUrl ? `<a class="btn btn-outline-primary" href="${E(p.linkedinUrl)}" target="_blank" rel="noopener"><i class="bi bi-linkedin"></i> ${E(p.linkedinButtonText || "LinkedIn")}</a>` : ""}${p.showGitHub !== false && p.githubUrl ? `<a class="btn btn-outline-primary" href="${E(p.githubUrl)}" target="_blank" rel="noopener"><i class="bi bi-github"></i> ${E(p.githubButtonText || "GitHub")}</a>` : ""}${p.resumeUrl ? `<a class="btn btn-outline-primary" href="${E(p.resumeUrl)}"><i class="bi bi-download"></i> ${E(p.resumeButtonText || "Download CV")}</a>` : ""}</div></div><div class="col-lg-5"><div class="profile">${p.profileImageHidden !== true && p.profileImage ? `<img src="${E(p.profileImage)}" alt="${E(p.profileImageAlt)}">` : '<div class="avatar">AJ</div>'}</div></div></div></div>`;
  stats();
  about();
  skills();
  soft();
  experience();
  cards();
  connect();
}
function stats() {

  const ex = V(DATA.Experiences);
  const c = V(DATA.Certificates);
  const p = V(DATA.Projects);

  const s =
    A(DATA.StatisticsSettings)[0] || {};

  const selectedTechnology =
    String(s.technology || "").trim() ||
    "SAP";

  const decimalPlaces =
    Number.isFinite(
      Number(s.decimalPlaces),
    )
      ? Number(s.decimalPlaces)
      : 1;

  const calculatedTechYears =
    technologyExperienceYears(
      selectedTechnology,
    ).toFixed(decimalPlaces);

  const techYearsValue =
    s.techYearsOverrideEnabled === true &&
    String(
      s.techYearsOverrideValue ?? "",
    ).trim() !== ""
      ? String(
          s.techYearsOverrideValue,
        ).trim()
      : calculatedTechYears;

  const techYearsTitle =
    String(s.title || "").trim() ||
    `${selectedTechnology} Years Experience`;

  const techYearsIcon =
    String(s.icon || "").trim() ||
    "bi-code-slash";

  const techYearsSuffix =
    s.suffix !== undefined
      ? String(s.suffix)
      : "+";

  const technologyFocusValue =
    String(
      s.technologyFocusOverride || "",
    ).trim() ||
    String(
      s.technologyFocus || "",
    ).trim() ||
    selectedTechnology;

const vals = [
  [
    mergedYears(ex).toFixed(1) + "+",
    "Total Years Experience",
    "bi-briefcase-fill",
    s.showTotalYearsExperience !== false,
  ],

  [
    techYearsValue + techYearsSuffix,
    techYearsTitle,
    techYearsIcon,
    s.showTechYearsExperience !== false,
  ],

  [
    p.length,
    "Projects",
    "bi-folder-fill",
    s.showProjectsCount !== false,
  ],

  [
    c.filter(
      (certificate) =>
        String(certificate.certType || "")
          .trim()
          .toUpperCase()
          .startsWith("SAP"),
    ).length,
    "SAP Certificates",
    "bi-patch-check-fill",
    s.showSapCertificates !== false,
  ],

  [
    c.filter(
      (certificate) =>
        !String(certificate.certType || "")
          .trim()
          .toUpperCase()
          .startsWith("SAP"),
    ).length,
    "Non-SAP Certificates",
    "bi-award-fill",
    s.showNonSapCertificates !== false,
  ],

  [
    c.length,
    "Total Certificates",
    "bi-trophy-fill",
    s.showTotalCertificates !== false,
  ],

  [
    technologyFocusValue,
    "Technology Focus",
    "bi-cpu-fill",
    s.showTechnologyFocus !== false,
  ],
];

  $("#statistics").innerHTML =
    `<div class="container"><div class="statistics-grid">
      ${vals
        .filter((x) => x[3] !== false)
        .map((x) => `<article class="card-ui stat-card"><div class="stat-icon"><i class="bi ${x[2]}"></i></div><div><strong>${x[0]}</strong><span>${x[1]}</span></div></article>`).join("")}</div></div>`;
}
function about() {
  let a = V(DATA.AboutMe)[0] || {},
    w = V(DATA.WhatIDo || []);
  $("#about .content").innerHTML =
    `<div class="about-what-grid"><article class="about-what-card card-ui">${iconTitle("bi-person-fill", a.title || "About Me")}${A(
      a.description,
    )
      .map((x) => `<p>${E(x)}</p>`)
      .join(
        "",
      )}</article><article class="about-what-card card-ui">${iconTitle("bi-tools", "What I Do")}<div class="what-list">${w.map((x) => `<div class="what-row"><i class="bi bi-code-slash"></i><span>${E(x.title)}</span></div>`).join("")}</div></article></div>`;
  extras();
}
function extras() {
  let blocks = [
    ["goal", "bi-bullseye", "Goals"],
    ["objective", "bi-compass", "Objectives"],
    ["education", "bi-mortarboard-fill", "Education"],
  ];
  blocks.forEach(([id, ic, key]) => {
    let el = $("#" + id + " .content");
    if (!el) return;
    el.innerHTML =
      iconTitle(
        ic,
        (A(DATA.SectionSettings).find((x) => x.firebaseKey === id) || {})
          .title || key,
      ) +
      `<div class="row g-3">${V(DATA[key])
        .map(
          (x) =>
            `<div class="col-md-6"><div class="card-ui p-4 h-100"><h5>${E(x.title || x.degree)}</h5><p>${E(x.description || x.school)}</p><small class="meta">${E(x.location || "")}</small></div></div>`,
        )
        .join("")}</div>`;
  });
}
function skills() {
  const skillCategories = V(DATA.Skills).sort(
    (a, b) =>
      (Number(a.sortOrder) || 0) -
      (Number(b.sortOrder) || 0),
  );

  $("#skills .content").innerHTML =
    iconTitle("bi-cpu-fill", "Technical Skills") +
    `
      <div class="row g-3">
        ${skillCategories
          .map((category) => {
            const iconClass =
              String(category.icon || "").trim() ||
              "bi-code-slash";

            return `
              <div class="col-md-6 col-xl-3">
                <div class="card-ui skill-box">
                  <h5 class="skill-category-title">
                    <span class="skill-category-icon">
                      <i class="bi ${E(iconClass)}"></i>
                    </span>

                    ${E(category.category)}
                  </h5>

                  <div class="skill-tags">
                    ${A(category.skills)
                      .filter(
                        (skill) =>
                          String(
                            skill?.text ?? skill ?? "",
                          ).trim() !== "",
                      )
                      .map((skill) => {
                        const skillText =
                          typeof skill === "object"
                            ? skill.text ||
                              skill.title ||
                              skill.name ||
                              ""
                            : skill;

                        return `
                          <span class="tag">
                            ${E(skillText)}
                          </span>
                        `;
                      })
                      .join("")}
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
}
function soft() {
  const items = V(DATA.SoftSkills).sort(
    (a, b) =>
      (Number.isFinite(Number(a.sortOrder))
        ? Number(a.sortOrder)
        : 999) -
      (Number.isFinite(Number(b.sortOrder))
        ? Number(b.sortOrder)
        : 999),
  );
  $("#soft .content").innerHTML =
    iconTitle("bi-people-fill", "Soft Skills") +
    `<div class="row g-3">${items.map((s, i) => `
      <div class="col-lg-4 col-md-6">
        <article class="soft-title-card card-ui" tabindex="0" role="button" data-soft="${i}">
          <div class="soft-skill-header">
            ${
              s.iconHidden !== true
                ? `
                  <span class="soft-skill-icon">
                    <i class="bi ${E(s.icon || "bi-people-fill")}"></i>
                  </span>
                `
                : ""
            }

            <h3>
              ${E(s.title || (A(s.itemDetails)[0] || {}).title)}
            </h3>
          </div>

          <i class="bi bi-arrow-up-right-circle"></i>
        </article>
      </div>`).join("")}
    </div>`;
  document.querySelectorAll("[data-soft]").forEach((b) => {
    let open = () => {
      let s = items[+b.dataset.soft],
        d = A(s.itemDetails)[0] || s,
        examples = V(d.examples);
      $("#softTitle").textContent = d.title || "";
      $("#softDescription").textContent = d.description || "";
      $("#softExamples").innerHTML = examples
        .map((x) => `<li>${E(x.text || x.description)}</li>`)
        .join("");
      $("#softExampleArea").hidden = !examples.length;
      bootstrap.Modal.getOrCreateInstance("#softModal").show();
    };
    b.onclick = open;
    b.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
  });
}
function groups() {
  let out = [];
  V(DATA.Experiences).forEach((r) => {
    let k = [r.company, r.startDate || "", r.endDate || ""]
        .join("|")
        .toLowerCase(),
      g = out.find((x) => x.k === k);
    if (!g) {
      g = { k, startDate: r.startDate, endDate: r.endDate, rows: [] };
      out.push(g);
    }
    g.rows.push(r);
  });
  return out;
}
function client(c) {
  const names = V(c.clientName)
    .filter((item) => item.type !== "label")
    .filter((item) => String(item.text || "").trim() !== "");

  const responsibilities = V(c.clientExperience)
    .filter((item) => item.type !== "label")
    .filter((item) => String(item.text || "").trim() !== "");

  const modules = V(c.clientModule)
    .filter((item) => item.type !== "label")
    .filter((item) => String(item.text || "").trim() !== "");

  const achievements = V(c.achievements)
    .filter((item) => item.type !== "label")
    .filter((item) => String(item.text || "").trim() !== "");

  const hasClientType =
    String(c.clientType || "").trim() !== "";

  const hasClientLocation =
    String(c.clientLocation || "").trim() !== "";

  const hasStartDate =
    String(c.startDate || "").trim() !== "";

  const hasEndDate =
    String(c.endDate || "").trim() !== "";

  const hasClientContent =
    names.length > 0 ||
    responsibilities.length > 0 ||
    modules.length > 0 ||
    achievements.length > 0 ||
    hasClientType ||
    hasClientLocation ||
    hasStartDate ||
    hasEndDate;

  // Hide the complete client block when every field is empty.
  if (!hasClientContent) {
    return "";
  }

  const clientNameHtml =
    names.length > 0
      ? `
        <div>
          <b>
            <i class="bi bi-building"></i>
            Client:
          </b>

          ${names
            .map(
              (item) => `
                <span class="client-badge">
                  ${E(item.text)}
                </span>
              `,
            )
            .join("")}
        </div>
      `
      : "";

  const clientDateHtml =
    hasStartDate || hasEndDate
      ? `
        <b class="client-date">
          ${range(c.startDate, c.endDate)}
        </b>
      `
      : "";

  const metadata = [
    c.clientType,
    c.clientLocation
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" • ");

  const metadataHtml = metadata
    ? `<div class="meta">${E(metadata)}</div>`
    : "";

  const responsibilitiesHtml =
    responsibilities.length > 0
      ? `
        <ul>
          ${responsibilities
            .map(
              (item) => `
                <li>${E(item.text)}</li>
              `,
            )
            .join("")}
        </ul>
      `
      : "";

  const modulesHtml = modules
    .map(
      (item) => `
        <span class="tag">
          ${E(item.text)}
        </span>
      `,
    )
    .join("");

  const achievementsHtml =
    achievements.length > 0
      ? `
        <div class="achievement">
          <h6>
            <i class="bi bi-trophy-fill"></i>
            Achievements
          </h6>

          ${achievements
            .map(
              (item) => `
                <div>
                  ${E(item.text)}

                  ${
                    item.proofHidden !== true &&
                    String(item.proofUrl || "").trim() !== ""
                      ? `
                        <br>
                          <a
                            target="_blank"
                            href="${E(item.proofUrl)}"
                            rel="noopener noreferrer"
                          >
                            <i class="bi bi-award-fill"></i>
                            Proof of Achievement
                          </a>
                      `
                      : ""
                  }
                </div>
              `,
            )
            .join("")}
        </div>
      `
      : "";

  return `
    <div class="client-card">
      ${
        clientNameHtml || clientDateHtml
          ? `
            <div class="client-head">
              ${clientNameHtml}
              ${clientDateHtml}
            </div>
          `
          : ""
      }

      ${metadataHtml}
      ${responsibilitiesHtml}
      ${modulesHtml}
      ${achievementsHtml}
    </div>
  `;
}
function experience() {
  $("#experience .content").innerHTML =
    iconTitle("bi-briefcase-fill", "Experiences") +
    groups()
      .map(
        (g) =>
          `<section class="timeline-group"><aside class="company-period">${range(g.startDate, g.endDate)}</aside><div class="company-records">${g.rows.map((r, i) => `<article class="experience-entry ${i ? "same-company" : ""}"><span class="timeline-dot"></span><h3>${E(r.jobTitle)}</h3><div class="company">${E(r.company)}</div><div class="meta">${E(r.employmentType)} • ${E(r.officeLocation)}</div>${V(r.clientDetails).map(client).join("")}</article>`).join("")}</div></section>`,
      )
      .join("");
}
function cards() {
  const allProjects = V(DATA.Projects);
  const allCertificates = V(DATA.Certificates);

  const featuredProjects = allProjects
    .filter((project) => project.featured !== false)
    .slice(0, 3);

  const featuredCertificates = allCertificates
    .filter(certificate => certificate.featured !== false)
    .sort(
      (a, b) =>
        (Number(a.sortOrder) || 999) -
        (Number(b.sortOrder) || 999),
    )
    .slice(0, 3);

  const projectsContainer = $("#projects .content");
  const certificatesContainer = $("#certificates .content");

  if (projectsContainer) {
    projectsContainer.innerHTML = `
      <div class="section-heading-row">
        ${iconTitle("bi-folder-fill", "Featured Projects")}
        <a class="btn btn-outline-primary btn-sm" href="projects.html">
          <i class="bi bi-grid-fill me-1"></i>
          Show All Projects (${allProjects.length})
        </a>
      </div>

      <div class="row g-3">
        ${featuredProjects
          .map(
            (project) => `
              <div class="col-md-4">
                <article class="card-ui item-card">
                  ${mediaThumb(project, "project", "bi-window-stack")}

                  <h5 class="mt-3">
                    <i class="bi bi-folder2-open accent me-2"></i>
                    ${E(project.title)}
                  </h5>

                  <p>${E(project.description)}</p>

                  <a href="project-detail.html?id=${encodeURIComponent(
                    project.firebaseKey ?? project.id,
                  )}">
                    <i class="bi bi-arrow-right-circle"></i>
                    View Details
                  </a>
                </article>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  if (certificatesContainer) {
    certificatesContainer.innerHTML = `
      <div class="section-heading-row">
        ${iconTitle("bi-patch-check-fill", "Certificates")}
        <a class="btn btn-outline-primary btn-sm" href="certificates.html">
          <i class="bi bi-grid-fill me-1"></i>
          Show All Certificates (${allCertificates.length})
        </a>
      </div>

      <div class="row g-3">
        ${featuredCertificates
          .map(
            (certificate) => `
              <div class="col-md-4">
                <article class="card-ui item-card">
                  ${mediaThumb(certificate, "certificate", "bi-award-fill")}

                  <h5 class="mt-3">
                    <i class="bi bi-award-fill accent me-2"></i>
                    ${E(certificate.title)}
                  </h5>

                  <p>${E(certificate.issuer)}</p>

                  <a href="certificate-detail.html?id=${encodeURIComponent(
                    certificate.firebaseKey ?? certificate.id,
                  )}">
                    <i class="bi bi-arrow-right-circle"></i>
                    View Details
                  </a>
                </article>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }
}
function connect() {
  let p = V(DATA.SiteProfile)[0] || {};
  $("#contact .content").innerHTML =
    `<div class="card-ui p-5 text-center">${iconTitle("bi-send-fill", p.connectTitle || "Let's Connect")}<p>${E(p.connectDescription)}</p><a class="btn btn-primary" href="mailto:${E(p.contactEmail)}"><i class="bi bi-envelope-fill"></i> ${E(p.contactButtonText || "Contact Me")}</a></div>`;
}
function list(type) {
  const all = V(DATA[type]).sort(
    (a, b) =>
      (Number(a.sortOrder) || 999) -
      (Number(b.sortOrder) || 999),
  );
  const q = $("#search");
  const cat = $("#category");
  const grid = $("#grid");
  const isProject = type === "Projects";

  const categories = [
    "All",
    ...new Set(
      all.map((item) =>
        isProject
          ? A(item.technologies)[0] || "Other"
          : item.issuer || item.certType || "Other",
      ),
    ),
  ];

  cat.innerHTML = categories
    .map((category) => `<option>${E(category)}</option>`)
    .join("");

  function draw() {
    const searchText = q.value.toLowerCase();
    const selectedCategory = cat.value;

    const filteredItems = all.filter(
      (item) =>
        (selectedCategory === "All" ||
          JSON.stringify(item).includes(selectedCategory)) &&
        JSON.stringify(item).toLowerCase().includes(searchText),
    );

    grid.innerHTML =
      filteredItems
        .map(
          (item) => `
            <div class="col-md-6 col-xl-4">
              <article class="card-ui item-card">
                ${mediaThumb(
                  item,
                  isProject ? "project" : "certificate",
                  isProject ? "bi-window-stack" : "bi-award-fill",
                )}

                <h3 class="h5 mt-3">
                  <i class="bi ${
                    isProject ? "bi-folder-fill" : "bi-patch-check-fill"
                  } accent me-2"></i>
                  ${E(item.title)}
                </h3>

                <p>${E(item.description || item.issuer)}</p>

                <a href="${
                  isProject ? "project" : "certificate"
                }-detail.html?id=${encodeURIComponent(
                  item.firebaseKey ?? item.id,
                )}">
                  <i class="bi bi-arrow-right-circle"></i>
                  View Details
                </a>
              </article>
            </div>
          `,
        )
        .join("") || "<p>No matching records.</p>";
  }

  q.oninput = draw;
  cat.onchange = draw;
  draw();
}
function mediaUrl(x, kind) {
  x = x || {};
  if (kind === "certificate")
    return x.imgLink || x.img || x.image || x.imageUrl || "";
  let first = A(x.images)[0] || {};
  return (
    x.previewImage ||
    x.imgLink ||
    x.img ||
    x.image ||
    x.imageUrl ||
    first.url ||
    first.src ||
    first.imageUrl ||
    ""
  );
}
function mediaThumb(x, kind, icon) {
  let url = mediaUrl(x, kind);
  if (!url)
    return `<div class="item-thumb media-fallback"><i class="bi ${icon}"></i></div>`;
  return `<div class="media-thumb"><img src="${E(url)}" alt="${E(x?.title || "Image")}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.remove('d-none')"><div class="item-thumb media-fallback d-none"><i class="bi ${icon}"></i></div></div>`;
}
function youtubeEmbed(url) {
  url = String(url || "").trim();
  if (!url) return "";
  try {
    let u = new URL(url),
      parts = u.pathname.split("/").filter(Boolean);
    if (u.hostname.includes("youtu.be"))
      return "https://www.youtube.com/embed/" + parts[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      let id = u.searchParams.get("v");
      if (id) return "https://www.youtube.com/embed/" + id;
      if (["shorts", "live"].includes(parts[0]) && parts[1])
        return "https://www.youtube.com/embed/" + parts[1];
    }
  } catch (e) {}
  return url;
}
function detailValue(value, fallback = "Not specified") {
  return value === true ? "Yes" : value === false ? "No" : value || fallback;
}
function detailTags(values) {
  return A(values)
    .map(
      (v) => `<span class="tag">${E(v.text || v.title || v.name || v)}</span>`,
    )
    .join("");
}
function projectRepositories(x) {
  return A(x.githubRepositories || x.repositories || x.githubRepository)
    .map(
      (r) =>
        `<a class="btn btn-dark btn-sm me-2 mb-2" href="${E(r.url || r.link || r.repositoryUrl || r)}" target="_blank" rel="noopener"><i class="bi bi-github"></i> ${E(r.label || r.title || r.name || "GitHub Repository")}</a>`,
    )
    .join("");
}
function detail(type) {
  let id = new URLSearchParams(location.search).get("id"),
    x =
      A(DATA[type]).find((v, i) => String(v.firebaseKey ?? v.id ?? i) === id) ||
      V(DATA[type])[0],
    p = type === "Projects";
  if (!x) {
    $("#detail").innerHTML =
      '<div class="alert alert-warning">Record not found.</div>';
    return;
  }

  const toolbar = $("#toolbar");

  if (toolbar) {
    toolbar.style.display = "none";
  }

  let gallery = V(x.images || x.gallery),
    videos = V(x.youtubeVideos || x.youtube || x.videos),
    features = A(x.features),
    skills = A(x.skills),
    platforms = x.platforms || x.platform,
    tools = x.tools,
    technologies = x.technologies;
  $("#detail").innerHTML =
    `<a class="back-link" href="${p ? "projects" : "certificates"}.html">
        <i class="bi bi-arrow-left"></i>
        ${p ? "All Projects" : "All Certificates"}
    </a>
        
        ${iconTitle(p ? "bi-folder-fill" : "bi-patch-check-fill", x.title)}${
      p
        ? `
 <article class="card-ui detail-panel project-detail-card">
  <div class="row g-4 align-items-start">
   <div class="col-lg-6"><div class="project-detail-preview">${mediaThumb(x, "project", "bi-window-stack")}</div></div>
   <div class="col-lg-6">
        ${
      String(x.category || "").trim() !== ""
        ? `
          <div class="project-category">
            <i class="bi bi-grid-fill"></i>
            ${E(x.category)}
          </div>
        `
        : ""
    }

    <h3 class="detail-subtitle">Description</h3>

    <p>${E(x.description || "No description provided.")}</p>
    ${x.descriptionLink ? `<p><a href="${E(x.descriptionLink)}" target="_blank" rel="noopener"><i class="bi bi-link-45deg"></i> Open Description Link</a></p>` : ""}
    ${features.length ? `<h3 class="detail-subtitle">Features</h3><ul class="detail-list">${features.map((v) => `<li>${E(v.text || v.title || v.name || v)}</li>`).join("")}</ul>` : ""}
    ${projectRepositories(x) ? `<h3 class="detail-subtitle">Repositories</h3><div>${projectRepositories(x)}</div>` : ""}
   </div>
  </div>
  <div class="detail-info-grid mt-4">
  ${
    A(skills).some(
      (skill) =>
        String(
          typeof skill === "object"
            ? skill.text || skill.title || skill.name || ""
            : skill,
        ).trim() !== "",
    )
      ? `
        <section class="detail-info-card">
          <h3>
            <i class="bi bi-person-check-fill accent"></i>
            Skills
          </h3>

          <div>
            ${detailTags(skills)}
          </div>
        </section>
      `
      : ""
  }  
   <section class="detail-info-card"><h3><i class="bi bi-window-stack accent"></i>Platforms</h3><div>
    ${detailTags(platforms) || '<span class="meta">Not specified</span>'}</div></section>
   <section class="detail-info-card"><h3><i class="bi bi-tools accent"></i>Tools Used</h3><div>
    ${detailTags(tools) || '<span class="meta">Not specified</span>'}</div></section>
   <section class="detail-info-card"><h3><i class="bi bi-cpu-fill accent"></i>Technologies</h3><div>
    ${detailTags(technologies) || '<span class="meta">Not specified</span>'}</div></section>
  </div>
  ${
    String(x.notes || "").trim() !== ""
      ? `
        <section class="project-notes">
          <h3>
            <i class="bi bi-sticky-fill"></i>
            Notes
          </h3>

          <p>${E(x.notes)}</p>
        </section>
      `
      : ""
  }     
  ${
    String(x.category || "").trim() !== ""
      ? `
        <div class="project-category">
          <i class="bi bi-grid-fill"></i>
          ${E(x.category)}
        </div>
      `
      : ""
  }   
  <h3 class="mt-5"><i class="bi bi-images accent"></i> Gallery</h3><div class="row gallery g-3">${gallery.length ? gallery.map((i) => `<div class="col-md-6 col-xl-4"><a href="${E(i.url || i.src || i.imageUrl)}" target="_blank" rel="noopener"><img src="${E(i.url || i.src || i.imageUrl)}" alt="${E(i.alt || i.title || "Project image")}" loading="lazy"></a>${i.title ? `<small>${E(i.title)}</small>` : ""}</div>`).join("") : '<p class="meta">No gallery images added.</p>'}</div>
  <h3 class="mt-5"><i class="bi bi-youtube text-danger"></i> YouTube Videos</h3><div class="row video g-3">${videos.length ? videos.map((v) => `<div class="col-md-6"><iframe src="${E(youtubeEmbed(v.url || v.videoUrl || v.link))}" title="${E(v.title || "Project video")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><b class="d-block mt-2">${E(v.title || "Project video")}</b></div>`).join("") : '<p class="meta">No videos added.</p>'}</div>
 </article>`
        : `
 <article class="card-ui detail-panel certificate-detail-card">
  <div class="row g-4 align-items-start">
   <div class="col-lg-5"><div class="certificate-image-frame">${mediaThumb(x, "certificate", "bi-award-fill")}</div></div>
   <div class="col-lg-7">
    ${x.awardMessage ? `<div class="award-message"><h3><i class="bi bi-trophy-fill"></i> Award Message</h3><p>${E(x.awardMessage)}</p></div>` : ""}
    <div class="certificate-field-grid mt-3">
     <div><span>Certificate Type</span><strong>${E(detailValue(x.certType))}</strong></div>
     <div><span>Issuer</span><strong>${E(detailValue(x.issuer))}</strong></div>
     <div><span>Issued</span><strong>${E(detailValue(x.issued))}</strong></div>
     <div><span>Expiration</span><strong>${E(detailValue(x.expiration, "No expiration"))}</strong></div>
     <div><span>Featured</span><strong>${E(detailValue(x.featured))}</strong></div>
     <div><span>Latest</span><strong>${E(detailValue(x.latest))}</strong></div>
    </div>
    ${x.verifyLink ? `<a class="btn btn-primary mt-4" href="${E(x.verifyLink)}" target="_blank" rel="noopener"><i class="bi bi-patch-check"></i> Verify Certificate</a>` : ""}
   </div>
  </div>
 </article>`
    }`;
}
(async () => {
  DATA = await load();
  theme();
  let page = document.body.dataset.page;
  if (page === "home") {
    home();
    applySectionSettings();
    nav();
  } else if (page === "projects") list("Projects");
  else if (page === "certificates") list("Certificates");
  else if (page === "project-detail") detail("Projects");
  else if (page === "certificate-detail") detail("Certificates");
})().catch((e) => {
  console.error(e);
  const box = $("#error");
  if (box) {
    box.classList.remove("d-none");
    box.innerHTML = "<b>Portfolio loading error:</b> " + E(e.message);
  } else {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="alert alert-danger position-fixed top-0 start-0 end-0" style="z-index:9999"><b>Portfolio loading error:</b> ' +
        E(e.message) +
        "</div>",
    );
  }
});
