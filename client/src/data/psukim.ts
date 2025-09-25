// Hebrew Bible verses (Psukim) data - First 4 verses of Parashat Toldot
export interface Pasuk {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  hebrew: string;
  transliteration: string;
  translation: string;
  audioUrl?: string;
}

export const psukim: Pasuk[] = [
  {
    id: 1,
    book: "בראשית",
    chapter: 25,
    verse: 19,
    hebrew: "וְאֵלֶּה תּוֹלְדֹת יִצְחָק בֶּן־אַבְרָהָם אַבְרָהָם הוֹלִיד אֶת־יִצְחָק",
    transliteration: "V'eleh toldot Yitzchak ben-Avraham; Avraham holid et-Yitzchak",
    translation: "And these are the generations of Isaac, Abraham's son: Abraham begot Isaac",
    audioUrl: "/audio/1.m4a"
  },
  {
    id: 2,
    book: "בראשית",
    chapter: 25,
    verse: 20,
    hebrew: "וַיְהִי יִצְחָק בֶּן־אַרְבָּעִים שָׁנָה בְּקַחְתּוֹ אֶת־רִבְקָה בַּת־בְּתוּאֵל הָאֲרַמִּי מִפַּדַּן אֲרָם אֲחוֹת לָבָן הָאֲרַמִּי לוֹ לְאִשָּׁה",
    transliteration: "Vayehi Yitzchak ben-arba'im shanah b'kachto et-Rivkah bat-B'tuel haArami miPaddan Aram, achot Lavan haArami, lo l'ishah",
    translation: "And Isaac was forty years old when he took Rebekah, the daughter of Bethuel the Aramean of Paddan-aram, the sister of Laban the Aramean, to be his wife",
    audioUrl: "/audio/2.m4a"
  },
  {
    id: 3,
    book: "בראשית",
    chapter: 25,
    verse: 21,
    hebrew: "וַיֶּעְתַּר יִצְחָק לַיהוָה לְנֹכַח אִשְׁתּוֹ כִּי עֲקָרָה הִוא וַיֵּעָתֶר לוֹ יְהוָה וַתַּהַר רִבְקָה אִשְׁתּוֹ",
    transliteration: "Vaye'etar Yitzchak l'Adonai l'nochach ishto ki akarah hi; vaye'ater lo Adonai vatahar Rivkah ishto",
    translation: "And Isaac prayed to the Lord for his wife, because she was barren; and the Lord granted his prayer, and Rebekah his wife conceived",
    audioUrl: "/audio/3.m4a"
  },
  {
    id: 4,
    book: "בראשית",
    chapter: 25,
    verse: 22,
    hebrew: "וַיִּתְרֹצְצוּ הַבָּנִים בְּקִרְבָּהּ וַתֹּאמֶר אִם־כֵּן לָמָּה זֶּה אָנֹכִי וַתֵּלֶךְ לִדְרֹשׁ אֶת־יְהוָה",
    transliteration: "Vayitrotzetzu habanim b'kirbah vatomer im-ken lamah zeh anochi; vatelech lidrosh et-Adonai",
    translation: "And the children struggled together within her; and she said, If it is so, why then am I this way? And she went to inquire of the Lord",
    audioUrl: "/audio/4.m4a"
  }
];
