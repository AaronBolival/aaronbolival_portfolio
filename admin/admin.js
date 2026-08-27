import { auth, database } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  ref,
  get,
  set,
  push,
  remove,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
const C = [
  "SectionSettings",
  "Navigation",
  "SiteProfile",
  "AboutMe",
  "WhatIDo",
  "Goals",
  "Objectives",
  "Education",
  "Skills",
  "SoftSkills",
  "Experiences",
  "Projects",
  "Certificates",
  "StatisticsSettings",
];
const SETTINGS_TEMPLATES = {
  Projects: {
    title: "",
    description: "",
    features: [""],
    descriptionLink: "",
    githubRepositories: [{ label: "GitHub Repository", url: "" }],
    previewImage: "",
    images: [{ url: "", alt: "" }],
    youtubeVideos: [{ title: "", url: "" }],
    platforms: [""],
    tools: [""],
    technologies: [""],
    featured: false,
    hidden: false,
  },
  Certificates: {
    title: "",
    awardMessage: "",
    certType: "SAP",
    expiration: "",
    featured: false,
    hidden: false,
    imgLink: "",
    issued: "",
    issuer: "",
    latest: false,
    verifyLink: "",
  },
  SectionSettings: {
    sectionId: "",
    title: "",
    sortOrder: 1,
    hidden: false,
    alternateBackground: false,
  },
  Navigation: {
    section: "",
    navbarText: "",
    quickLinkText: "",
    href: "",
    showInNavbar: true,
    showInQuickLinks: true,
    sortOrder: 1,
    hidden: false,
  },
  Experiences: {
    company: "",
    startDate: "",
    endDate: "",
    jobTitle: "",
    employmentType: "",
    officeLocation: "",
    tech: "SAP",
    clientDetails: [
        {
        clientName: [
            {
            text: "",
            hidden: false
            }
        ],
        clientType: "",
        clientLocation: "",
        startDate: "",
        endDate: "",
        clientExperience: [
            {
            text: "",
            hidden: false
            }
        ],
        clientModule: [
            {
            text: "",
            hidden: false
            }
        ],
        achievements: [
            {
            text: "",
            proofUrl: "",
            proofHidden: false,
            hidden: false
            }
        ],
        hidden: false
        }
    ],
    sortOrder: 1,
    hidden: false
    },
    Education: {
        school: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        location: "",
        description: "",
        sortOrder: 1,
        hidden: false
    }

};
const ARRAY_ITEM_TEMPLATES = {
  clientName: {
    text: "",
    hidden: false
  },

  clientExperience: {
    text: "",
    hidden: false
  },

  clientModule: {
    text: "",
    hidden: false
  },

  achievements: {
    text: "",
    proofUrl: "",
    proofHidden: false,
    hidden: false
  },

  clientDetails: {
    clientName: [
      {
        text: "",
        hidden: false
      }
    ],
    clientType: "",
    clientLocation: "",
    startDate: "",
    endDate: "",
    clientExperience: [
      {
        text: "",
        hidden: false
      }
    ],
    clientModule: [
      {
        text: "",
        hidden: false
      }
    ],
    achievements: [
      {
        text: "",
        proofUrl: "",
        proofHidden: false,
        hidden: false
      }
    ],
    hidden: false
  }
};
function getArrayPropertyName(path) {
  return path[path.length - 1];
}

let current = C[0],
  key = "",
  value = {};
const $ = (s) => document.querySelector(s),
  modal = bootstrap.Modal.getOrCreateInstance("#editor");
onAuthStateChanged(auth, (u) => (u ? init() : (location.href = "login.html")));
$("#logout").onclick = () => signOut(auth);
function init() {
  $("#menu").innerHTML = C.map(
    (x) => `<button class="navbtn" data-c="${x}">${x}</button>`,
  ).join("");
  document
    .querySelectorAll(".navbtn")
    .forEach((b) => (b.onclick = () => load(b.dataset.c)));
  load(current);
}
async function load(c) {
  current = c;
  $("#title").textContent = c;
  $("#help").textContent =
    c === "SectionSettings"
      ? "Edit section title, visibility, order, and background."
      : c === "Navigation"
        ? "Control navbar and quick links without editing JSON."
        : "Add and edit content using labeled fields.";
  document
    .querySelectorAll(".navbtn")
    .forEach((b) => b.classList.toggle("active", b.dataset.c === c));
  let d = (await get(ref(database, c))).val() || {};
  $("#records").innerHTML =
    Object.entries(d)
      .map(
        ([k, v]) =>
          `<div class="record record-summary"><div><b>${v.title || v.fullName || v.category || v.company || v.navbarText || v.degree || k}</b><div class="small text-secondary">${v.hidden === true ? "Hidden · " : ""}Key: ${k}</div></div><div><button class="btn btn-sm btn-outline-primary edit" data-k="${k}">Edit</button> <button class="btn btn-sm btn-outline-danger del" data-k="${k}">Delete</button></div></div>`,
      )
      .join("") || "<p>No records yet.</p>";
  document
    .querySelectorAll(".edit")
    .forEach((b) => (b.onclick = () => open(b.dataset.k, d[b.dataset.k])));
  document.querySelectorAll(".del").forEach(
    (b) =>
      (b.onclick = async () => {
        if (confirm("Delete this record?")) {
          await remove(ref(database, `${current}/${b.dataset.k}`));
          load(current);
        }
      }),
  );
}
function label(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
}
function field(k, v, path) {
  let p = [...path, k],
    id = p.join("__");
  if (Array.isArray(v)) return arrayField(k, v, p);
  if (v && typeof v === "object")
    return `<fieldset class="admin-array"><legend class="h6">${label(k)}</legend>${Object.entries(
      v,
    )
      .map(([a, b]) => field(a, b, p))
      .join("")}</fieldset>`;
  if (typeof v === "boolean")
    return `<label class="admin-field admin-check"><input type="checkbox" data-path="${p.join(".")}" ${v ? "checked" : ""}> ${label(k)}</label>`;
  let type = /date|issued|expiration/i.test(k)
      ? "date"
      : /email/i.test(k)
        ? "email"
        : /url|link|image|github|resume/i.test(k)
          ? "url"
          : /sortorder/i.test(k)
            ? "number"
            : "text",
    full = /description|message|responsibil/i.test(k);
  return `<div class="admin-field ${full ? "full" : ""}"><label for="${id}">${label(k)}</label>${full ? `<textarea id="${id}" class="form-control" data-path="${p.join(".")}">${v ?? ""}</textarea>` : `<input id="${id}" class="form-control" type="${type}" data-path="${p.join(".")}" value="${String(v ?? "").replaceAll('"', "&quot;")}">`}</div>`;
}
function arrayField(k, a, p) {
  let primitives = a.every((x) => typeof x !== "object");
  return `<div class="admin-array"><div class="admin-array-head"><b>${label(k)}</b><button type="button" class="btn btn-sm btn-outline-primary add-array" data-path="${p.join(".")}">Add Item</button></div>${a
    .map(
      (x, i) =>
        `<div class="admin-array-item"><div class="admin-array-actions"><button type="button" class="btn btn-sm btn-outline-danger remove-array" data-path="${p.join(".")}" data-i="${i}">Remove</button></div>${
          primitives
            ? field(String(i), x, p)
            : Object.entries(x)
                .map(([q, z]) => field(q, z, [...p, String(i)]))
                .join("")
        }</div>`,
    )
    .join("")}</div>`;
}
function open(k, v) {
  key = k;

  const predefinedTemplate = SETTINGS_TEMPLATES[current]
    ? structuredClone(SETTINGS_TEMPLATES[current])
    : {};

  value = {
    ...predefinedTemplate,
    ...structuredClone(v || {})
  };

  $("#editorTitle").textContent =
    (k ? "Edit " : "Add ") + current;

  render();
  modal.show();
}
function render() {
  $("#friendlyForm").innerHTML =
    Object.entries(value)
      .map(([k, v]) => field(k, v, []))
      .join("") || "<p>Add fields using the collection template.</p>";
document.querySelectorAll(".add-array").forEach((button) => {
  button.onclick = () => {
    // Preserve fields already populated before rebuilding the form.
    collect();

    const arrayPath = button.dataset.path.split(".");
    const targetArray = getPath(value, arrayPath);
    const propertyName = getArrayPropertyName(arrayPath);

    let newItem;

    // Use a permanent template even when the array is empty.
    if (ARRAY_ITEM_TEMPLATES[propertyName]) {
      newItem = structuredClone(
        ARRAY_ITEM_TEMPLATES[propertyName]
      );
    } else if (
      targetArray.length > 0 &&
      targetArray[0] &&
      typeof targetArray[0] === "object"
    ) {
      newItem = blank(
        structuredClone(targetArray[0])
      );
    } else {
      newItem = "";
    }

    targetArray.push(newItem);

    render();
  };
});

document.querySelectorAll(".remove-array").forEach((button) => {
  button.onclick = () => {
    // Preserve unsaved values in the other fields.
    collect();

    const arrayPath = button.dataset.path.split(".");
    const targetArray = getPath(value, arrayPath);
    const itemIndex = Number(button.dataset.i);

    if (
      Number.isInteger(itemIndex) &&
      itemIndex >= 0 &&
      itemIndex < targetArray.length
    ) {
      targetArray.splice(itemIndex, 1);
    }

    render();
  };
});

}
function getPath(o, p) {
  return p.reduce((a, k) => a[k], o);
}
function setPath(o, p, v) {
  let last = p.pop(),
    t = p.reduce((a, k) => a[k], o);
  t[last] = v;
}
function collect() {
  document
    .querySelectorAll(
      "#friendlyForm [data-path]:not(.add-array):not(.remove-array)",
    )
    .forEach((element) => {
      const path = element.dataset.path.split(".");

      let newValue;

      if (element.type === "checkbox") {
        newValue = element.checked;
      } else if (element.type === "number") {
        newValue =
          element.value === "" ? "" : Number(element.value);
      } else {
        newValue = element.value;
      }

      setPath(value, path, newValue);
    });
}
$("#add").onclick = async () => {
  const snapshot = await get(ref(database, current));
  const records = snapshot.val() || {};

  const predefinedTemplate = SETTINGS_TEMPLATES[current];
  const existingSample = Object.values(records)[0];

  let template;

  if (predefinedTemplate) {
    template = structuredClone(predefinedTemplate);
  } else if (existingSample) {
    template = blank(structuredClone(existingSample));
  } else {
    template = {
      title: "",
      hidden: false
    };
  }

  open("", template);
};
function blank(x) {
  if (Array.isArray(x)) return x.length ? [blank(x[0])] : [];
  if (x && typeof x === "object")
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, blank(v)]));
  if (typeof x === "boolean") return false;
  if (typeof x === "number") return 0;
  return "";
}
$("#save").onclick = async () => {
  collect();
  await set(
    key ? ref(database, `${current}/${key}`) : push(ref(database, current)),
    value,
  );
  modal.hide();
  load(current);
};
