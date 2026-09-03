"use strict";

const state = {
  lastAnalysis: null,
  requests: 12,
  practices: 0
};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

function setStatus(message, type = "normal") {
  const status = $("status");

  if (!status) return;

  status.textContent = "● " + message;

  if (type === "loading") {
    status.style.opacity = "0.7";
  } else {
    status.style.opacity = "1";
  }
}

function showError(message) {
  const result = $("analysisResult");

  if (!result) return;

  result.innerHTML = `
    <div style="
      padding:20px;
      border-radius:12px;
      background:#fff1f2;
      border:1px solid #fecdd3;
      color:#9f1239;
    ">
      <strong>Errore</strong>
      <p style="margin:8px 0 0;">${escapeHtml(message)}</p>
    </div>
  `;
}

function showAnalysis(data) {
  const result = $("analysisResult");

  if (!result) return;

  const missing = Array.isArray(data.missing)
    ? data.missing
    : [];

  const missingHtml = missing.length
    ? `<ul>${missing
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : "<p>Nessuna informazione evidente da richiedere.</p>";

  result.innerHTML = `
    <div class="fields">

      <div>
        <small>TIPO DI RICHIESTA</small>
        <strong>${escapeHtml(data.category || "Da classificare")}</strong>
      </div>

      <div>
        <small>PRIORITÀ</small>
        <strong>${escapeHtml(data.priority || "Normale")}</strong>
      </div>

      <div>
        <small>RIASSUNTO</small>
        <strong>${escapeHtml(data.summary || "")}</strong>
      </div>

    </div>

    <div class="missing">
      <b>INFORMAZIONI MANCANTI</b>
      ${missingHtml}
    </div>

    <div class="reply">
      <div>
        <b>✉ RISPOSTA SUGGERITA</b>
        <button id="copy">Copia</button>
      </div>

      <p id="reply">${escapeHtml(
        data.suggested_reply || "Nessuna risposta disponibile."
      ).replace(/\n/g, "<br>")}</p>
    </div>

    <div class="actions">
      <button class="secondary" id="modify">✎ Modifica</button>
      <button class="secondary" id="save">▱ Salva bozza</button>
      <button id="create" class="success">✓ Approva e crea pratica</button>
    </div>
  `;

  state.lastAnalysis = data;

  const copyButton = $("copy");

  if (copyButton) {
    copyButton.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(
          data.suggested_reply || ""
        );

        copyButton.textContent = "Copiata ✓";

        setTimeout(() => {
          copyButton.textContent = "Copia";
        }, 1500);

      } catch (error) {
        alert("Impossibile copiare il testo.");
      }
    });
  }

  const createButton = $("create");

  if (createButton) {
    createButton.addEventListener("click", function () {
      state.practices++;

      const total = $("total");
      const todo = $("todo");

      if (total) {
        total.textContent = Number(total.textContent || 12) + 1;
      }

      if (todo) {
        todo.textContent = Math.max(
          0,
          Number(todo.textContent || 4) - 1
        );
      }

      alert("Pratica creata correttamente.");
    });
  }

  const modifyButton = $("modify");

  if (modifyButton) {
    modifyButton.addEventListener("click", function () {
      const input = $("request");

      if (input) {
        input.focus();
      }
    });
  }

  const saveButton = $("save");

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      alert("Bozza salvata.");
    });
  }
}

async function analyzeRequest() {
  const input = $("request");
  const button = $("analyze");

  if (!input || !button) {
    alert("Errore: non riesco a trovare la richiesta o il pulsante.");
    return;
  }

  const text = input.value.trim();

  if (!text) {
    alert("Inserisci prima una richiesta.");
    return;
  }

  button.disabled = true;
  button.textContent = "Analisi in corso...";

  setStatus("Analisi in corso...", "loading");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        request: text
      })
    });

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "Il server ha restituito una risposta non valida."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || `Errore server (${response.status})`
      );
    }

    showAnalysis(data);

    setStatus("Analisi completata");

  } catch (error) {

    console.error(error);

    setStatus("Errore durante l'analisi");

    showError(
      error.message ||
      "Non è stato possibile completare l'analisi."
    );

  } finally {

    button.disabled = false;
    button.textContent = "✦ Analizza richiesta";
  }
}

function setup() {
  const button = $("analyze");

  if (button) {
    button.addEventListener("click", analyzeRequest);
  }

  const copyButton = $("copy");

  if (copyButton) {
    copyButton.addEventListener("click", async function () {
      const reply = $("reply");

      if (!reply) return;

      try {
        await navigator.clipboard.writeText(
          reply.innerText
        );

        copyButton.textContent = "Copiata ✓";

        setTimeout(() => {
          copyButton.textContent = "Copia";
        }, 1500);

      } catch (error) {
        alert("Impossibile copiare il testo.");
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}
