export function getGeetestLang(lang) {
    const normalized = String(lang || "zh-cn")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");
    const map = {
        "zh-cn": "zho",
        "zh-hans": "zho",
        "zh-sg": "zho",
        zh: "zho",
        "zh-tw": "zho-tw",
        "zh-hant": "zho-tw",
        "zh-hant-tw": "zho-tw",
        "zh-hk": "zho-hk",
        "zh-mo": "zho-hk",
        "zh-hant-hk": "zho-hk",
        en: "eng",
        "en-us": "eng",
        "en-gb": "eng",
        "en-au": "eng",
        "en-ca": "eng",
        ja: "jpn",
        "ja-jp": "jpn",
        id: "ind",
        "id-id": "ind",
        ko: "kor",
        "ko-kr": "kor",
        ru: "rus",
        "ru-ru": "rus",
        ar: "ara",
        "ar-sa": "ara",
        "ar-eg": "ara",
        es: "spa",
        "es-es": "spa",
        "es-mx": "spa",
        "pt-br": "pon",
        pt: "por",
        "pt-pt": "por",
        fr: "fra",
        "fr-fr": "fra",
        "fr-ca": "fra",
        de: "deu",
        "de-de": "deu",
        ug: "udm",
        "ug-cn": "udm",
    };
    if (map[normalized]) return map[normalized];
    const main = normalized.split("-")[0];
    return map[main] || "eng";
}
