(() => {
  /**
   * @param {string} element
   * @returns {string}
   */
  function query(element) {
    return element
      .split(" ")
      .map((a) => `.${a}`)
      .join("")
      .trim();
  }

  const CONFIG = {
    QUERIES: {
      CERTIFICATIONS: query(
        "fd408067 _09f86c18 _196bac93 _3340f6ca d289137b _3e9e561e _4762b3a6 _758611e7"
      ),
      CERTIFICATION_TITLE: query(
        "_582b5678 ad128d9a _7101f607 _51d0f1db _0219a747 _1174534e _4b10c5d5 d256ff26 _32b59971"
      ),
      EXPEDITION_DATE: query(
        "_582b5678 d16d2c9f _7101f607 _51d0f1db _5bee054a _8d0af98d _4b10c5d5 _345919ad _32b59971"
      ),
      CERTIFICATION_ID: query(
        "_582b5678 d16d2c9f _7101f607 _51d0f1db _5bee054a _8d0af98d _4b10c5d5 _345919ad _32b59971"
      ),
      EXPEDITION_ENTERPRISE: query(
        "_582b5678 d16d2c9f _7101f607 _51d0f1db _5bee054a _8d0af98d _4b10c5d5 d256ff26 _32b59971"
      ),
    },
  };

  const MONTHS = {
    "ene.": 0,
    "feb.": 1,
    "mar.": 2,
    "abr.": 3,
    "may.": 4,
    "jun.": 5,
    "jul.": 6,
    "ago.": 7,
    "sept.": 8,
    "oct.": 9,
    "nov.": 10,
    "dic.": 11,
  };

  function parseDate(raw) {
    const input = raw.split(" ").slice(1).join(" ");

    const [month, year] = input.split(" ");

    const date = new Date(parseInt(year), MONTHS[month.toLowerCase()]);

    return [
      date.getFullYear(),
      (date.getMonth() + 1).toString().padStart(2, "0"),
      date.getDate().toString().padStart(2, "0"),
    ].join("/");
  }

  function toCsv(content) {
    return content
      .map((a) =>
        ["title", "enterprise", "id", "link", "expeditionDate", "expireDate"]
          .map((b) => a[b])
          .join("	")
      )
      .join("\n");
  }

  function toJson(content) {
    const sorted = content
      .map((entry) => {
        return Object.fromEntries(
          Object.entries(entry).toSorted(([a], [b]) => a.localeCompare(b))
        );
      })
      .toSorted((a, b) => a.expeditionDate.localeCompare(b.expeditionDate));

    return JSON.stringify(sorted, null, 4);
  }

  const content = [...document.querySelectorAll(CONFIG.QUERIES.CERTIFICATIONS)]
    .map((a) => ({
      title: a
        .querySelector(CONFIG.QUERIES.CERTIFICATION_TITLE)
        .innerText.trim(),
      expeditionDate: a
        .querySelector(CONFIG.QUERIES.EXPEDITION_DATE)
        .innerText.trim(),
      id: (() => {
        const elements = a.querySelectorAll(CONFIG.QUERIES.CERTIFICATION_ID);
        if (elements.length === 1) return "";

        return elements[1].innerText.trim();
      })(),
      enterprise: a
        .querySelector(CONFIG.QUERIES.EXPEDITION_ENTERPRISE)
        .innerText.trim(),
      link: decodeURIComponent(
        a.querySelectorAll("a")[1]?.href?.split("url=").at(-1)
      ),
    }))
    .map((a) => {
      if (a.expeditionDate.includes(" · ")) {
        const [expedited, expiry] = a.expeditionDate.split(" · ");
        a.expeditionDate = expedited;
        a.expireDate = parseDate(expiry);
      }

      return {
        ...a,
        id: a.id.split(" ").at(-1),
        expeditionDate: parseDate(a.expeditionDate),
        link: a.link ?? "",
      };
    })
    .sort((a, b) => a.expeditionDate - b.expeditionDate);

  console.log("CSV");
  console.log(toCsv(content));
  console.log("");

  console.log("JSON");
  console.log(toJson(content));
  console.log("");
})();
