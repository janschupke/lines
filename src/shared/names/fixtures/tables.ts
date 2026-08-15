/**
 * Per-language accept/reject tables — the acceptance criterion for the
 * sanitization phase. mustAccept producing zero rejections is the guard
 * that keeps the filter from being too aggressive.
 */
interface LanguageFixture {
  lang: string;
  mustReject: string[];
  mustRejectObfuscated: string[];
  mustAccept: string[];
}

export const FIXTURES: LanguageFixture[] = [
  {
    lang: "en",
    mustReject: [
      "fuck",
      "shit",
      "cunt",
      "asshole",
      "bitch",
      "wanker",
      "faggot",
    ],
    mustRejectObfuscated: [
      "f u c k",
      "fvck",
      "sh1t",
      "fuuuuck",
      "f.u.c.k",
      "b1tch",
      "as5hole",
      "аss", // Cyrillic а homoglyph
      "shít", // diacritic
    ],
    mustAccept: [
      "Jan",
      "Ellie",
      "Scunthorpe",
      "Assassin",
      "Class",
      "Hancock",
      "Analyst",
      "Titan",
      "Cassandra",
      "Cocky-", // hyphen tail, still a name-ish string
    ],
  },
  {
    lang: "cs",
    mustReject: ["čurák", "debil", "kurva", "píča", "zmrd"],
    mustRejectObfuscated: ["curak", "kurvaaa", "k.u.r.v.a", "p1ča"],
    mustAccept: ["Honza", "Šárka", "Vojtěch", "Růžena", "Čeněk"],
  },
  {
    lang: "de",
    mustReject: ["arschloch", "fotze", "hurensohn", "wichser", "schlampe"],
    mustRejectObfuscated: ["f0tze", "wichsеr", "arsch-loch"],
    mustAccept: ["Jürgen", "Björn", "Grüße", "Müller", "Straßer"],
  },
  {
    lang: "es",
    mustReject: ["cabrón", "gilipollas", "puta", "mierda", "pendejo"],
    mustRejectObfuscated: ["put4", "m.i.e.r.d.a", "cabron"],
    mustAccept: ["José", "María", "Íñigo", "Núñez", "Rocío"],
  },
  {
    lang: "fr",
    mustReject: ["connard", "salope", "pute", "enculé", "merde"],
    mustRejectObfuscated: ["s a l o p e", "encule", "m3rde"],
    mustAccept: ["François", "Amélie", "Benoît", "Chloé", "Gérard"],
  },
  {
    lang: "it",
    mustReject: ["stronzo", "vaffanculo", "puttana", "cazzo", "troia"],
    mustRejectObfuscated: ["c4zzo", "str0nzo", "vaffancul0"],
    mustAccept: ["Giulia", "Niccolò", "Alessia", "Pietro", "Chiara"],
  },
  {
    lang: "pl",
    mustReject: ["chuj", "kurwa", "pierdol", "spierdalaj", "cipa"],
    mustRejectObfuscated: ["kurw4", "c.h.u.j", "kurwaaaa"],
    mustAccept: ["Łukasz", "Zofia", "Grzegorz", "Małgorzata", "Paweł"],
  },
  {
    lang: "pt",
    mustReject: ["caralho", "buceta", "foder", "puta", "viado"],
    mustRejectObfuscated: ["c4ralho", "b u c e t a", "put4"],
    mustAccept: ["João", "Conceição", "Luís", "Beatriz", "Antônio"],
  },
  {
    lang: "ru",
    mustReject: ["хуй", "пизда", "блядь", "ебать", "мудак"],
    mustRejectObfuscated: ["п.и.з.д.а", "бляяядь", "cука"],
    mustAccept: ["Иван", "Мария", "Дмитрий", "Ольга", "Сергей"],
  },
  {
    lang: "tr",
    mustReject: ["amcık", "orospu", "siktir", "yarrak", "pezevenk"],
    mustRejectObfuscated: ["s1ktir", "o.r.o.s.p.u", "amcik"],
    mustAccept: ["Ayşe", "Çağla", "Gökhan", "İbrahim", "Şule"],
  },
  {
    lang: "ar",
    mustReject: ["طيز", "شرموطة", "كس", "زب", "خول"],
    mustRejectObfuscated: ["ط.ي.ز", "ك س"],
    mustAccept: ["محمد", "فاطمة", "أحمد", "خديجة", "يوسف"],
  },
  {
    lang: "zh",
    mustReject: ["傻逼", "妈的", "操你妈", "王八蛋", "婊子"],
    mustRejectObfuscated: ["傻.逼", "操 你 妈"],
    mustAccept: ["王伟", "李娜", "张强", "刘洋", "陈静"],
  },
  {
    lang: "ja",
    mustReject: ["くたばれ", "まんこ", "ちんこ", "きちがい"],
    mustRejectObfuscated: ["ま.ん.こ", "ち ん こ"],
    mustAccept: ["さくら", "ひろし", "陽菜", "太郎", "美咲"],
  },
  {
    lang: "ko",
    mustReject: ["개새끼", "씨발", "병신", "좆", "창녀"],
    mustRejectObfuscated: ["씨.발", "병 신"],
    mustAccept: ["민준", "서연", "지후", "하은", "도윤"],
  },
];
