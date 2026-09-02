const state = {
  requests: [],
  practices: [],
  minutes: 0
};

const $ = id => document.getElementById(id);

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".section").forEach(x => x.classList.remove("active-section"));

    btn.classList.add("active");
    $(btn.dataset.section).classList.add("active-section");
    $("pageTitle").textContent = btn.textContent;

    render();
  });
});

$("demoButton").addEventListener("click", () => {
  $("requestInput").value =
    "Buongiorno, vorrei sapere il prezzo del vostro servizio e quali documenti devo inviarvi per iniziare. Grazie.";

  $("requestInput").focus();
});

$("analyzeButton").addEventListener("click", async () => {
  const text = $("requestInput").value.trim();

  if (!text) {
    alert("Inserisci prima una richiesta.");
    return;
  }

  const button = $("analyzeButton");
  button.disabled = true;
  button.textContent = "Analisi in corso...";

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

    if (!response.ok) {
      throw new Error("API non disponibile");
    }

    const data = await response.json();

    showAnalysis(data, text);

  } catch (error) {
    showAnalysis(localAnalysis(text), text);

  } finally {
    button.disabled = false;
    button.textContent = "Analizza richiesta";
  }
});

function localAnalysis(text) {
  const missing = [];

  if (!/email|mail|telefono|tel/i.test(text)) {
    missing.push("recapito del cliente");
  }

  if (!/servizio|prodotto|preventivo|prezzo|costo/i.test(text)) {
    missing.push("servizio o prodotto richiesto");
  }

  return {
    category: "Richiesta commerciale",
    priority: text.length > 250 ? "Media" : "Normale",
    summary: text.length > 180
      ? text.slice(0, 177) + "..."
      : text,
    missing: missing,
    suggested_reply:
      "Buongiorno, grazie per averci contattato.\n\n" +
      "Saremo felici di aiutarla. Per procedere, può indicarci " +
      "il servizio di interesse e, se possibile, un recapito a cui ricontattarla?\n\n" +
      "Grazie."
  };
}

function showAnalysis(data, text) {

  state.requests.unshift({
    text: text,
    data: data
  });

  state.minutes += 5;

  $("analysisResult").innerHTML = `
    <div class="analysis-block">
      <strong>Categoria</strong>
      <span class="tag">
        ${escapeHtml(data.category || "Da classificare")}
      </span>
    </div>

    <div class="analysis-block">
      <strong>Priorità</strong>
      <span class="tag">
        ${escapeHtml(data.priority || "Normale")}
      </span>
    </div>

    <div class="analysis-block">
      <strong>Riassunto</strong>
      <div>
        ${escapeHtml(data.summary || text)}
      </div>
    </div>

    <div class="analysis-block">
      <strong>Dati mancanti</strong>
      <div>
        ${
          (data.missing || []).length
            ? data.missing
                .map(
                  item =>
                    `<span class="tag">${escapeHtml(item)}</span>`
                )
                .join("")
            : "Nessun dato evidente"
        }
      </div>
    </div>

    <div class="analysis-block">
      <strong>Risposta suggerita</strong>

      <div class="suggested">
        ${escapeHtml(
          data.suggested_reply || "Nessuna risposta disponibile"
        )}
      </div>
    </div>

    <button id="createPractice" class="primary full">
      Crea pratica
    </button>
  `;

  $("createPractice").addEventListener("click", () => {

    state.practices.unshift({
      title: data.summary || text,
      priority: data.priority || "Normale"
    });

    state.minutes += 3;

    render();

    alert("Pratica creata.");
  });

  render();
}

function render() {

  $("statRequests").textContent = state.requests.length;

  $("statPractices").textContent = state.practices.length;

  $("statTime").textContent =
    state.minutes + " min";

  $("requestCount").textContent =
    state.requests.length;

  $("practiceCount").textContent =
    state.practices.length;

  $("requestsList").innerHTML =
    state.requests.length
      ? state.requests
          .map(
            (request, index) => `
              <div class="list-item">
                <strong>
                  Richiesta #${state.requests.length - index}
                </strong>

                <div>
                  ${escapeHtml(
                    request.text.slice(0, 180)
                  )}
                </div>

                <small>
                  ${escapeHtml(
                    request.data.category || "Richiesta"
                  )}
                  ·
                  ${escapeHtml(
                    request.data.priority || "Normale"
                  )}
                </small>
              </div>
            `
          )
          .join("")
      : "Nessuna richiesta ancora.";

  $("practicesList").innerHTML =
    state.practices.length
      ? state.practices
          .map(
            (practice, index) => `
              <div class="list-item">
                <strong>
                  Pratica #${state.practices.length - index}
                </strong>

                <div>
                  ${escapeHtml(practice.title)}
                </div>

                <small>
                  Priorità:
                  ${escapeHtml(practice.priority)}
                </small>
              </div>
            `
          )
          .join("")
      : "Nessuna pratica ancora.";
}

function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}

render();
