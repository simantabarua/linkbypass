const form = document.getElementById("link-form");
const resultsSection = document.getElementById("results-section");
const resultsPre = document.getElementById("results");
const copyButton = document.getElementById("copy-button");
const processing = document.getElementById("process");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const inputBox = document.getElementById("link-input");
  let input = inputBox.value.trim();

  if (!input) {
    alert("Please enter at least one URL.");
    return;
  }

  const links = extractLinks(input);

  if (links.size === 0) {
    inputBox.value = "No links found.";
    return;
  }

  inputBox.value = Array.from(links).join("\n");
  resultsSection.classList.remove("hidden");

  resultsPre.innerHTML = ""; // Use innerHTML for clickable links
  processing.innerText = "";

  let index = 1;

  for (const url of links) {
    processing.innerText = `⏳ Processing: ${url}`;

    try {
      const res = await fetch("/api/process-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: url }),
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      if (data.result) {
        appendResult(index++, data.result);
      } else {
        appendResult(index++, `❌ Failed: ${url}`);
      }
    } catch (err) {
      appendResult(index++, `❌ Error: ${url} (${err.message})`);
    }
  }

  processing.innerText = "✅ Done!";
});

copyButton.addEventListener("click", () => {
  const linksText = [...resultsPre.querySelectorAll("a")]
    .map((a) => a.href)
    .join("\n");

  navigator.clipboard
    .writeText(linksText)
    .then(() => alert("Copied to clipboard!"))
    .catch((err) => alert("Failed to copy text: " + err.message));
});

function appendResult(index, result) {
  const div = document.createElement("div");
  if (result.startsWith("http")) {
    div.innerHTML = `${index}. <a href="${result}" target="_blank" class="text-blue-600 underline">${result}</a>`;
  } else {
    div.textContent = `${index}. ${result}`;
  }
  resultsPre.appendChild(div);
}

function extractLinks(input) {
  input = input.replace(/\s+/g, " ");

  const htmlLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const plainUrlRegex = /https?:\/\/[^\s<>"']+/gi;

  const links = new Set();
  let match;

  while ((match = htmlLinkRegex.exec(input)) !== null) {
    links.add(match[1]);
  }

  const plainLinks = input.match(plainUrlRegex);
  if (plainLinks) {
    plainLinks.forEach((link) => links.add(link));
  }

  return links;
}
